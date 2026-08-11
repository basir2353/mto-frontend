"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { discoveryApi, vehiclesApi, type NearbyMover, type NearbyMoversResponse, type VehicleType } from "@/lib/api";
import type { NearbyMoversSortBy } from "@/lib/api/public";
import type { MapPlace } from "@/lib/maps";
import { toLatLng } from "@/lib/maps";

type Options = { pickup?: MapPlace | null; destination?: MapPlace | null; vehicleFilter: string; sortBy: NearbyMoversSortBy };

function matchesFilter(mover: NearbyMover, filter: string, types: VehicleType[]) {
  if (!filter) return true;
  const typeId = types.find((type) => type.name === filter)?.id;
  if (typeId) return mover.vehicleTypes.some((vehicle) => vehicle.id === typeId);
  return mover.vehicleTypes.some((vehicle) => vehicle.name.toLowerCase() === filter.toLowerCase());
}

export function useNearbyMovers({ pickup, destination, vehicleFilter, sortBy }: Options) {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [data, setData] = useState<NearbyMoversResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    vehiclesApi.listTypes().then(setVehicleTypes).catch(() => setVehicleTypes([]));
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
      setData(await discoveryApi.nearbyMovers({
        latitude: pickupCoords.lat,
        longitude: pickupCoords.lng,
        radiusKm: 40,
        sortBy,
        destinationLatitude: destinationCoords?.lat,
        destinationLongitude: destinationCoords?.lng,
      }));
    } catch (caught) {
      setData(null);
      setError(caught instanceof Error ? caught.message : "Failed to load nearby movers");
    } finally {
      setLoading(false);
    }
  }, [pickup, destination, sortBy]);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 30000);
    return () => clearInterval(timer);
  }, [refresh]);

  const allMovers = useMemo(() => data?.movers ?? [], [data?.movers]);
  const movers = useMemo(() => {
    if (!vehicleFilter) return allMovers;
    return [...allMovers].sort((left, right) => Number(matchesFilter(right, vehicleFilter, vehicleTypes)) - Number(matchesFilter(left, vehicleFilter, vehicleTypes)));
  }, [allMovers, vehicleFilter, vehicleTypes]);
  const matchingCount = useMemo(() => allMovers.filter((mover) => matchesFilter(mover, vehicleFilter, vehicleTypes)).length, [allMovers, vehicleFilter, vehicleTypes]);

  return {
    vehicleTypes,
    movers,
    allMovers,
    matchingCount,
    summary: data?.summary ?? { total: 0, onlineCount: 0, averageArrivalMinutes: 0 },
    mapMovers: movers.map((mover) => ({ id: mover.id, address: mover.businessName, lat: mover.latitude, lng: mover.longitude })),
    loading,
    error,
    refresh,
  };
}
