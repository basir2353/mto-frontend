"use client";

import type { Message } from "@/lib/api/types";
import { apiOrigin } from "@/lib/env";

function mediaUrl(url?: string | null) {
  if (!url) return "";
  if (/^(https?|blob|data):/i.test(url)) return url;
  return `${apiOrigin}${url.startsWith("/") ? url : `/${url}`}`;
}

export function ChatMessageContent({
  message,
  dark = false,
}: {
  message: Message;
  dark?: boolean;
}) {
  const type = message.messageType ?? "text";
  const textColor = dark ? "#fff" : "#0E0E10";

  if (type === "image" && message.attachmentUrl) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <a href={mediaUrl(message.attachmentUrl)} target="_blank" rel="noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element -- unknown natural dimensions + remote upload host isn't guaranteed to be in next.config.ts remotePatterns */}
          <img
            src={mediaUrl(message.attachmentUrl)}
            alt="Shared photo"
            style={{ maxWidth: "100%", maxHeight: 220, borderRadius: 10, display: "block" }}
          />
        </a>
        {message.content && message.content !== "Photo" && message.content !== "Dispute evidence photo" && (
          <span style={{ font: "500 13px/1.4 'Hanken Grotesk'", color: textColor }}>{message.content}</span>
        )}
      </div>
    );
  }

  if (type === "voice" && message.attachmentUrl) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 200 }}>
        <audio controls src={mediaUrl(message.attachmentUrl)} style={{ width: "100%", maxWidth: 280 }} />
        <span style={{ font: "500 12px 'Hanken Grotesk'", color: dark ? "rgba(255,255,255,.75)" : "#6B6B70" }}>
          Voice message
        </span>
      </div>
    );
  }

  return <span style={{ font: "500 13px/1.4 'Hanken Grotesk'", color: textColor }}>{message.content}</span>;
}
