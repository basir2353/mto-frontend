import type { Notification } from "@/lib/api/types";

export type NotificationMeta = {
  bookingId?: string;
  requestId?: string;
  quoteId?: string;
  paymentId?: string;
  disputeId?: string;
  counterofferId?: string;
};

function asStr(v: unknown): string | undefined {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return undefined;
}

export function getNotificationMeta(n: Notification): NotificationMeta {
  const m = (n.metadata ?? {}) as Record<string, unknown>;
  return {
    bookingId: asStr(m.bookingId),
    requestId: asStr(m.requestId),
    quoteId: asStr(m.quoteId),
    paymentId: asStr(m.paymentId),
    disputeId: asStr(m.disputeId),
    counterofferId: asStr(m.counterofferId),
  };
}

export type CustomerNotifAction =
  | { kind: "messages"; bookingId?: string }
  | { kind: "track"; bookingId?: string; requestId?: string; quoteId?: string }
  | { kind: "wallet"; bookingId?: string }
  | { kind: "history"; bookingId?: string }
  | { kind: "support" }
  | { kind: "home" };

export type DriverNotifAction =
  | { kind: "messages"; bookingId?: string }
  | { kind: "work"; workId?: string; bookingId?: string; requestId?: string; quoteId?: string }
  | { kind: "pay"; bookingId?: string }
  | { kind: "jobs" }
  | { kind: "overview" };

export type AdminNotifAction =
  | { kind: "bookings"; bookingId?: string }
  | { kind: "disputes"; disputeId?: string; bookingId?: string }
  | { kind: "users" }
  | { kind: "dashboard" };

export function resolveCustomerNotificationAction(n: Notification): CustomerNotifAction {
  const meta = getNotificationMeta(n);
  const type = n.type.toLowerCase();
  const text = `${n.title ?? ""} ${n.body ?? ""}`.toLowerCase();

  if (type.includes("message")) return { kind: "messages", bookingId: meta.bookingId };
  if (type.includes("payment")) return { kind: "wallet", bookingId: meta.bookingId };
  if (type.includes("review")) return { kind: "history", bookingId: meta.bookingId };
  if (type.includes("admin") || type.includes("dispute")) return { kind: "support" };
  if (text.includes("cancel")) {
    return { kind: "history", bookingId: meta.bookingId };
  }
  if (type.includes("quote") || type.includes("counter")) {
    return { kind: "track", bookingId: meta.bookingId, requestId: meta.requestId, quoteId: meta.quoteId };
  }
  if (meta.bookingId || type.includes("booking")) {
    return { kind: "track", bookingId: meta.bookingId, requestId: meta.requestId, quoteId: meta.quoteId };
  }
  if (meta.requestId || meta.quoteId) {
    return { kind: "track", requestId: meta.requestId, quoteId: meta.quoteId };
  }
  return { kind: "home" };
}

export function resolveDriverNotificationAction(n: Notification): DriverNotifAction {
  const meta = getNotificationMeta(n);
  const type = n.type.toLowerCase();

  if (type.includes("message")) return { kind: "messages", bookingId: meta.bookingId };
  if (type.includes("payment")) return { kind: "pay", bookingId: meta.bookingId };
  if (type.includes("quote") && !type.includes("counter") && !type.includes("booking")) {
    return { kind: "jobs" };
  }
  if (type.includes("counter") || type.includes("booking") || meta.bookingId || meta.requestId || meta.quoteId) {
    return {
      kind: "work",
      workId: meta.bookingId ?? meta.requestId,
      bookingId: meta.bookingId,
      requestId: meta.requestId,
      quoteId: meta.quoteId,
    };
  }
  return { kind: "overview" };
}

export function resolveAdminNotificationAction(n: Notification): AdminNotifAction {
  const meta = getNotificationMeta(n);
  const type = n.type.toLowerCase();

  if (type.includes("dispute") || meta.disputeId) {
    return { kind: "disputes", disputeId: meta.disputeId, bookingId: meta.bookingId };
  }
  if (meta.bookingId || type.includes("booking") || type.includes("payment") || type.includes("message")) {
    return { kind: "bookings", bookingId: meta.bookingId };
  }
  if (type.includes("admin")) return { kind: "users" };
  return { kind: "dashboard" };
}
