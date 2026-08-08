"use client";

import { useEffect, useMemo, useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { toLatLng, type MapPlace } from "@/lib/maps";

export function useGeocodedPlace(place?: MapPlace | null): MapPlace | null {
  const geocoding = useMapsLibrary("geocoding");

  // Resolvable without a network round-trip: no address, already has coords, or the
  // geocoding library hasn't loaded yet (in which case we pass the place through as-is).
  const fastResolved = useMemo<MapPlace | null>(() => {
    if (!place?.address) return null;
    if (toLatLng(place)) return place;
    if (!geocoding) return place;
    return null;
  }, [place, geocoding]);

  const geocodeAddress = fastResolved ? "" : place?.address ?? "";
  const [geocoded, setGeocoded] = useState<{ address: string; place: MapPlace } | null>(null);

  useEffect(() => {
    if (!geocodeAddress || !geocoding) return;
    let cancelled = false;
    const geocoder = new geocoding.Geocoder();
    geocoder.geocode({ address: geocodeAddress }, (results, status) => {
      if (cancelled) return;
      if (status === "OK" && results?.[0]?.geometry?.location) {
        const loc = results[0].geometry.location;
        setGeocoded({
          address: geocodeAddress,
          place: {
            address: results[0].formatted_address || geocodeAddress,
            lat: loc.lat(),
            lng: loc.lng(),
          },
        });
      } else {
        setGeocoded({ address: geocodeAddress, place: { address: geocodeAddress } });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [geocodeAddress, geocoding]);

  if (fastResolved) return fastResolved;
  return geocoded && geocoded.address === geocodeAddress ? geocoded.place : null;
}
