"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MoverAvatar } from "@/components/ui/AppUi";
import { BlockLoader } from "@/components/ui/MtoLoader";
import { BookingDisputeBanner } from "@/components/booking/BookingDisputeBanner";
import { DisputeThreadPanel } from "@/components/dispute/DisputeThreadPanel";
import { MessagePanel } from "@/components/move/JobPanels";
import { messagesApi } from "@/lib/api";
import type { Conversation } from "@/lib/api/types";
import styles from "./MessagesInbox.module.css";

function formatTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function previewText(conversation: Conversation) {
  const msg = conversation.lastMessage;
  if (!msg) return conversation.hasDispute ? "Dispute room opened" : "Start a conversation";
  if (msg.isSystem) return msg.content;
  return msg.content;
}

function ConversationRow({
  conversation,
  selected,
  onClick,
  driver,
}: {
  conversation: Conversation;
  selected: boolean;
  onClick: () => void;
  driver?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={driver ? `${styles.driverRow} ${selected ? styles.driverRowSelected : ""}` : undefined}
      style={{
        width: "100%",
        border: "none",
        borderBottom: "1px solid rgba(0,0,0,.06)",
        background: selected ? "#fff" : "transparent",
        padding: "14px 16px",
        display: "flex",
        gap: 12,
        alignItems: "center",
        textAlign: "left",
        cursor: "pointer",
      }}
    >
      <MoverAvatar name={conversation.partnerName} size={46} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
          <span style={{ font: "700 15px 'Hanken Grotesk'", color: "#0E0E10" }}>{conversation.partnerName}</span>
          <span style={{ font: "600 11px 'Hanken Grotesk'", color: "#8A8A90", flex: "none" }}>
            {formatTime(conversation.updatedAt)}
          </span>
        </div>
        <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8A8A90", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {conversation.routePreview}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 4, alignItems: "center" }}>
          <span
            style={{
              font: "500 13px 'Hanken Grotesk'",
              color: conversation.unreadCount > 0 ? "#0E0E10" : "#6B6B70",
              fontWeight: conversation.unreadCount > 0 ? 700 : 500,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {previewText(conversation)}
          </span>
          {conversation.unreadCount > 0 && (
            <span
              className={driver ? styles.driverUnread : undefined}
              style={{
                flex: "none",
                minWidth: 20,
                height: 20,
                borderRadius: 999,
                background: "#25D366",
                color: "#fff",
                font: "800 11px 'Archivo'",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 6px",
              }}
            >
              {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export function MessagesInbox({
  myUserId,
  selectedBookingId,
  onSelectBooking,
  variant = "default",
}: {
  myUserId: string;
  selectedBookingId?: string | null;
  onSelectBooking?: (bookingId: string | null) => void;
  variant?: "default" | "driver";
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(selectedBookingId ?? null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(Boolean(selectedBookingId));

  const refresh = useCallback(async () => {
    try {
      const list = await messagesApi.listConversations();
      setConversations(list);
      setError(null);
      setActiveId((current) => {
        if (selectedBookingId && list.some((c) => c.bookingId === selectedBookingId)) {
          return selectedBookingId;
        }
        if (current && list.some((c) => c.bookingId === current)) return current;
        return list[0]?.bookingId ?? null;
      });
    } catch (e) {
      const offline =
        e instanceof TypeError ||
        (e instanceof Error && /failed to fetch|network|connection refused/i.test(e.message));
      setError(
        offline
          ? "Cannot reach the server. Start the backend on port 4000 (npm run start:dev in MTO_Backend)."
          : e instanceof Error
            ? e.message
            : "Could not load conversations",
      );
    } finally {
      setLoading(false);
    }
  }, [selectedBookingId]);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 10000);
    return () => clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    if (selectedBookingId) {
      setActiveId(selectedBookingId);
      setMobileDetailOpen(true);
    }
  }, [selectedBookingId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.partnerName.toLowerCase().includes(q) ||
        c.routePreview.toLowerCase().includes(q) ||
        previewText(c).toLowerCase().includes(q),
    );
  }, [conversations, search]);

  const active = conversations.find((c) => c.bookingId === activeId) ?? null;
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const selectConversation = (bookingId: string) => {
    setActiveId(bookingId);
    setMobileDetailOpen(true);
    onSelectBooking?.(bookingId);
  };

  return (
    <div className={`${styles.inbox} ${variant === "driver" ? styles.driverInbox : ""}`} style={{ flex: 1, display: "flex", minHeight: 0, background: "#fff" }}>
      <div
        className={`${styles.list} ${variant === "driver" ? styles.driverList : ""} ${mobileDetailOpen ? styles.mobileHidden : ""}`}
        style={{
          width: 360,
          flex: "none",
          borderRight: "1px solid rgba(0,0,0,.08)",
          background: "#FAFAF8",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <div className={variant === "driver" ? styles.driverListHeader : undefined} style={{ padding: "18px 16px 12px", borderBottom: "1px solid rgba(0,0,0,.06)", background: "#F0F2F5" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ font: "800 20px 'Archivo'" }}>Messages</div>
            {totalUnread > 0 && (
              <span style={{ font: "700 12px 'Hanken Grotesk'", color: "#1f6b1f" }}>{totalUnread} unread</span>
            )}
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats…"
            style={{
              width: "100%",
              height: 38,
              borderRadius: 999,
              border: "none",
              background: "#fff",
              padding: "0 14px",
              font: "500 13px 'Hanken Grotesk'",
              outline: "none",
              boxShadow: "inset 0 0 0 1px rgba(0,0,0,.08)",
            }}
          />
        </div>

        <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
          {error && (
            <div style={{ margin: 16, padding: "12px 14px", borderRadius: 10, background: "#fff0f0", color: "#a8442a", font: "600 13px/1.45 'Hanken Grotesk'" }}>
              {error}
            </div>
          )}
          {loading && <BlockLoader label="Loading chats…" minHeight={160} />}
          {!loading && filtered.length === 0 && (
            <div style={{ padding: 20, font: "600 14px 'Hanken Grotesk'", color: "#8A8A90", lineHeight: 1.5 }}>
              {search.trim()
                ? "No chats match your search."
                : "No conversations yet. Book a mover or open an active job to start chatting."}
            </div>
          )}
          {filtered.map((conversation) => (
            <ConversationRow
              key={conversation.bookingId}
              conversation={conversation}
              selected={conversation.bookingId === activeId}
              onClick={() => selectConversation(conversation.bookingId)}
              driver={variant === "driver"}
            />
          ))}
        </div>
      </div>

      <div className={`${styles.detail} ${variant === "driver" ? styles.driverDetail : ""} ${mobileDetailOpen ? "" : styles.mobileHidden}`} style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, background: "#ECE5DD" }}>
        {!active ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              font: "600 15px 'Hanken Grotesk'",
              color: "#6B6B70",
            }}
          >
            Select a chat to start messaging
          </div>
        ) : (
          <>
            <div
              className={`${styles.chatHeader} ${variant === "driver" ? styles.driverChatHeader : ""}`}
              style={{
                padding: "14px 18px",
                background: "#F0F2F5",
                borderBottom: "1px solid rgba(0,0,0,.08)",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <button
                type="button"
                className={styles.backButton}
                onClick={() => {
                  setMobileDetailOpen(false);
                  onSelectBooking?.(null);
                }}
                aria-label="Back to conversations"
              >
                ←
              </button>
              <MoverAvatar name={active.partnerName} size={42} />
              <div style={{ minWidth: 0 }}>
                <div style={{ font: "800 16px 'Archivo'" }}>{active.partnerName}</div>
                <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#6B6B70", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {active.routePreview}
                  {active.hasDispute ? " · Dispute open" : ` · ${active.bookingStatus.replace(/_/g, " ")}`}
                </div>
              </div>
            </div>

            <div className={styles.thread} style={{ flex: 1, minHeight: 0, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              {active.hasDispute && (
                <BookingDisputeBanner
                  disputes={[
                    {
                      id: active.bookingId,
                      bookingId: active.bookingId,
                      raisedById: "",
                      reason: "Dispute in progress",
                      status: "open",
                      createdAt: active.updatedAt,
                      updatedAt: active.updatedAt,
                    },
                  ]}
                />
              )}
              {active.hasDispute ? (
                <DisputeThreadPanel
                  bookingId={active.bookingId}
                  myUserId={myUserId}
                  fillHeight
                />
              ) : (
                <MessagePanel
                  bookingId={active.bookingId}
                  partnerName={active.partnerName}
                  myUserId={myUserId}
                  hideHeader
                  fillHeight
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
