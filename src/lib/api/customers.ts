import { api } from "./client";
import type {
  Booking,
  MovingRequest,
  PayFromWalletResult,
  Payment,
  PaymentInvoice,
  PaymentMethod,
  QuoteCounteroffer,
  RequestItem,
  Review,
  WalletTopUpResult,
} from "./types";

export const customersApi = {
  createRequest: (body: {
    pickupAddress: string;
    destinationAddress: string;
    movingDate: string;
    items: RequestItem[];
    additionalNotes?: string;
    estimatedPrice?: number;
    distanceKm?: number;
  }) => api<MovingRequest>("/customers/requests", { method: "POST", body: JSON.stringify(body) }),

  listRequests: () => api<MovingRequest[]>("/customers/requests"),

  getRequest: (id: string) => api<MovingRequest>(`/customers/requests/${id}`),

  acceptQuote: (requestId: string, quoteId: string, paymentMethod: PaymentMethod = "cash_on_site") =>
    api<Booking>(`/customers/requests/${requestId}/quotes/${quoteId}/accept`, {
      method: "POST",
      body: JSON.stringify({ paymentMethod }),
    }),

  counteroffer: (requestId: string, quoteId: string, price: number, notes?: string) =>
    api<QuoteCounteroffer>(`/customers/requests/${requestId}/quotes/${quoteId}/counteroffer`, {
      method: "POST",
      body: JSON.stringify({ price, notes }),
    }),

  listBookings: () => api<Booking[]>("/customers/bookings"),

  getBooking: (id: string) => api<Booking>(`/customers/bookings/${id}`),

  cancelBooking: (id: string, reason?: string) =>
    api<Booking>(`/customers/bookings/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  submitReview: (bookingId: string, rating: number, comment?: string) =>
    api<Review>(`/customers/bookings/${bookingId}/review`, {
      method: "POST",
      body: JSON.stringify({ rating, comment }),
    }),

  createPayment: (bookingId: string, amount: number, kind: "job" | "tip" = "job", transactionRef?: string) =>
    api<Payment>(`/customers/bookings/${bookingId}/payment`, {
      method: "POST",
      body: JSON.stringify({ amount, kind, transactionRef }),
    }),

  getWallet: () => api<import("./types").CustomerWallet>("/customers/wallet"),

  topUpWallet: (amount: number) =>
    api<WalletTopUpResult>("/customers/wallet/top-up", {
      method: "POST",
      body: JSON.stringify({ amount }),
    }),

  getInvoice: (bookingId: string, kind: "job" | "tip" = "job", amount?: number) => {
    const params = new URLSearchParams({ kind });
    if (amount != null && amount > 0) params.set("amount", String(amount));
    return api<PaymentInvoice>(`/customers/bookings/${bookingId}/invoice?${params}`);
  },

  payFromWallet: (bookingId: string, kind: "job" | "tip" = "job", amount?: number) =>
    api<PayFromWalletResult>(`/customers/bookings/${bookingId}/pay-wallet`, {
      method: "POST",
      body: JSON.stringify({ kind, ...(amount != null ? { amount } : {}) }),
    }),

  createDispute: (bookingId: string, reason: string, evidenceUrls?: string[]) =>
    api<{ id: string }>(`/customers/bookings/${bookingId}/dispute`, {
      method: "POST",
      body: JSON.stringify({ reason, evidenceUrls }),
    }),
};
