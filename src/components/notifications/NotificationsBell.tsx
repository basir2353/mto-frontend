"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { notificationsApi, type Notification } from "@/lib/api";
import { AppIcon, notificationTypeIcon, TypeIcon } from "@/components/ui/Icons";
import { enablePushNotifications } from "@/lib/push";
import { hasWebPush } from "@/lib/env";
import { BlockLoader } from "@/components/ui/MtoLoader";
import styles from "./NotificationsBell.module.css";

type Filter = "all" | "unread";

const PAGE_SIZE = 8;

function typeLabel(type: string) {
  const map: Record<string, string> = {
    quote_received: "Quote",
    booking_update: "Booking",
    payment: "Payment",
    admin: "Admin",
    message: "Message",
  };
  return map[type] ?? type.replace(/_/g, " ");
}

function typeIcon(type: string) {
  return <TypeIcon icon={notificationTypeIcon(type)} size={18} />;
}

export function NotificationsBell({
  dark = true,
  onOpenNotification,
}: {
  dark?: boolean;
  /** Navigate to the related detail page when a notification is clicked. */
  onOpenNotification?: (notification: Notification) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | "unsupported">(() =>
    hasWebPush && typeof Notification !== "undefined" ? Notification.permission : "unsupported",
  );

  const unread = items.filter((n) => !n.isRead).length;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await notificationsApi.list());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initial = setTimeout(() => void load(), 0);
    const t = setInterval(() => void load(), 30000);
    return () => {
      clearTimeout(initial);
      clearInterval(t);
    };
  }, [load]);

  const enableAlerts = async () => {
    await enablePushNotifications();
    setPushPermission(Notification.permission);
  };

  const visible = useMemo(() => {
    const sorted = [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return filter === "unread" ? sorted.filter((n) => !n.isRead) : sorted;
  }, [items, filter]);

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return visible.slice(start, start + PAGE_SIZE);
  }, [visible, currentPage]);

  const markOne = async (id: string) => {
    try {
      const updated = await notificationsApi.markRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? updated : n)));
    } catch {
      /* ignore */
    }
  };

  const openNotification = async (n: Notification) => {
    setOpen(false);
    try {
      if (onOpenNotification) await onOpenNotification(n);
    } finally {
      if (!n.isRead) void markOne(n.id);
    }
  };

  const markAll = async () => {
    try {
      await notificationsApi.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) {
            setPage(1);
            void load();
          }
        }}
        style={{
          position: "relative",
          width: 44,
          height: 44,
          borderRadius: 12,
          border: dark ? "1.5px solid rgba(255,255,255,.2)" : "1.5px solid rgba(0,0,0,.12)",
          background: dark ? "rgba(255,255,255,.08)" : "#fff",
          color: dark ? "#fff" : "#0E0E10",
          cursor: "pointer",
          font: "700 16px 'Hanken Grotesk'",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
        }}
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <AppIcon name="bell" size={18} color={dark ? "#fff" : "#0E0E10"} />
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              minWidth: 18,
              height: 18,
              borderRadius: 999,
              background: dark ? "var(--accent)" : "#0E0E10",
              color: dark ? "#0E0E10" : "#fff",
              border: dark ? "none" : "1.5px solid #fff",
              font: "800 10px 'Archivo'",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
              boxSizing: "border-box",
            }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            role="button"
            tabIndex={0}
            aria-label="Close notifications"
            style={{ position: "fixed", inset: 0, zIndex: 40 }}
            onClick={() => setOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setOpen(false);
            }}
          />
          <div
            className={styles.popover}
            role="dialog"
            aria-modal="true"
            aria-label="Notifications"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              width: 380,
              maxHeight: 520,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              background: "#fff",
              borderRadius: 14,
              border: "1.5px solid rgba(0,0,0,.12)",
              boxShadow: "0 16px 40px rgba(0,0,0,.18)",
              zIndex: 50,
            }}
          >
            <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(0,0,0,.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <b style={{ font: "800 16px 'Archivo'" }}>Notifications</b>
                {unread > 0 && (
                  <button type="button" onClick={() => void markAll()} style={{ border: "none", background: "transparent", font: "700 12px 'Hanken Grotesk'", color: "#6B6B70", cursor: "pointer" }}>
                    Mark all read
                  </button>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {pushPermission !== "unsupported" && pushPermission !== "granted" && (
                  <button
                    type="button"
                    disabled={pushPermission === "denied"}
                    onClick={() => void enableAlerts()}
                    style={{
                      height: 28,
                      padding: "0 10px",
                      borderRadius: 999,
                      border: "none",
                      background: "var(--accent)",
                      font: "700 11px 'Hanken Grotesk'",
                      cursor: pushPermission === "denied" ? "not-allowed" : "pointer",
                      opacity: pushPermission === "denied" ? 0.6 : 1,
                    }}
                  >
                    {pushPermission === "denied" ? "Alerts blocked" : "Enable alerts"}
                  </button>
                )}
                {(["all", "unread"] as Filter[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => {
                      setFilter(f);
                      setPage(1);
                    }}
                    style={{
                      height: 28,
                      padding: "0 10px",
                      borderRadius: 999,
                      border: filter === f ? "none" : "1px solid rgba(0,0,0,.12)",
                      background: filter === f ? "#0E0E10" : "#fff",
                      color: filter === f ? "#fff" : "#0E0E10",
                      font: "700 11px 'Hanken Grotesk'",
                      cursor: "pointer",
                      textTransform: "capitalize",
                    }}
                  >
                    {f} {f === "unread" && unread > 0 ? `(${unread})` : ""}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ overflow: "auto", flex: 1, minHeight: 0 }}>
              {loading && items.length === 0 ? (
                <BlockLoader label="Loading alerts…" minHeight={180} />
              ) : visible.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", font: "600 14px 'Hanken Grotesk'", color: "#8A8A90" }}>
                  {filter === "unread" ? "All caught up!" : "No notifications yet"}
                </div>
              ) : (
                pageItems.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => void openNotification(n)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      border: "none",
                      borderBottom: "1px solid rgba(0,0,0,.06)",
                      background: n.isRead ? "#fff" : "#fffbe6",
                      padding: "12px 16px",
                      cursor: onOpenNotification ? "pointer" : "default",
                    }}
                  >
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 18, lineHeight: 1 }}>{typeIcon(n.type)}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                          <div style={{ font: "700 14px 'Hanken Grotesk'" }}>{n.title}</div>
                          <span style={{ font: "700 10px 'Hanken Grotesk'", textTransform: "uppercase", color: "#8A8A90", flex: "none" }}>
                            {typeLabel(n.type)}
                          </span>
                        </div>
                        <div style={{ font: "500 13px 'Hanken Grotesk'", color: "#6B6B70", marginTop: 4 }}>{n.body}</div>
                        {n.metadata && Object.keys(n.metadata).length > 0 && (
                          <div style={{ font: "500 11px 'Hanken Grotesk'", color: "#9a9aa0", marginTop: 6 }}>
                            {Object.entries(n.metadata)
                              .slice(0, 3)
                              .map(([k, v]) => `${k}: ${String(v)}`)
                              .join(" · ")}
                          </div>
                        )}
                        <div style={{ font: "500 11px 'Hanken Grotesk'", color: "#9a9aa0", marginTop: 6 }}>
                          {new Date(n.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {visible.length > 0 && (
              <div
                style={{
                  flex: "none",
                  borderTop: "1px solid rgba(0,0,0,.08)",
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  background: "#FAFAF8",
                }}
              >
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  style={pagerBtn(currentPage <= 1)}
                  aria-label="Previous page"
                >
                  <AppIcon name="chevronLeft" size={16} color={currentPage <= 1 ? "#c0c0c4" : "#0E0E10"} />
                  Prev
                </button>

                <div style={{ font: "700 12px 'Hanken Grotesk'", color: "#6B6B70", textAlign: "center" }}>
                  Page {currentPage} of {totalPages}
                  <div style={{ font: "500 11px 'Hanken Grotesk'", color: "#9a9aa0", marginTop: 2 }}>
                    {visible.length} total
                  </div>
                </div>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  style={pagerBtn(currentPage >= totalPages)}
                  aria-label="Next page"
                >
                  Next
                  <AppIcon name="chevronRight" size={16} color={currentPage >= totalPages ? "#c0c0c4" : "#0E0E10"} />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function pagerBtn(disabled: boolean): React.CSSProperties {
  return {
    height: 34,
    padding: "0 12px",
    borderRadius: 10,
    border: "1.5px solid rgba(0,0,0,.12)",
    background: disabled ? "rgba(0,0,0,.04)" : "#fff",
    color: disabled ? "#c0c0c4" : "#0E0E10",
    font: "700 12px 'Hanken Grotesk'",
    cursor: disabled ? "not-allowed" : "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    opacity: disabled ? 0.7 : 1,
  };
}
