import { api } from "./client";
import type { AdminAnalytics, Booking, Dispute, Promotion, User } from "./types";

export type CreatePromotionInput = {
  code: string;
  title: string;
  description?: string;
  discountPercent?: number;
  discountAmount?: number;
  validFrom: string;
  validTo: string;
};

export const adminApi = {
  analytics: () => api<AdminAnalytics>("/admin/analytics"),

  listUsers: () => api<User[]>("/admin/users"),

  verifyUser: (userId: string) =>
    api<User>(`/admin/users/${userId}/verify`, { method: "PUT" }),

  reviewMoverDocument: (
    userId: string,
    docType: string,
    status: "pending" | "verified" | "rejected",
  ) =>
    api<User>(`/admin/users/${userId}/documents/${encodeURIComponent(docType)}/review`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),

  listBookings: () => api<Booking[]>("/admin/bookings"),

  listDisputes: () => api<Dispute[]>("/admin/disputes"),

  resolveDispute: (disputeId: string, resolution: string, refundAmount?: number) =>
    api<Dispute>(`/admin/disputes/${disputeId}/resolve`, {
      method: "POST",
      body: JSON.stringify({
        resolution,
        ...(refundAmount != null && refundAmount > 0 ? { refundAmount } : {}),
      }),
    }),

  issueDisputeRefund: (disputeId: string, amount: number, note?: string) =>
    api<{ dispute: Dispute; balance: number; refundedAmount: number }>(`/admin/disputes/${disputeId}/refund`, {
      method: "POST",
      body: JSON.stringify({ amount, note }),
    }),

  createPromotion: (body: CreatePromotionInput) =>
    api<Promotion>("/admin/promotions", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listPromotions: () => api<Promotion[]>("/admin/promotions"),

  refundPayment: (paymentId: string) =>
    api<{ message: string }>(`/admin/payments/${paymentId}/refund`, { method: "POST" }),

  listTransactions: () => api<import("./types").AdminWalletStatementEntry[]>("/admin/transactions"),
};
