export type LatLng = { lat: number; lng: number };

export type MapPlace = {
  address: string;
  lat?: number;
  lng?: number;
};

export const DEFAULT_MAP_CENTER: LatLng = { lat: 43.6532, lng: -79.3832 };

/** Coerce API/string coords into a finite LatLng, or null. */
export function toFiniteCoord(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function toLatLng(place?: MapPlace | null): LatLng | null {
  const lat = toFiniteCoord(place?.lat);
  const lng = toFiniteCoord(place?.lng);
  if (lat == null || lng == null) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

export function mapCenterFromPlaces(
  pickup?: MapPlace | null,
  destination?: MapPlace | null,
): LatLng {
  const pickupCoords = toLatLng(pickup);
  const destinationCoords = toLatLng(destination);

  if (pickupCoords && destinationCoords) {
    return {
      lat: (pickupCoords.lat + destinationCoords.lat) / 2,
      lng: (pickupCoords.lng + destinationCoords.lng) / 2,
    };
  }

  return pickupCoords ?? destinationCoords ?? DEFAULT_MAP_CENTER;
}

export function haversineKm(a?: MapPlace | null, b?: MapPlace | null): number | null {
  const from = toLatLng(a);
  const to = toLatLng(b);
  if (!from || !to) return null;

  const R = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function mapZoomFromPlaces(
  pickup?: MapPlace | null,
  destination?: MapPlace | null,
): number {
  const pickupCoords = toLatLng(pickup);
  const destinationCoords = toLatLng(destination);
  return pickupCoords && destinationCoords ? 12 : pickupCoords || destinationCoords ? 14 : 11;
}

export function placeFromAddress(
  address?: Record<string, unknown> | null,
  fallback?: string | null,
): MapPlace {
  const street =
    (typeof address?.street === "string" && address.street) ||
    (typeof address?.address === "string" && address.address) ||
    (typeof address?.formatted === "string" && address.formatted) ||
    (typeof address?.label === "string" && address.label) ||
    fallback ||
    "";
  const lat =
    toFiniteCoord(address?.lat) ??
    toFiniteCoord(address?.latitude) ??
    undefined;
  const lng =
    toFiniteCoord(address?.lng) ??
    toFiniteCoord(address?.longitude) ??
    undefined;
  return { address: street, lat: lat ?? undefined, lng: lng ?? undefined };
}

export function estimateDriveMinutes(distanceKm: number | null, avgKmh = 35): number | null {
  if (distanceKm == null) return null;
  return Math.max(5, Math.round((distanceKm / avgKmh) * 60));
}

export function formatDuration(minutes: number | null): string {
  if (minutes == null) return "—";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
}

export function placesFromBooking(
  booking?: {
    pickupAddress?: Record<string, unknown> | null;
    destinationAddress?: Record<string, unknown> | null;
    request?: { pickupAddress?: string; destinationAddress?: string } | null;
  } | null,
): { pickup: MapPlace; destination: MapPlace } {
  return {
    pickup: placeFromAddress(booking?.pickupAddress, booking?.request?.pickupAddress),
    destination: placeFromAddress(booking?.destinationAddress, booking?.request?.destinationAddress),
  };
}

/** Rough local estimate when zone pricing is unavailable (matches backend formula). */
export function estimateLocalPrice(distanceKm: number | null, baseFee = 55, perKm = 2.5): number {
  return Math.round(baseFee + (distanceKm ?? 10) * perKm);
}
