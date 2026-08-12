import { api } from "./client";
import type { Conversation, Message, MessageType } from "./types";

export const messagesApi = {
  listConversations: () => api<Conversation[]>("/messages/conversations"),
<<<<<<< HEAD

  list: (bookingId: string) => api<Message[]>(`/bookings/${bookingId}/messages`),

=======
  list: (bookingId: string) => api<Message[]>(`/bookings/${bookingId}/messages`),
>>>>>>> ac960226d218fcf032389f207fde44cc1d48f28f
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
<<<<<<< HEAD

=======
>>>>>>> ac960226d218fcf032389f207fde44cc1d48f28f
  markRead: (bookingId: string) =>
    api<{ message: string }>(`/bookings/${bookingId}/messages/read`, { method: "PATCH" }),
};
