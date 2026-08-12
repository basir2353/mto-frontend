"use client";

import type { Booking, MovingRequest } from "@/lib/api/types";

export type MoveSwitcherItem = {
  id: string;
  kind: "request" | "booking";
  route: string;
  status: string;
  price?: number | null;
  meta?: string;
  badge?: string;
};

export function formatMoveRoute(
  pickup?: string | null,
  destination?: string | null,
  maxLen = 42,
): string {
  const route = `${pickup ?? "Pickup"} → ${destination ?? "Destination"}`;
  if (route.length <= maxLen) return route;
  return `${route.slice(0, maxLen - 1)}…`;
}

export function requestToSwitcherItem(request: MovingRequest): MoveSwitcherItem {
  const quotes = (request.quotes ?? []).filter((q) => q.status === "pending" || q.status === "countered");
  const lowest = quotes.length
    ? Math.min(...quotes.map((q) => Number(q.price)))
    : null;
  return {
    id: request.id,
    kind: "request",
    route: formatMoveRoute(request.pickupAddress, request.destinationAddress),
    status: request.status,
    price: lowest ?? (request.estimatedPrice != null ? Number(request.estimatedPrice) : null),
    meta: `${quotes.length} quote${quotes.length === 1 ? "" : "s"}`,
    badge: quotes.length ? "Quotes" : "Waiting",
  };
}

export function bookingToSwitcherItem(booking: Booking): MoveSwitcherItem {
  const pickup =
    (booking.pickupAddress as { street?: string } | undefined)?.street ??
    booking.request?.pickupAddress;
  const destination =
    (booking.destinationAddress as { street?: string } | undefined)?.street ??
    booking.request?.destinationAddress;
  return {
    id: booking.id,
    kind: "booking",
    route: formatMoveRoute(pickup, destination),
    status: booking.status,
    price: Number(booking.price),
    meta: booking.mover?.moverProfile?.businessName ?? "Mover booked",
    badge:
      booking.status === "in_progress"
        ? "Live"
        : booking.status === "confirmed"
          ? "Booked"
          : booking.status === "completed"
            ? "Pay"
            : undefined,
  };
}

export function MovesSwitcher({
  items,
  selectedId,
  onSelect,
  title = "Your moves",
  subtitle,
  onNewMove,
  compact = false,
}: {
  items: MoveSwitcherItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  title?: string;
  subtitle?: string;
  onNewMove?: () => void;
  compact?: boolean;
}) {
  if (items.length <= 1 && !onNewMove) return null;

  return (
    <div style={{ marginBottom: compact ? 12 : 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
        <div>
          <div style={{ font: "800 16px 'Archivo'" }}>{title}</div>
          {subtitle && (
            <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#6B6B70", marginTop: 2 }}>{subtitle}</div>
          )}
        </div>
        {onNewMove && (
          <button
            type="button"
            onClick={onNewMove}
            style={{
              height: 32,
              padding: "0 12px",
              borderRadius: 999,
              border: "1.5px solid rgba(0,0,0,.12)",
              background: "var(--accent)",
              font: "800 12px 'Archivo'",
              color: "#0E0E10",
              cursor: "pointer",
            }}
          >
            + New
          </button>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item) => {
          const selected = item.id === selectedId;
          return (
            <button
              key={`${item.kind}-${item.id}`}
              type="button"
              onClick={() => onSelect(item.id)}
              style={{
                textAlign: "left",
                padding: compact ? 11 : 13,
                borderRadius: 12,
                border: selected ? "2px solid #0E0E10" : "1.5px solid rgba(0,0,0,.1)",
                background: selected ? "#0E0E10" : "#fff",
                color: selected ? "#fff" : "#0E0E10",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                <b style={{ font: "700 13px 'Hanken Grotesk'", flex: 1, minWidth: 0 }}>{item.route}</b>
                {item.price != null && (
                  <b style={{ font: "900 15px 'Archivo'", flex: "none" }}>${Math.round(item.price)}</b>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 5, flexWrap: "wrap" }}>
                {item.badge && (
                  <span
                    style={{
                      font: "700 10px 'Hanken Grotesk'",
                      letterSpacing: ".04em",
                      textTransform: "uppercase",
                      padding: "3px 7px",
                      borderRadius: 6,
                      background: selected ? "rgba(255,255,255,.14)" : "#eceae2",
                      color: selected ? "rgba(255,255,255,.85)" : "#6B6B70",
                    }}
                  >
                    {item.badge}
                  </span>
                )}
                {item.meta && (
                  <span style={{ font: "600 11px 'Hanken Grotesk'", color: selected ? "rgba(255,255,255,.55)" : "#8A8A90" }}>
                    {item.meta}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
