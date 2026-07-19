/** Human-readable when a move is needed / when the request was posted (for driver jobs). */
export function formatMovingRequestWhen(request: {
  movingDate: string;
  additionalNotes?: string | null;
  notes?: string | null;
  createdAt?: string;
}): string {
  const notes = request.additionalNotes ?? request.notes ?? "";
  const timingLine = notes
    .split("\n")
    .map((line) => line.trim())
    .find((line) => /^Timing:/i.test(line))
    ?.replace(/^Timing:\s*/i, "")
    .trim();

  if (timingLine) {
    if (/^move now$/i.test(timingLine)) {
      const requested = formatDateAndTime(request.createdAt);
      return requested ? `Move now · ${requested}` : "Move now";
    }
    // e.g. "Jul 14, 2026 · 1:00 PM - 3:00 PM (America/Vancouver)"
    return timingLine;
  }

  const move = parseDate(request.movingDate);
  if (!move) {
    return formatDateAndTime(request.createdAt) ?? "Schedule TBD";
  }

  const datePart = move.toLocaleDateString(undefined, {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });

  if (isoHasClockTime(request.movingDate)) {
    const timePart = move.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    return `${datePart} · ${timePart}`;
  }

  // Date-only schedule — show when the customer submitted the request.
  const created = parseDate(request.createdAt);
  if (created) {
    const timePart = created.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    return `${datePart} · ${timePart}`;
  }

  return datePart;
}

function parseDate(iso?: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isoHasClockTime(iso: string): boolean {
  if (!/T\d{2}:\d{2}/.test(iso)) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  return d.getHours() !== 0 || d.getMinutes() !== 0 || d.getSeconds() !== 0;
}

function formatDateAndTime(iso?: string | null): string | null {
  const d = parseDate(iso);
  if (!d) return null;
  return d.toLocaleString(undefined, {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
