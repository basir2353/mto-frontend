import { DEFAULT_MAP_CENTER, type LatLng } from "@/lib/maps";

let counter = 0;

export function mockId(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function delay<T>(value: T, ms = 350 + Math.random() * 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export type RouteMatch = { params: Record<string, string> };

/** Matches a template like "/customers/requests/:id/quotes/:quoteId/accept" against a real path. */
export function matchPath(template: string, path: string): RouteMatch | null {
  const templateParts = template.split("/").filter(Boolean);
  const pathParts = path.split("/").filter(Boolean);
  if (templateParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < templateParts.length; i += 1) {
    const t = templateParts[i];
    const p = pathParts[i];
    if (t.startsWith(":")) {
      params[t.slice(1)] = decodeURIComponent(p);
    } else if (t !== p) {
      return null;
    }
  }
  return { params };
}

/** Deterministic pseudo-random offset so the same mover always lands in the same spot for a given center. */
export function offsetFrom(center: LatLng, seed: number, maxKm = 6): LatLng {
  const angle = (seed * 137.508) % 360; // golden-angle spread
  const distanceKm = 0.5 + (seed % 7) * (maxKm / 7);
  const dLat = (distanceKm / 111) * Math.cos((angle * Math.PI) / 180);
  const dLng =
    (distanceKm / (111 * Math.cos((center.lat * Math.PI) / 180))) * Math.sin((angle * Math.PI) / 180);
  return { lat: center.lat + dLat, lng: center.lng + dLng };
}

export function interpolate(from: LatLng, to: LatLng, t: number): LatLng {
  const clamped = Math.max(0, Math.min(1, t));
  return {
    lat: from.lat + (to.lat - from.lat) * clamped,
    lng: from.lng + (to.lng - from.lng) * clamped,
  };
}

export function fallbackCenter(): LatLng {
  return DEFAULT_MAP_CENTER;
}
