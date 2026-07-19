import { estimateLocalPrice, haversineKm, type MapPlace } from "@/lib/maps";
import { bookingsApi, vehiclesApi, zonesApi } from "@/lib/api";

export async function computeMoveEstimate(
  pickupPlace: MapPlace,
  destinationPlace: MapPlace,
  items: Array<{ name: string; qty: number }>,
): Promise<{ estimatedPrice: number; distanceKm: number | null }> {
  const distanceKm = haversineKm(pickupPlace, destinationPlace);
  const roundedDistance =
    distanceKm != null && Number.isFinite(distanceKm)
      ? Number(distanceKm.toFixed(2))
      : null;
  const lat = pickupPlace.lat ?? destinationPlace.lat;
  const lng = pickupPlace.lng ?? destinationPlace.lng;

  try {
    if (lat != null && lng != null) {
      const coverage = await zonesApi.check(lat, lng);
      if (!coverage.covered) {
        return { estimatedPrice: Math.round(estimateLocalPrice(distanceKm)), distanceKm: roundedDistance };
      }
      const res = await zonesApi.pricing(lat, lng, distanceKm ?? undefined);
      return { estimatedPrice: Math.round(Number(res.total)), distanceKm: roundedDistance };
    }
  } catch {
    // fall through
  }

  try {
    if (items.length > 0 && lat != null && lng != null) {
      const estimate = await bookingsApi.estimate({
          pickupAddress: { latitude: lat, longitude: lng },
          destinationAddress: {
            latitude: destinationPlace.lat ?? lat,
            longitude: destinationPlace.lng ?? lng,
          },
          items: items.map((i) => ({ name: i.name, quantity: i.qty })),
        });
      if (estimate?.total) {
        return { estimatedPrice: Math.round(Number(estimate.total)), distanceKm: roundedDistance };
      }
    }
  } catch {
    // fall through
  }

  try {
    if (items.length > 0) {
      const rec = await vehiclesApi.calculateRecommendation(
        items.map((i) => ({ name: i.name, quantity: i.qty })),
        distanceKm ?? undefined,
      );
      return { estimatedPrice: Math.round(Number(rec.estimatedPrice)), distanceKm: roundedDistance };
    }
  } catch {
    // fall through
  }

  return {
    estimatedPrice: Math.round(estimateLocalPrice(distanceKm)),
    distanceKm: roundedDistance,
  };
}

export function priceDeltaLabel(current: number, reference: number) {
  const diff = Math.round(current - reference);
  if (diff === 0) return "Matches estimate";
  if (diff > 0) return `$${diff} above estimate`;
  return `$${Math.abs(diff)} below estimate`;
}
