"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useChat } from "@/hooks/useChat";
import { messagesApi } from "@/lib/api";
import type { Message } from "@/lib/api/types";
import { partyDisplayName } from "@/lib/displayNames";
import { ChatComposer } from "@/components/messaging/ChatComposer";
import { ChatMessageContent } from "@/components/messaging/ChatMessageContent";

export function DisputeThreadPanel({
  bookingId,
  myUserId,
  compact = false,
  fillHeight = false,
}: {
  bookingId: string;
  myUserId: string;
  compact?: boolean;
  fillHeight?: boolean;
}) {
  const chat = useChat(bookingId);
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const messages = useMemo(() => {
    const seen = new Set(chat.messages.map((m) => m.id));
    return [...chat.messages, ...optimisticMessages.filter((m) => !seen.has(m.id))];
  }, [chat.messages, optimisticMessages]);

  const refresh = useCallback(() => {
    messagesApi.list(bookingId).then((msgs) => {
      chat.setInitialMessages(msgs);
      setOptimisticMessages([]);
      void messagesApi.markRead(bookingId);
    });
  }, [bookingId, chat]);

  useEffect(() => {
    if (!bookingId) return;
    refresh();
  }, [bookingId, refresh]);

  const onSent = (message: Message) => {
    setOptimisticMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
  };

  return (
    <div
      style={{
        border: "1.5px solid rgba(0,0,0,.08)",
        borderRadius: 14,
        overflow: "hidden",
        background: "#fff",
        display: fillHeight ? "flex" : undefined,
        flexDirection: fillHeight ? "column" : undefined,
        flex: fillHeight ? 1 : undefined,
        minHeight: fillHeight ? 0 : undefined,
      }}
    >
      {!fillHeight && (
        <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(0,0,0,.08)" }}>
          <div style={{ font: "800 14px var(--font-archivo)" }}>Dispute room</div>
          <div style={{ font: "500 12px var(--font-hanken)", color: "#6B6B70", marginTop: 4 }}>
            Send text, photos, or voice messages. Customer, admin, and mover are all here.
          </div>
        </div>
      )}

      <div
        style={{
          minHeight: compact ? 100 : fillHeight ? 0 : 160,
          maxHeight: compact ? 180 : fillHeight ? undefined : 260,
          flex: fillHeight ? 1 : undefined,
          overflow: "auto",
          padding: 14,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {messages.length === 0 && (
          <div style={{ font: "500 13px var(--font-hanken)", color: "#6B6B70" }}>
            Dispute opened. Share photos, voice notes, or text here.
          </div>
        )}
        {messages.map((m, i) =>
          m.isSystem ? (
            <div
              key={m.id ?? i}
              style={{
                alignSelf: "center",
                maxWidth: "92%",
                padding: "8px 12px",
                borderRadius: 10,
                background: "#f5f4ef",
                font: "600 12px/1.45 var(--font-hanken)",
                color: "#5a5a60",
                textAlign: "center",
              }}
            >
              {m.content}
            </div>
          ) : (
            <div
              key={m.id ?? i}
              style={{
                alignSelf: m.senderId === myUserId ? "flex-end" : "flex-start",
                maxWidth: "80%",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div
                style={{
                  font: "700 11px var(--font-hanken)",
                  color: "#8A8A90",
                  textAlign: m.senderId === myUserId ? "right" : "left",
                }}
              >
                {m.senderId === myUserId ? "You" : partyDisplayName(m.sender)}
              </div>
              <div
                style={
                  m.senderId !== myUserId
                    ? {
                        background: "#F5F4EF",
                        borderRadius: "14px 14px 14px 4px",
                        padding: "10px 12px",
                      }
                    : {
                        background: "#0E0E10",
                        color: "#fff",
                        borderRadius: "14px 14px 4px 14px",
                        padding: "10px 12px",
                      }
                }
              >
                <ChatMessageContent message={m} dark={m.senderId === myUserId} />
              </div>
            </div>
          ),
        )}
      </div>

      <ChatComposer bookingId={bookingId} placeholder="Message the dispute room…" onSent={onSent} />
    </div>
  );
}
