"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import PlaceAutocompleteInput from "@/components/maps/PlaceAutocompleteInput";
import { hasGoogleMaps } from "@/lib/env";
import type { MapPlace } from "@/lib/maps";

type QuoteWidgetProps = {
  onPickupPlaceChange?: (place: MapPlace) => void;
  onDropoffPlaceChange?: (place: MapPlace) => void;
};

function buildBookHref(
  pickup: string,
  dropoff: string,
  pickupPlace: MapPlace,
  dropoffPlace: MapPlace,
) {
  const params = new URLSearchParams();
  if (pickup) params.set("pickup", pickup);
  if (dropoff) params.set("destination", dropoff);
  if (pickupPlace.lat != null) params.set("pickupLat", String(pickupPlace.lat));
  if (pickupPlace.lng != null) params.set("pickupLng", String(pickupPlace.lng));
  if (dropoffPlace.lat != null) params.set("destinationLat", String(dropoffPlace.lat));
  if (dropoffPlace.lng != null) params.set("destinationLng", String(dropoffPlace.lng));
  const q = params.toString();
  return `/book${q ? `?${q}` : ""}`;
}

export default function QuoteWidget({ onPickupPlaceChange, onDropoffPlaceChange }: QuoteWidgetProps = {}) {
  const router = useRouter();
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
    [onPickupPlaceChange],
  );

  const handleDropoffSelect = useCallback(
    (place: MapPlace) => {
      setDropoffPlace(place);
      setDropoff(place.address);
      onDropoffPlaceChange?.(place);
    },
    [onDropoffPlaceChange],
  );

  const goBook = () => {
    if (!pickup.trim() || !dropoff.trim()) return;
    router.push(buildBookHref(pickup, dropoff, pickupPlace, dropoffPlace));
  };

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
          inputStyle={{ font: "600 15px var(--font-hanken)" }}
        />
        <PlaceAutocompleteInput
          dot={false}
          value={dropoff}
          onChange={setDropoff}
          onPlaceSelect={handleDropoffSelect}
          placeholder="Drop-off location"
          height={52}
          containerStyle={{ padding: "0 15px", gap: 12 }}
          inputStyle={{ font: "600 15px var(--font-hanken)" }}
        />
      </div>
      {hasGoogleMaps && (
        <p style={{ margin: "10px 0 0", font: "500 12px var(--font-hanken)", color: "#8A8A90" }}>
          Start typing an address to see Google Maps suggestions
        </p>
      )}
      <button
        type="button"
        onClick={goBook}
        disabled={!pickup.trim() || !dropoff.trim()}
        style={{
          marginTop: 12,
          height: 54,
          width: "100%",
          border: "none",
          borderRadius: 12,
          background: "var(--accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          font: "800 16px var(--font-archivo)",
          color: "#0E0E10",
          cursor: !pickup.trim() || !dropoff.trim() ? "default" : "pointer",
          opacity: !pickup.trim() || !dropoff.trim() ? 0.65 : 1,
        }}
      >
        See prices →
      </button>
    </div>
  );
}
