import type { Booking } from "@/lib/api/types";

export function isBookingJobPaid(booking: Booking | null | undefined): boolean {
  if (!booking) return false;
  const payments = booking.payments ?? [];
  return payments.some(
    (p) => p.status === "completed" && Math.abs(Number(p.amount) - Number(booking.price)) < 1,
  );
}

/** Active moves + delivered moves waiting for customer verify/pay. */
export function isTrackableBooking(booking: Booking): boolean {
  if (["confirmed", "in_progress", "open"].includes(booking.status)) return true;
  if (booking.status === "completed" && !isBookingJobPaid(booking)) return true;
  return false;
}

/** Finished & paid (or cancelled) — belongs in history, not live track. */
export function isHistoryBooking(booking: Booking): boolean {
  return !isTrackableBooking(booking);
}
