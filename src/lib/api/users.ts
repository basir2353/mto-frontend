import { api } from "./client";
import type { SavedAddress, User, UserActivity, UserStatistics } from "./types";

export type { UserActivity, UserStatistics };

export const usersApi = {
  getProfile: () => api<User>("/users/profile"),

  updateProfile: (body: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatarUrl?: string;
    address?: {
      street: string;
      city: string;
      province?: string;
      postalCode?: string;
      country?: string;
      latitude?: number;
      longitude?: number;
      instructions?: string;
    };
  }) => api<User>("/users/profile", { method: "PATCH", body: JSON.stringify(body) }),

  updatePreferences: (preferences: Record<string, unknown>) =>
    api<User>("/users/preferences", { method: "PATCH", body: JSON.stringify({ preferences }) }),

  updateLanguage: (language: string) =>
    api<User>("/users/language", { method: "PATCH", body: JSON.stringify({ language }) }),

  updateNotificationSettings: (notificationSettings: Record<string, unknown>) =>
    api<User>("/users/notification-settings", {
      method: "PATCH",
      body: JSON.stringify({ notificationSettings }),
    }),

  updatePrivacy: (privacy: Record<string, unknown>) =>
    api<User>("/users/privacy", { method: "PATCH", body: JSON.stringify({ privacy }) }),

  getActivity: () => api<UserActivity>("/users/activity"),

  getStatistics: () => api<UserStatistics>("/users/statistics"),
};

export const savedAddressesApi = {
  list: () => api<SavedAddress[]>("/saved-addresses"),
  getDefault: () => api<SavedAddress>("/saved-addresses/default"),
  create: (body: Omit<SavedAddress, "id" | "userId" | "createdAt" | "updatedAt">) =>
    api<SavedAddress>("/saved-addresses", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Omit<SavedAddress, "id" | "userId" | "createdAt" | "updatedAt">>) =>
    api<SavedAddress>(`/saved-addresses/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id: string) => api<{ message: string }>(`/saved-addresses/${id}`, { method: "DELETE" }),
  setDefault: (addressId: string) =>
    api<SavedAddress>("/saved-addresses/default", {
      method: "POST",
      body: JSON.stringify({ addressId }),
    }),
};

export const notificationsApi = {
  list: () => api<import("./types").Notification[]>("/notifications"),
  markRead: (id: string) => api<import("./types").Notification>(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllRead: () => api<{ message: string }>("/notifications/read-all", { method: "PATCH" }),
  savePushSubscription: (subscription: PushSubscriptionJSON) =>
    api("/notifications/push-subscriptions", {
      method: "POST",
      body: JSON.stringify(subscription),
    }),
  removePushSubscription: (endpoint: string) =>
    api<{ message: string }>("/notifications/push-subscriptions", {
      method: "DELETE",
      body: JSON.stringify({ endpoint }),
    }),
};
