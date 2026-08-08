"use client";

import { useCallback, useState } from "react";
import PlaceAutocompleteInput from "@/components/maps/PlaceAutocompleteInput";
import { hasGoogleMaps } from "@/lib/env";
import type { MapPlace } from "@/lib/maps";
import { appUrls } from "@/lib/theme/apps";

type QuoteWidgetProps = {
  onPickupPlaceChange?: (place: MapPlace) => void;
  onDropoffPlaceChange?: (place: MapPlace) => void;
};

export default function QuoteWidget({ onPickupPlaceChange, onDropoffPlaceChange }: QuoteWidgetProps = {}) {
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
      <a
        href={(() => {
          const params = new URLSearchParams();
          if (pickup) params.set("pickup", pickup);
          if (dropoff) params.set("destination", dropoff);
          if (pickupPlace.lat != null) params.set("pickupLat", String(pickupPlace.lat));
          if (pickupPlace.lng != null) params.set("pickupLng", String(pickupPlace.lng));
          if (dropoffPlace.lat != null) params.set("destinationLat", String(dropoffPlace.lat));
          if (dropoffPlace.lng != null) params.set("destinationLng", String(dropoffPlace.lng));
          const q = params.toString();
          return `${appUrls.customerApp}/customer-app${q ? `?${q}` : ""}`;
        })()}
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
      </a>
    </div>
  );
}
