"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import PlaceAutocompleteInput from "@/components/maps/PlaceAutocompleteInput";
import { useAuth } from "@/contexts/AuthContext";
import { hasGoogleMaps } from "@/lib/env";
import type { MapPlace } from "@/lib/maps";

type QuoteWidgetProps = {
  onPickupPlaceChange?: (place: MapPlace) => void;
  onDropoffPlaceChange?: (place: MapPlace) => void;
};

export default function QuoteWidget({ onPickupPlaceChange, onDropoffPlaceChange }: QuoteWidgetProps = {}) {
  const { isAuthenticated } = useAuth();
  const [pickup, setPickup] = useState("");
  const [pickupPlace, setPickupPlace] = useState<MapPlace>({ address: "" });
  const [dropoff, setDropoff] = useState("");
  const [dropoffPlace, setDropoffPlace] = useState<MapPlace>({ address: "" });

  const handlePickupSelect = useCallback(
    (place: MapPlace) => {
      setPickupPlace(place);
      setPickup(place.address);
      onPickupPlaceChange?.(place);
    },
    [onPickupPlaceChange]
  );

  const handleDropoffSelect = useCallback(
    (place: MapPlace) => {
      setDropoffPlace(place);
      setDropoff(place.address);
      onDropoffPlaceChange?.(place);
    },
    [onDropoffPlaceChange]
  );

  return (
    <div className="mto-quote-widget">
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <PlaceAutocompleteInput
          dot
          value={pickup}
          onChange={setPickup}
          onPlaceSelect={handlePickupSelect}
          placeholder="Pickup location"
          height={52}
          containerStyle={{ padding: "0 15px", gap: 12 }}
          inputStyle={{ font: "600 15px 'Hanken Grotesk'" }}
        />
        <PlaceAutocompleteInput
          dot={false}
          value={dropoff}
          onChange={setDropoff}
          onPlaceSelect={handleDropoffSelect}
          placeholder="Drop-off location"
          height={52}
          containerStyle={{ padding: "0 15px", gap: 12 }}
          inputStyle={{ font: "600 15px 'Hanken Grotesk'" }}
        />
      </div>
      {hasGoogleMaps && (
        <p style={{ margin: "10px 0 0", font: "500 12px 'Hanken Grotesk'", color: "#8A8A90" }}>
          Start typing an address to see Google Maps suggestions
        </p>
      )}
      <Link
        href={{
          pathname: isAuthenticated ? "/customer-app" : "/auth",
          hash: isAuthenticated ? undefined : "login",
          query: {
            ...(pickup ? { pickup } : {}),
            ...(dropoff ? { destination: dropoff } : {}),
            ...(pickupPlace.lat != null ? { pickupLat: String(pickupPlace.lat) } : {}),
            ...(pickupPlace.lng != null ? { pickupLng: String(pickupPlace.lng) } : {}),
            ...(dropoffPlace.lat != null ? { destinationLat: String(dropoffPlace.lat) } : {}),
            ...(dropoffPlace.lng != null ? { destinationLng: String(dropoffPlace.lng) } : {}),
          },
        }}
        style={{
          marginTop: 12,
          height: 54,
          borderRadius: 12,
          background: "var(--accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          font: "800 16px 'Archivo'",
          color: "#0E0E10",
          textDecoration: "none",
        }}
      >
        See prices →
      </Link>
    </div>
  );
}
