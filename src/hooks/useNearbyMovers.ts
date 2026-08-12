"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { discoveryApi, vehiclesApi, type NearbyMover, type NearbyMoversResponse, type VehicleType } from "@/lib/api";
import type { NearbyMoversSortBy } from "@/lib/api/public";
import type { MapPlace } from "@/lib/maps";
import { toLatLng } from "@/lib/maps";

type UseNearbyMoversOptions = {
  pickup?: MapPlace | null;
  destination?: MapPlace | null;
  vehicleFilter: string;
  sortBy: NearbyMoversSortBy;
};

function moverMatchesVehicleFilter(mover: NearbyMover, vehicleFilter: string, vehicleTypes: VehicleType[]) {
  if (!vehicleFilter) return true;
  const typeId = vehicleTypes.find((type) => type.name === vehicleFilter)?.id;
  if (typeId) return mover.vehicleTypes.some((vehicle) => vehicle.id === typeId);
  const normalized = vehicleFilter.toLowerCase();
  return mover.vehicleTypes.some((vehicle) => vehicle.name.toLowerCase() === normalized);
}

function sortMoversForDisplay(
  movers: NearbyMover[],
  vehicleFilter: string,
  vehicleTypes: VehicleType[],
): NearbyMover[] {
  if (!vehicleFilter) return movers;
  return [...movers].sort((a, b) => {
    const aMatch = moverMatchesVehicleFilter(a, vehicleFilter, vehicleTypes);
    const bMatch = moverMatchesVehicleFilter(b, vehicleFilter, vehicleTypes);
    if (aMatch === bMatch) return 0;
    return aMatch ? -1 : 1;
  });
}

export function useNearbyMovers({
  pickup,
  destination,
  vehicleFilter,
  sortBy,
}: UseNearbyMoversOptions) {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [data, setData] = useState<NearbyMoversResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    vehiclesApi
      .listTypes()
      .then((types) => {
        const order = ["pickup truck", "cargo van", "box truck", "car/suv"];
        const sorted = [...types]
          .filter((t) => t.isActive !== false)
          .sort((a, b) => {
            const ai = order.indexOf(a.name.toLowerCase());
            const bi = order.indexOf(b.name.toLowerCase());
            const aRank = ai === -1 ? 100 + Number(a.maxVolumeM3 ?? 0) : ai;
            const bRank = bi === -1 ? 100 + Number(b.maxVolumeM3 ?? 0) : bi;
            return aRank - bRank;
          });
        setVehicleTypes(sorted);
      })
      .catch(() => setVehicleTypes([]));
  }, []);

  const refresh = useCallback(async () => {
    const pickupCoords = toLatLng(pickup);
    if (!pickupCoords) {
      setData(null);
      setError(null);
      return;
    }

    const destinationCoords = toLatLng(destination);
    setLoading(true);
    setError(null);

    try {
      const response = await discoveryApi.nearbyMovers({
        latitude: pickupCoords.lat,
        longitude: pickupCoords.lng,
        radiusKm: 40,
        sortBy,
        destinationLatitude: destinationCoords?.lat,
        destinationLongitude: destinationCoords?.lng,
      });
      setData(response);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Failed to load nearby movers");
    } finally {
      setLoading(false);
    }
  }, [pickup, destination, sortBy]);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 30000);
    return () => clearInterval(timer);
  }, [refresh]);

  const allMovers = (data?.movers ?? []) as NearbyMover[];
  const movers = useMemo(
    () => sortMoversForDisplay(allMovers, vehicleFilter, vehicleTypes),
    [allMovers, vehicleFilter, vehicleTypes],
  );
  const matchingCount = useMemo(
    () => allMovers.filter((mover) => moverMatchesVehicleFilter(mover, vehicleFilter, vehicleTypes)).length,
    [allMovers, vehicleFilter, vehicleTypes],
  );

  const mapMovers: Array<MapPlace & { id: string }> =
    movers.map((mover) => ({
      id: mover.id,
      address: mover.businessName,
      lat: mover.latitude,
      lng: mover.longitude,
    }));

  return {
    vehicleTypes,
    movers,
    allMovers,
    matchingCount,
    summary: data?.summary ?? { total: 0, onlineCount: 0, averageArrivalMinutes: 0 },
    mapMovers,
    loading,
    error,
    refresh,
  };
}
