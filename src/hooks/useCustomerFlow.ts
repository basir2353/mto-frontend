"use client";

import { useCallback, useState } from "react";
import {
  bookingsApi,
  customersApi,
  messagesApi,
  type Booking,
  type Message,
  type MovingRequest,
  type Quote,
} from "@/lib/api";
import { isTrackableBooking } from "@/lib/bookingFlow";
import { partyDisplayName } from "@/lib/displayNames";

function toIsoDate(input: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  const parsed = Date.parse(input);
  if (!Number.isNaN(parsed)) return new Date(parsed).toISOString().slice(0, 10);
  const future = new Date();
  future.setDate(future.getDate() + 7);
  return future.toISOString().slice(0, 10);
}

export function useCustomerFlow() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeRequest, setActiveRequest] = useState<MovingRequest | null>(null);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [requests, setRequests] = useState<MovingRequest[]>([]);

  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const publishRequest = useCallback(
    async (input: {
      pickup: string;
      destination: string;
      moveDate: string;
      items: Array<{ name: string; qty: number }>;
      notes?: string;
      estimatedPrice?: number;
      distanceKm?: number | null;
    }) => {
      const result = await run(() =>
        customersApi.createRequest({
          pickupAddress: input.pickup,
          destinationAddress: input.destination,
          movingDate: toIsoDate(input.moveDate),
          items: input.items.map((i) => ({ name: i.name, quantity: i.qty })),
          additionalNotes: input.notes,
          estimatedPrice: input.estimatedPrice,
          ...(input.distanceKm != null && Number.isFinite(input.distanceKm)
            ? { distanceKm: Number(input.distanceKm.toFixed(2)) }
            : {}),
        }),
      );
      if (result) {
        setActiveRequest(result);
        setRequests((prev) => {
          const without = prev.filter((r) => r.id !== result.id);
          return [result, ...without];
        });
      }
      return result;
    },
    [run],
  );

  const refreshRequest = useCallback(
    async (id: string) => {
      const result = await run(() => customersApi.getRequest(id));
      if (result) {
        setActiveRequest(result);
        setRequests((prev) => prev.map((r) => (r.id === result.id ? result : r)));
      }
      return result;
    },
    [run],
  );

  const acceptQuote = useCallback(
    async (requestId: string, quoteId: string, paymentMethod: "cash_on_site" | "wallet" = "cash_on_site") => {
      const result = await run(() => customersApi.acceptQuote(requestId, quoteId, paymentMethod));
      if (result) {
        const full = await run(() => customersApi.getBooking(result.id));
        setActiveBooking(full ?? result);
        await refreshRequest(requestId);
      }
      return result;
    },
    [run, refreshRequest],
  );

  const sendCounteroffer = useCallback(
    async (requestId: string, quoteId: string, price: number, notes?: string) => {
      const result = await run(() => customersApi.counteroffer(requestId, quoteId, price, notes));
      if (result) await refreshRequest(requestId);
      return result;
    },
    [run, refreshRequest],
  );

  const loadBookings = useCallback(async () => {
    const result = await run(() => customersApi.listBookings());
    if (result) setBookings(result);
    return result;
  }, [run]);

  const selectTrackableBooking = useCallback(
    async (bookingId?: string) => {
      let list = bookings;
      if (!list.length) {
        list = (await run(() => customersApi.listBookings())) ?? [];
        if (list.length) setBookings(list);
      }

      const trackable = list.filter((b) => isTrackableBooking(b));
      const target = bookingId ? trackable.find((b) => b.id === bookingId) : trackable[0];
      if (!target) return null;

      const full = await run(() => customersApi.getBooking(target.id));
      if (full) setActiveBooking(full);
      return full;
    },
    [bookings, run],
  );

  const loadBooking = useCallback(
    async (id: string) => {
      const result = await run(() => customersApi.getBooking(id));
      if (result) setActiveBooking(result);
      return result;
    },
    [run],
  );

  const loadMessages = useCallback(
    async (bookingId: string) => run(() => messagesApi.list(bookingId)),
    [run],
  );

  const sendMessage = useCallback(
    async (bookingId: string, content: string) => {
      const result = await run(() => messagesApi.send(bookingId, content));
      return result;
    },
    [run],
  );

  const loadTracking = useCallback(
    async (bookingId: string) => run(() => bookingsApi.getTracking(bookingId)),
    [run],
  );

  const submitReview = useCallback(
    async (bookingId: string, rating: number, comment?: string) => {
      const result = await run(() => customersApi.submitReview(bookingId, rating, comment));
      if (result) await loadBooking(bookingId);
      return result;
    },
    [run, loadBooking],
  );

  const submitPayment = useCallback(
    async (bookingId: string, amount: number, kind: "job" | "tip" = "job") => {
      const result = await run(() => customersApi.payFromWallet(bookingId, kind, kind === "tip" ? amount : undefined));
      return result;
    },
    [run],
  );

  const confirmCashPayment = useCallback(
    async (bookingId: string, amount: number) => {
      const result = await run(() =>
        customersApi.createPayment(bookingId, amount, "job", `CASH-${Date.now()}`),
      );
      if (result) await loadBooking(bookingId);
      return result;
    },
    [run, loadBooking],
  );

  const topUpWallet = useCallback(
    async (amount: number) => run(() => customersApi.topUpWallet(amount)),
    [run],
  );

  const loadInvoice = useCallback(
    async (bookingId: string, kind: "job" | "tip" = "job", amount?: number) =>
      run(() => customersApi.getInvoice(bookingId, kind, amount)),
    [run],
  );

  const rebook = useCallback(
    async (bookingId: string) => {
      const result = await run(() => bookingsApi.rebook(bookingId));
      if (result) setActiveBooking(result);
      return result;
    },
    [run],
  );

  const duplicateBooking = useCallback(
    async (bookingId: string) => {
      const result = await run(() => bookingsApi.duplicate(bookingId));
      if (result) {
        setActiveBooking(result);
        setBookings((prev) => [result, ...prev]);
      }
      return result;
    },
    [run],
  );

  const cancelBooking = useCallback(
    async (bookingId: string, reason?: string) => {
      const result = await run(() => customersApi.cancelBooking(bookingId, reason));
      if (result) {
        setActiveBooking(result);
        setBookings((prev) => prev.map((b) => (b.id === result.id ? result : b)));
      }
      return result;
    },
    [run],
  );

  const createDispute = useCallback(
    async (bookingId: string, reason: string, evidenceUrls?: string[]) => {
      const result = await run(() => customersApi.createDispute(bookingId, reason, evidenceUrls));
      if (!result) throw new Error("Could not submit dispute. Please try again.");
      return result;
    },
    [run],
  );

  const rescheduleBooking = useCallback(
    async (bookingId: string, scheduledDate: string) => {
      const iso = scheduledDate.includes("T") ? scheduledDate : `${scheduledDate}T12:00:00.000Z`;
      const result = await run(() => bookingsApi.reschedule(bookingId, iso));
      if (result) {
        setActiveBooking(result);
        setBookings((prev) => prev.map((b) => (b.id === result.id ? result : b)));
      }
      return result;
    },
    [run],
  );

  const shareBooking = useCallback(
    async (bookingId: string, expiresInHours = 72) => {
      const result = await run(() => bookingsApi.share(bookingId, expiresInHours));
      if (result?.shareUrl) return result;
      if (result?.shareToken) {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        return { ...result, shareUrl: `${origin}/track/${result.shareToken}` };
      }
      return result;
    },
    [run],
  );

  const markMessagesRead = useCallback(
    async (bookingId: string) => run(() => messagesApi.markRead(bookingId)),
    [run],
  );

  const loadTimeline = useCallback(
    async (bookingId: string) => run(() => bookingsApi.getTimeline(bookingId)),
    [run],
  );

  const quotesFromRequest = (request: MovingRequest | null): Quote[] => request?.quotes ?? [];

  const loadRequests = useCallback(async () => {
    const result = await run(() => customersApi.listRequests());
    if (result) setRequests(result);
    return result;
  }, [run]);

  const selectRequest = useCallback(
    async (id: string) => {
      const full = await run(() => customersApi.getRequest(id));
      if (full) {
        setActiveRequest(full);
        setRequests((prev) => prev.map((r) => (r.id === full.id ? full : r)));
      }
      return full;
    },
    [run],
  );

  const restoreActiveRequest = useCallback(
    async (requestId?: string) => {
      const list = (await run(() => customersApi.listRequests())) ?? [];
      if (list.length) setRequests(list);

      const open = list.filter((r) => ["pending", "active"].includes(r.status));
      const target = requestId
        ? list.find((r) => r.id === requestId) ?? open[0] ?? list[0]
        : open[0] ?? list[0];
      if (!target) return null;

      const full = await run(() => customersApi.getRequest(target.id));
      if (full) {
        setActiveRequest(full);
        setRequests(list.map((r) => (r.id === full.id ? full : r)));
      }
      return full;
    },
    [run],
  );

  const openRequests = requests.filter((r) => ["pending", "active"].includes(r.status));

  const trackableBookings = bookings.filter((b) => isTrackableBooking(b));

  return {
    loading,
    error,
    clearError: () => setError(null),
    activeRequest,
    activeBooking,
    setActiveBooking,
    bookings,
    requests,
    openRequests,
    trackableBookings,
    publishRequest,
    refreshRequest,
    restoreActiveRequest,
    loadRequests,
    selectRequest,
    acceptQuote,
    sendCounteroffer,
    loadBookings,
    selectTrackableBooking,
    loadBooking,
    loadMessages,
    sendMessage,
    loadTracking,
    submitReview,
    submitPayment,
    confirmCashPayment,
    topUpWallet,
    loadInvoice,
    rebook,
    duplicateBooking,
    cancelBooking,
    createDispute,
    rescheduleBooking,
    shareBooking,
    markMessagesRead,
    loadTimeline,
    quotesFromRequest,
  };
}

export type ChatMessage = { from: "me" | "them"; text: string; id?: string; senderName?: string };

export function mapApiMessages(messages: Message[], myUserId: string): ChatMessage[] {
  return messages.map((m) => ({
    id: m.id,
    from: m.senderId === myUserId ? "me" : "them",
    text: m.content,
    senderName: m.senderId === myUserId ? "You" : partyDisplayName(m.sender),
  }));
}
