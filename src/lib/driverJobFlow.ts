import type { Booking, TrackingEvent } from "@/lib/api/types";

export type DriverJobStage =
  | "awaiting_start"
  | "en_route_pickup"
  | "arriving_pickup"
  | "arrived_pickup"
  | "picking_up"
  | "en_route_dropoff"
  | "arriving_dropoff"
  | "arrived_dropoff"
  | "proof_required"
  | "ready_to_complete"
  | "completed";

export type DriverStageAction = {
  label: string;
  trackingStatus: string;
  note: string;
};

/** Compact milestones shown in the driver UI (not every micro-step). */
export const DRIVER_JOB_STEPS: { key: string; label: string }[] = [
  { key: "pickup", label: "Pickup" },
  { key: "dropoff", label: "Drop-off" },
  { key: "proof", label: "Proof" },
  { key: "done", label: "Done" },
];

function statusEvents(booking: Booking): TrackingEvent[] {
  const events = booking.trackingEvents ?? [];
  return events
    .filter((e) => e.type === "status_update")
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

function hasStatus(events: TrackingEvent[], ...needles: string[]): boolean {
  const lower = events.map((e) => e.status.toLowerCase());
  return needles.some((needle) => lower.some((s) => s.includes(needle.toLowerCase())));
}

export function deliveryProofCount(booking: Booking): number {
  return (booking.items ?? []).filter((item) => item.photoUrl && item.name === "Delivery proof").length;
}

export function resolveDriverJobStage(booking: Booking): DriverJobStage {
  if (booking.status === "completed") return "completed";
  if (booking.status === "confirmed") return "awaiting_start";
  if (booking.status !== "in_progress") return "completed";

  const events = statusEvents(booking);
  const proof = deliveryProofCount(booking);

  if (!hasStatus(events, "en route to pickup", "started")) {
    return "en_route_pickup";
  }
  if (!hasStatus(events, "arrived at pickup")) {
    return "en_route_pickup";
  }
  if (!hasStatus(events, "en route to drop", "heading to drop")) {
    return "arrived_pickup";
  }
  if (!hasStatus(events, "arrived at drop")) {
    return "en_route_dropoff";
  }
  if (proof === 0) return "proof_required";
  return "ready_to_complete";
}

export function driverStageAction(stage: DriverJobStage): DriverStageAction | null {
  switch (stage) {
    case "en_route_pickup":
    case "arriving_pickup":
      return {
        label: "Arrived at pickup",
        trackingStatus: "Arrived at pickup",
        note: "Mover has arrived at pickup",
      };
    case "arrived_pickup":
    case "picking_up":
      return {
        label: "Drive to drop-off",
        trackingStatus: "En route to drop-off",
        note: "Heading to destination with items",
      };
    case "en_route_dropoff":
    case "arriving_dropoff":
      return {
        label: "Arrived at drop-off",
        trackingStatus: "Arrived at drop-off",
        note: "Mover has arrived at destination",
      };
    case "ready_to_complete":
      return {
        label: "Mark delivered & complete",
        trackingStatus: "Delivered",
        note: "Move completed",
      };
    default:
      return null;
  }
}

export function driverStageHeadline(stage: DriverJobStage): string {
  switch (stage) {
    case "awaiting_start":
      return "Ready to start";
    case "en_route_pickup":
    case "arriving_pickup":
      return "Driving to pickup";
    case "arrived_pickup":
    case "picking_up":
      return "At pickup";
    case "en_route_dropoff":
    case "arriving_dropoff":
      return "Driving to drop-off";
    case "arrived_dropoff":
    case "proof_required":
      return "At drop-off — upload proof";
    case "ready_to_complete":
      return "Proof uploaded — finish job";
    case "completed":
      return "Job completed";
    default:
      return "In progress";
  }
}

export function stepIndexForStage(stage: DriverJobStage): number {
  const map: Record<DriverJobStage, number> = {
    awaiting_start: -1,
    en_route_pickup: 0,
    arriving_pickup: 0,
    arrived_pickup: 0,
    picking_up: 0,
    en_route_dropoff: 1,
    arriving_dropoff: 1,
    arrived_dropoff: 1,
    proof_required: 2,
    ready_to_complete: 3,
    completed: 4,
  };
  return map[stage];
}
