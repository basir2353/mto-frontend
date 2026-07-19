import type { Quote } from "@/lib/api/types";

export function quoteNegotiationMeta(quote: Quote) {
  const counteroffers = quote.counteroffers ?? [];
  const latest = counteroffers.length ? counteroffers[counteroffers.length - 1] : null;
  const negotiating = quote.status === "countered" || counteroffers.length > 0;
  const priceAgreed = latest?.status === "accepted";
  const yourTurn = latest?.authorRole === "mover" && latest?.status === "pending";
  const waitingOnMover = latest?.authorRole === "customer" && latest?.status === "pending";

  let statusLabel = "New quote";
  let statusTone: "accent" | "waiting" | "success" | "neutral" = "neutral";
  if (priceAgreed) {
    statusLabel = "Price agreed";
    statusTone = "success";
  } else if (yourTurn) {
    statusLabel = "Your turn";
    statusTone = "accent";
  } else if (waitingOnMover) {
    statusLabel = "Waiting on mover";
    statusTone = "waiting";
  } else if (negotiating) {
    statusLabel = "Waiting";
    statusTone = "waiting";
  }

  const canBookNow =
    priceAgreed || (counteroffers.length === 0 && quote.status === "pending");

  return {
    latest,
    negotiating,
    priceAgreed,
    yourTurn,
    waitingOnMover,
    canBookNow,
    statusLabel,
    statusTone,
  };
}

export function canUnlockChat(
  booking?: { id: string; quoteId?: string | null; requestId?: string | null; status?: string } | null,
  requestId?: string | null,
  selectedQuoteId?: string | null,
) {
  if (!booking?.id) return null;
  if (booking.requestId && requestId && booking.requestId !== requestId) return null;
  if (selectedQuoteId && booking.quoteId && booking.quoteId !== selectedQuoteId) return null;
  if (!["confirmed", "in_progress", "completed", "open"].includes(booking.status ?? "")) return null;
  return booking.id;
}
