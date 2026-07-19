import { api } from "./client";
import type { Booking, Conversation, Message, MessageType, MoverProfile, MovingRequest, Quote, QuoteCounteroffer, TrackingEvent } from "./types";

export const moversApi = {
  upsertProfile: (body: {
    businessName: string;
    phone?: string;
    bio?: string;
    avatarUrl?: string;
    serviceAreas?: string[];
    documents?: Array<{ type: string; url: string }>;
    availability?: { days: string[]; hours: string };
    latitude?: number;
    longitude?: number;
  }) => api<MoverProfile>("/movers/profile", { method: "POST", body: JSON.stringify(body) }),

  updateProfile: (body: {
    businessName: string;
    phone?: string;
    bio?: string;
    avatarUrl?: string;
    serviceAreas?: string[];
    documents?: Array<{ type: string; url: string }>;
    availability?: { days: string[]; hours: string };
    latitude?: number;
    longitude?: number;
  }) => api<MoverProfile>("/movers/profile", { method: "PUT", body: JSON.stringify(body) }),

  getProfile: () => api<MoverProfile>("/movers/profile"),

  updatePresence: (body: { isOnline: boolean; latitude?: number; longitude?: number }) =>
    api<MoverProfile>("/movers/presence", { method: "PUT", body: JSON.stringify(body) }),

  availableRequests: () => api<MovingRequest[]>("/movers/available-requests"),

  submitQuote: (requestId: string, price: number, estimatedHours?: number, notes?: string) =>
    api<Quote>(`/movers/requests/${requestId}/quote`, {
      method: "POST",
      body: JSON.stringify({ price, estimatedHours, notes }),
    }),

  counteroffer: (quoteId: string, price: number, notes?: string) =>
    api<QuoteCounteroffer>(`/movers/quotes/${quoteId}/counteroffer`, {
      method: "POST",
      body: JSON.stringify({ price, notes }),
    }),

  respondCounteroffer: (quoteId: string, accept: boolean) =>
    api<{ quote: Quote; counteroffer: QuoteCounteroffer }>(`/movers/quotes/${quoteId}/counteroffer/respond`, {
      method: "POST",
      body: JSON.stringify({ accept }),
    }),

  listBookings: () => api<Booking[]>("/movers/bookings"),

  getWallet: () => api<import("./types").MoverWallet>("/movers/wallet"),

  requestCashOut: (amount: number, bankNote?: string) =>
    api<{ id: string; amount: number; status: string; bankNote?: string; createdAt: string }>(
      "/movers/wallet/cash-out",
      {
        method: "POST",
        body: JSON.stringify({ amount, bankNote }),
      },
    ),

  getPaymentInvoice: (paymentId: string) =>
    api<import("./types").PaymentInvoice>(`/movers/payments/${paymentId}/invoice`),

  confirmCash: (bookingId: string) =>
    api<import("./types").Payment>(`/movers/bookings/${bookingId}/confirm-cash`, { method: "POST" }),

  acceptBooking: (bookingId: string) =>
    api<Booking>(`/movers/bookings/${bookingId}/accept`, { method: "POST" }),

  updateBookingStatus: (bookingId: string, status: string, note?: string) =>
    api<Booking>(`/movers/bookings/${bookingId}/update-status`, {
      method: "POST",
      body: JSON.stringify({ status, note }),
    }),

  addTracking: (
    bookingId: string,
    body: {
      type: string;
      status: string;
      note?: string;
      latitude?: number;
      longitude?: number;
    },
  ) => api<TrackingEvent>(`/movers/bookings/${bookingId}/tracking`, { method: "POST", body: JSON.stringify(body) }),

  getTracking: (bookingId: string) => api<TrackingEvent[]>(`/movers/bookings/${bookingId}/tracking`),

  uploadCompletionPhoto: (bookingId: string, photoUrl: string) =>
    api<import("./types").BookingItem>(`/movers/bookings/${bookingId}/completion-photo`, {
      method: "POST",
      body: JSON.stringify({ photoUrl }),
    }),
};

export const messagesApi = {
  listConversations: () => api<Conversation[]>("/messages/conversations"),

  list: (bookingId: string) => api<Message[]>(`/bookings/${bookingId}/messages`),

  send: (
    bookingId: string,
    payload: string | { content?: string; messageType?: MessageType; attachmentUrl?: string; attachmentMimeType?: string },
  ) => {
    const body = typeof payload === "string" ? { content: payload, messageType: "text" as const } : payload;
    return api<Message>(`/bookings/${bookingId}/messages`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  markRead: (bookingId: string) =>
    api<{ message: string }>(`/bookings/${bookingId}/messages/read`, { method: "PATCH" }),
};
