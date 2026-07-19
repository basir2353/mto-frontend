import type { Booking, MovingRequest, Quote } from "@/lib/api/types";
import { isTrackableBooking } from "@/lib/bookingFlow";

export type MoveFlowScreen = "plan" | "details" | "quotes" | "book" | "track";

export function activeQuotes(request: MovingRequest | null | undefined): Quote[] {
  return (request?.quotes ?? []).filter((q) => q.status === "pending" || q.status === "countered");
}

export function isOpenRequest(request: MovingRequest | null | undefined): boolean {
  return Boolean(request && ["pending", "active"].includes(request.status));
}

export function resolveMoveScreen(input: {
  trackableBooking?: Booking | null;
  activeRequest?: MovingRequest | null;
  savedScreen?: string | null;
}): MoveFlowScreen {
  const { trackableBooking, activeRequest } = input;

  if (trackableBooking && isTrackableBooking(trackableBooking)) {
    return "track";
  }

  if (isOpenRequest(activeRequest)) {
    return "quotes";
  }

  if (input.savedScreen === "details") {
    return "details";
  }

  return "plan";
}
