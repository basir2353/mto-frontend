import type { TrackingEvent } from "@/lib/api/types";

const GPS_NOISE_STATUSES = new Set(["on the way", "location update", "gps"]);

/** Keep stage / status updates; drop heartbeat GPS pings from timelines. */
export function isMeaningfulTrackingEvent(event: {
  type?: string | null;
  status?: string | null;
  note?: string | null;
}): boolean {
  const type = (event.type ?? "").toLowerCase();
  if (type === "location_update") return false;

  const status = (event.status ?? "").trim().toLowerCase();
  if (!status) return false;
  if (GPS_NOISE_STATUSES.has(status) && !event.note) return false;
  return true;
}

export function filterTimelineTrackingEvents<T extends { type?: string | null; status?: string | null; note?: string | null }>(
  events: T[],
): T[] {
  return events.filter(isMeaningfulTrackingEvent);
}

/** True once the mover has left pickup and is heading to (or at) drop-off. */
export function isPastPickupStage(events: TrackingEvent[]): boolean {
  const meaningful = filterTimelineTrackingEvents(events);
  const latest = meaningful[meaningful.length - 1];
  const status = (latest?.status ?? "").toLowerCase();
  return /drop-?off|destination|delivered|en route to drop/.test(status);
}

/**
 * Hide driver→stop distances when GPS is clearly not near the job
 * (e.g. tester phone in another country while addresses are local).
 */
export function isPlausibleNearbyKm(distanceKm: number | null, tripKm: number | null): boolean {
  if (distanceKm == null || !Number.isFinite(distanceKm)) return false;
  if (distanceKm < 0) return false;
  if (distanceKm > 250) return false;
  if (tripKm != null && tripKm > 0 && distanceKm > Math.max(80, tripKm * 25)) return false;
  return true;
}
