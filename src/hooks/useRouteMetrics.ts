"use client";

import { useEffect, useState } from "react";
import { useGeocodedPlace } from "@/hooks/useGeocodedPlace";
import {
  estimateDriveMinutes,
  haversineKm,
  toLatLng,
  type MapPlace,
} from "@/lib/maps";

type RouteMetrics = {
  pickup: MapPlace | null;
  destination: MapPlace | null;
  tripKm: number | null;
  tripMinutes: number | null;
  toPickupKm: number | null;
  toPickupMinutes: number | null;
  toDropoffKm: number | null;
  toDropoffMinutes: number | null;
  resolving: boolean;
};

function metricsFromHaversine(
  pickup: MapPlace | null,
  destination: MapPlace | null,
  driver: MapPlace | null,
): Pick<
  RouteMetrics,
  "tripKm" | "tripMinutes" | "toPickupKm" | "toPickupMinutes" | "toDropoffKm" | "toDropoffMinutes"
> {
  const tripKm = haversineKm(pickup, destination);
  const toPickupKm = driver && pickup ? haversineKm(driver, pickup) : null;
  const toDropoffKm = driver && destination ? haversineKm(driver, destination) : null;
  return {
    tripKm,
    tripMinutes: estimateDriveMinutes(tripKm),
    toPickupKm,
    toPickupMinutes: estimateDriveMinutes(toPickupKm),
    toDropoffKm,
    toDropoffMinutes: estimateDriveMinutes(toDropoffKm),
  };
}

function fetchDrivingLeg(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<{ distanceKm: number; durationMinutes: number } | null> {
  return new Promise((resolve) => {
    if (typeof google === "undefined" || !google.maps?.DirectionsService) {
      resolve(null);
      return;
    }

    const service = new google.maps.DirectionsService();
    service.route(
      {
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status !== google.maps.DirectionsStatus.OK || !result?.routes?.[0]?.legs?.[0]) {
          resolve(null);
          return;
        }
        const leg = result.routes[0].legs[0];
        resolve({
          distanceKm: (leg.distance?.value ?? 0) / 1000,
          durationMinutes: Math.max(1, Math.round((leg.duration?.value ?? 0) / 60)),
        });
      },
    );
  });
}

export function useRouteMetrics(
  pickup?: MapPlace | null,
  destination?: MapPlace | null,
  driver?: MapPlace | null,
): RouteMetrics {
  const pickupGeo = useGeocodedPlace(pickup ?? null);
  const destinationGeo = useGeocodedPlace(destination ?? null);
  const driverGeo = useGeocodedPlace(driver ?? null);

  const [metrics, setMetrics] = useState<RouteMetrics>(() => ({
    pickup: pickupGeo,
    destination: destinationGeo,
    ...metricsFromHaversine(pickupGeo, destinationGeo, driverGeo),
    resolving: true,
  }));

  useEffect(() => {
    let cancelled = false;

    const pickupCoords = toLatLng(pickupGeo);
    const destinationCoords = toLatLng(destinationGeo);
    const driverCoords = toLatLng(driverGeo);

    const run = async () => {
      if (!pickupCoords || !destinationCoords) {
        if (!cancelled) {
          setMetrics({
            pickup: pickupGeo,
            destination: destinationGeo,
            ...metricsFromHaversine(pickupGeo, destinationGeo, driverGeo),
            resolving: Boolean(pickup?.address || destination?.address),
          });
        }
        return;
      }

      const tripLeg = await fetchDrivingLeg(pickupCoords, destinationCoords);
      const toPickupLeg =
        driverCoords && pickupCoords
          ? await fetchDrivingLeg(driverCoords, pickupCoords)
          : null;
      const toDropoffLeg =
        driverCoords && destinationCoords
          ? await fetchDrivingLeg(driverCoords, destinationCoords)
          : null;

      if (cancelled) return;

      const fallback = metricsFromHaversine(pickupGeo, destinationGeo, driverGeo);
      const saneMinutes = (km: number | null | undefined, minutes: number | null | undefined) => {
        if (km != null && km > 400) return null;
        if (minutes != null && minutes > 240) return null;
        return minutes ?? null;
      };
      setMetrics({
        pickup: pickupGeo,
        destination: destinationGeo,
        tripKm: tripLeg?.distanceKm ?? fallback.tripKm,
        tripMinutes: saneMinutes(
          tripLeg?.distanceKm ?? fallback.tripKm,
          tripLeg?.durationMinutes ?? fallback.tripMinutes,
        ),
        toPickupKm: toPickupLeg?.distanceKm ?? fallback.toPickupKm,
        toPickupMinutes: saneMinutes(
          toPickupLeg?.distanceKm ?? fallback.toPickupKm,
          toPickupLeg?.durationMinutes ?? fallback.toPickupMinutes,
        ),
        toDropoffKm: toDropoffLeg?.distanceKm ?? fallback.toDropoffKm,
        toDropoffMinutes: saneMinutes(
          toDropoffLeg?.distanceKm ?? fallback.toDropoffKm,
          toDropoffLeg?.durationMinutes ?? fallback.toDropoffMinutes,
        ),
        resolving: false,
      });
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [
    pickupGeo?.address,
    pickupGeo?.lat,
    pickupGeo?.lng,
    destinationGeo?.address,
    destinationGeo?.lat,
    destinationGeo?.lng,
    driverGeo?.lat,
    driverGeo?.lng,
    pickup?.address,
    destination?.address,
  ]);

  return metrics;
}
