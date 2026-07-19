"use client";

import { useRef, useState } from "react";
import { messagesApi, uploadsApi } from "@/lib/api";
import type { Message, MessageType } from "@/lib/api/types";
import { AppIcon } from "@/components/ui/Icons";
import styles from "./ChatComposer.module.css";

type SendPayload = {
  content?: string;
  messageType?: MessageType;
  attachmentUrl?: string;
  attachmentMimeType?: string;
};

export function ChatComposer({
  bookingId,
  disabled = false,
  placeholder = "Type a message…",
  onSent,
}: {
  bookingId: string | null;
  disabled?: boolean;
  placeholder?: string;
  onSent?: (message: Message) => void;
}) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const sendPayload = async (payload: SendPayload) => {
    if (!bookingId || disabled || busy) return;
    setBusy(true);
    setError(null);
    try {
      const saved = await messagesApi.send(bookingId, payload);
      onSent?.(saved);
      if (payload.messageType === "text" || !payload.messageType) {
        setDraft("");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send message");
    } finally {
      setBusy(false);
    }
  };

  const sendText = () => {
    if (!draft.trim()) return;
    void sendPayload({ content: draft.trim(), messageType: "text" });
  };

  const uploadAndSend = async (file: File, messageType: MessageType) => {
    const uploaded = await uploadsApi.upload(file);
    await sendPayload({
      content: messageType === "image" ? "Photo" : "Voice message",
      messageType,
      attachmentUrl: uploaded.url,
      attachmentMimeType: file.type,
    });
  };

  const onImagePick = async (file?: File | null) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      await uploadAndSend(file, "image");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not upload image");
      setBusy(false);
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Voice messages are not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type });
        try {
          await uploadAndSend(file, "voice");
        } catch (e) {
          setError(e instanceof Error ? e.message : "Could not send voice message");
          setBusy(false);
        }
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setError(null);
    } catch {
      setError("Microphone permission is required for voice messages.");
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  };

  return (
    <div className={styles.composer} style={{ padding: 12, borderTop: "1px solid rgba(0,0,0,.08)" }}>
      {error && (
        <div style={{ marginBottom: 8, font: "600 12px 'Hanken Grotesk'", color: "#a8442a" }}>{error}</div>
      )}
      <div className={styles.row} style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          disabled={disabled || busy || !bookingId}
          title="Send photo"
          style={iconBtn}
        >
          <AppIcon name="camera" size={18} color="#0E0E10" />
        </button>
        <button
          type="button"
          onClick={() => (recording ? stopRecording() : void startRecording())}
          disabled={disabled || busy || !bookingId}
          title={recording ? "Stop recording" : "Record voice message"}
          style={{ ...iconBtn, background: recording ? "#ffe8e8" : "#fff" }}
        >
          {recording ? <AppIcon name="square" size={18} color="#B42318" /> : <AppIcon name="mic" size={18} color="#0E0E10" />}
        </button>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void sendText()}
          disabled={disabled || !bookingId || busy || recording}
          placeholder={disabled ? "Chat locked" : placeholder}
          style={{
            flex: 1,
            height: 42,
            borderRadius: 999,
            border: "1.5px solid rgba(0,0,0,.14)",
            padding: "0 14px",
            font: "500 13px 'Hanken Grotesk'",
            outline: "none",
          }}
        />
        <button
          type="button"
          onClick={() => void sendText()}
          disabled={disabled || !bookingId || busy || recording || !draft.trim()}
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            border: "none",
            background: "var(--accent)",
            font: "800 16px 'Archivo'",
            cursor: disabled || !bookingId || busy || !draft.trim() ? "not-allowed" : "pointer",
            opacity: disabled || !bookingId || busy || !draft.trim() ? 0.5 : 1,
          }}
        >
          <AppIcon name="send" size={18} color="#0E0E10" />
        </button>
      </div>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          void onImagePick(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: "50%",
  border: "1.5px solid rgba(0,0,0,.12)",
  background: "#fff",
  font: "16px 'Archivo'",
  cursor: "pointer",
  flex: "none",
};
