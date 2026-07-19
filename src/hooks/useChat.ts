"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { apiBaseUrl } from "@/lib/env";
import { messagesApi } from "@/lib/api";
import { useMocks } from "@/lib/api/mock/config";
import { getAccessToken } from "@/lib/session";
import type { Message } from "@/lib/api/types";

function wsOrigin() {
  try {
    const url = new URL(apiBaseUrl);
    return `${url.protocol}//${url.host}`;
  } catch {
    return "http://localhost:4000";
  }
}

export function useChat(bookingId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!bookingId) return;

    if (useMocks) {
      const poll = () => {
        messagesApi.list(bookingId).then((msgs) => {
          setConnected(true);
          setMessages((prev) => {
            const known = new Set(prev.map((m) => m.id));
            const additions = msgs.filter((m) => !known.has(m.id));
            return additions.length ? [...prev, ...additions] : prev;
          });
        });
      };
      poll();
      const t = setInterval(poll, 3000);
      return () => clearInterval(t);
    }

    const token = getAccessToken();
    if (!token) return;

    const socket = io(`${wsOrigin()}/chat`, {
      auth: { token },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("joinBooking", bookingId);
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("newMessage", (msg: Message) => {
      if (msg.bookingId === bookingId) {
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [bookingId]);

  const setInitialMessages = (msgs: Message[]) => setMessages(msgs);

  const sendViaSocket = (content: string) => {
    socketRef.current?.emit("sendMessage", { bookingId, content });
  };

  return { messages, setInitialMessages, sendViaSocket, connected };
}
