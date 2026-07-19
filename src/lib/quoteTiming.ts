/** Encode/decode driver proposed arrival time in quote.notes (works without new DB columns). */

const ARRIVAL_PREFIX = "Can start at ";

export function formatTimeLabel(time24: string): string {
  const [hStr, mStr = "00"] = time24.split(":");
  const h = Number(hStr);
  if (!Number.isFinite(h)) return time24;
  const hour12 = ((h + 11) % 12) + 1;
  const suffix = h >= 12 ? "PM" : "AM";
  return `${hour12}:${mStr.padStart(2, "0")} ${suffix}`;
}

export function buildQuoteNotes(arrivalTime24?: string | null, extra?: string | null): string | undefined {
  const parts: string[] = [];
  if (arrivalTime24?.trim()) {
    parts.push(`${ARRIVAL_PREFIX}${formatTimeLabel(arrivalTime24.trim())}`);
  }
  if (extra?.trim()) parts.push(extra.trim());
  return parts.length ? parts.join(" · ") : undefined;
}

export function parseQuoteArrivalLabel(notes?: string | null): string | null {
  if (!notes) return null;
  const match = notes.match(/Can start at ([^·]+)/i);
  return match?.[1]?.trim() ?? null;
}

/** Reverse a stored label like "2:30 PM" back to "14:30" for the time input. */
export function parseArrivalToTime24(notes?: string | null): string {
  const label = parseQuoteArrivalLabel(notes);
  if (!label) return "";
  const m = label.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return "";
  let h = Number(m[1]);
  const min = m[2];
  const ampm = m[3].toUpperCase();
  if (ampm === "PM" && h < 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${min}`;
}

export function formatDurationLabel(hours?: number | null): string | null {
  if (hours == null || !Number.isFinite(Number(hours)) || Number(hours) <= 0) return null;
  const h = Number(hours);
  return h === 1 ? "~1 hr" : `~${h} hrs`;
}
