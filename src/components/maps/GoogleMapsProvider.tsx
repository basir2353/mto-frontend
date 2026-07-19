"use client";

import { APIProvider } from "@vis.gl/react-google-maps";
import { googleMapsApiKey, hasGoogleMaps } from "@/lib/env";

export default function GoogleMapsProvider({ children }: { children: React.ReactNode }) {
  if (!hasGoogleMaps) return <>{children}</>;

  return (
    <APIProvider apiKey={googleMapsApiKey} libraries={["places", "geometry", "geocoding"]}>
      {children}
    </APIProvider>
  );
}
