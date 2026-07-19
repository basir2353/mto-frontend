import { api, apiPublic } from "./client";
import type { Booking, BookingItem, BookingTracking } from "./types";

export type BookingTimeline = {
  statusHistory: Array<{ status: string; note?: string | null; createdAt: string }>;
  trackingEvents: Array<{ id: string; status: string; note?: string | null; createdAt: string }>;
};

export const bookingsApi = {
  list: () => api<Booking[]>("/bookings"),

  create: (body: Record<string, unknown>) =>
    api<Booking>("/bookings", { method: "POST", body: JSON.stringify(body) }),

  estimate: (body: Record<string, unknown>) =>
    api<{ distanceKm: number; total: number; vehicleType?: unknown; zonePricing?: unknown }>(
      "/bookings/estimate",
      { method: "POST", body: JSON.stringify(body) },
    ),

  preview: (body: Record<string, unknown>) =>
    api<Record<string, unknown>>("/bookings/preview", { method: "POST", body: JSON.stringify(body) }),

  get: (id: string) => api<Booking>(`/bookings/${id}`),

  update: (id: string, body: Record<string, unknown>) =>
    api<Booking>(`/bookings/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  remove: (id: string) => api<{ message: string }>(`/bookings/${id}`, { method: "DELETE" }),

  cancel: (id: string, reason?: string) =>
    api<Booking>(`/bookings/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  reschedule: (id: string, scheduledDate: string) =>
    api<Booking>(`/bookings/${id}/reschedule`, {
      method: "POST",
      body: JSON.stringify({ scheduledDate }),
    }),

  duplicate: (id: string) => api<Booking>(`/bookings/${id}/duplicate`, { method: "POST" }),

  rebook: (id: string) => api<Booking>(`/bookings/${id}/rebook`, { method: "POST" }),

  share: (id: string, expiresInHours?: number) =>
    api<{ shareToken: string; shareUrl?: string; expiresAt?: string | null }>(`/bookings/${id}/share`, {
      method: "POST",
      body: JSON.stringify({ expiresInHours }),
    }),

  getTracking: (id: string) => api<BookingTracking>(`/bookings/${id}/tracking`),

  getSharedTracking: (token: string) =>
    apiPublic<BookingTracking>(`/public/tracking/${encodeURIComponent(token)}`),

  getTimeline: (id: string) => api<BookingTimeline>(`/bookings/${id}/timeline`),

  getLocation: (id: string) =>
    api<{
      bookingId: string;
      latitude?: number;
      longitude?: number;
      pickupAddress?: Record<string, unknown>;
      destinationAddress?: Record<string, unknown>;
      updatedAt: string;
    }>(`/bookings/${id}/location`),

  getStatus: (id: string) =>
    api<{ bookingId: string; status: string; scheduledDate: string; updatedAt: string }>(
      `/bookings/${id}/status`,
    ),

  getItems: (id: string) => api<BookingItem[]>(`/bookings/${id}/items`),

  addItem: (id: string, body: { name: string; quantity?: number; description?: string }) =>
    api<BookingItem>(`/bookings/${id}/items`, { method: "POST", body: JSON.stringify(body) }),

  updateItem: (id: string, itemId: string, body: Record<string, unknown>) =>
    api<BookingItem>(`/bookings/${id}/items/${itemId}`, { method: "PATCH", body: JSON.stringify(body) }),

  removeItem: (id: string, itemId: string) =>
    api<{ message: string }>(`/bookings/${id}/items/${itemId}`, { method: "DELETE" }),

  addItemPhoto: (id: string, photoUrl: string, itemId?: string) =>
    api<BookingItem>(`/bookings/${id}/items/photo`, {
      method: "POST",
      body: JSON.stringify({ photoUrl, itemId }),
    }),
};
