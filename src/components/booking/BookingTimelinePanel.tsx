"use client";

import { useEffect, useState } from "react";
import { bookingsApi, type BookingTimeline } from "@/lib/api/bookings";
import { timelineEventIcon, TypeIcon } from "@/components/ui/Icons";
import { isMeaningfulTrackingEvent } from "@/lib/trackingDisplay";

function eventIcon(title: string, kind: "status" | "tracking") {
  return <TypeIcon icon={timelineEventIcon(title, kind)} size={16} />;
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString();
}

export function BookingTimelinePanel({ bookingId, compact = false }: { bookingId: string; compact?: boolean }) {
  const [timeline, setTimeline] = useState<BookingTimeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    bookingsApi
      .getTimeline(bookingId)
      .then((data) => {
        if (!cancelled) setTimeline(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load timeline");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const events = [
    ...(timeline?.statusHistory ?? []).map((e) => ({
      kind: "status" as const,
      title: e.status,
      note: e.note,
      at: e.createdAt,
    })),
    ...(timeline?.trackingEvents ?? [])
      .filter((e) => isMeaningfulTrackingEvent(e))
      .map((e) => ({
        kind: "tracking" as const,
        title: e.status,
        note: e.note,
        at: e.createdAt,
      })),
  ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  return (
    <div
      style={{
        border: "1.5px solid rgba(0,0,0,.08)",
        borderRadius: 14,
        background: "#fff",
        padding: compact ? "14px 16px" : "18px 20px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
        <div style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".08em", textTransform: "uppercase", color: "#8A8A90" }}>
          Full move timeline
        </div>
        {!loading && events.length > 0 && (
          <span style={{ font: "600 11px 'Hanken Grotesk'", color: "#9a9aa0" }}>{events.length} events</span>
        )}
      </div>

      {loading && <div style={{ font: "600 13px 'Hanken Grotesk'", color: "#8A8A90" }}>Loading timeline…</div>}
      {error && <div style={{ font: "600 13px 'Hanken Grotesk'", color: "#a8442a" }}>{error}</div>}

      {!loading && !error && events.length === 0 && (
        <div style={{ font: "600 13px 'Hanken Grotesk'", color: "#8A8A90" }}>No timeline events yet.</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {events.map((ev, i) => {
          const last = i === events.length - 1;
          return (
            <div key={`${ev.kind}-${ev.at}-${i}`} style={{ display: "flex", gap: 14, minHeight: last ? "auto" : 52 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 20, flex: "none" }}>
                <span style={{ fontSize: 16, lineHeight: 1, marginTop: 2 }}>{eventIcon(ev.title, ev.kind)}</span>
                {!last && <div style={{ flex: 1, width: 2, background: "rgba(0,0,0,.1)", marginTop: 4 }} />}
              </div>
              <div style={{ flex: 1, paddingBottom: last ? 0 : 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                  <b style={{ font: "700 14px 'Hanken Grotesk'" }}>{ev.title.replace(/_/g, " ")}</b>
                  <span style={{ font: "600 11px 'Hanken Grotesk'", color: "#9a9aa0", flex: "none" }}>
                    {relativeTime(ev.at)}
                  </span>
                </div>
                {ev.note && (
                  <div style={{ font: "500 13px 'Hanken Grotesk'", color: "#6B6B70", marginTop: 4 }}>{ev.note}</div>
                )}
                <div style={{ font: "500 11px 'Hanken Grotesk'", color: "#9a9aa0", marginTop: 4 }}>
                  {new Date(ev.at).toLocaleString()} · {ev.kind === "tracking" ? "Stage update" : "Status change"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
