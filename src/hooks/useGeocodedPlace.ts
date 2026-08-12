"use client";

import { useEffect, useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { toLatLng, type MapPlace } from "@/lib/maps";

export function useGeocodedPlace(place?: MapPlace | null): MapPlace | null {
  const [resolved, setResolved] = useState<MapPlace | null>(place ?? null);
  const geocoding = useMapsLibrary("geocoding");

  useEffect(() => {
    if (!place?.address) {
      setResolved(null);
      return;
    }

    if (toLatLng(place)) {
      setResolved(place);
      return;
    }

    if (!geocoding) {
      setResolved(place);
      return;
    }

    let cancelled = false;
    const geocoder = new geocoding.Geocoder();
    geocoder.geocode({ address: place.address }, (results, status) => {
      if (cancelled) return;
      if (status === "OK" && results?.[0]?.geometry?.location) {
        const loc = results[0].geometry.location;
        setResolved({
          address: results[0].formatted_address || place.address,
          lat: loc.lat(),
          lng: loc.lng(),
        });
      } else {
        setResolved(place);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [place?.address, place?.lat, place?.lng, geocoding]);

  return resolved;
}
