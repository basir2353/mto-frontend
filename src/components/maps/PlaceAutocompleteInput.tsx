"use client";

import { useEffect, useRef } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { hasGoogleMaps } from "@/lib/env";
import type { MapPlace } from "@/lib/maps";

type PlaceAutocompleteInputProps = {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: MapPlace) => void;
  placeholder?: string;
  dot?: boolean;
  types?: string[];
  height?: number;
  inputStyle?: React.CSSProperties;
  containerStyle?: React.CSSProperties;
  biasLocation?: { lat: number; lng: number } | null;
};

export default function PlaceAutocompleteInput({
  value,
  onChange,
  onPlaceSelect,
  placeholder,
  dot,
  types,
  height = 42,
  inputStyle,
  containerStyle,
  biasLocation,
}: PlaceAutocompleteInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  const onPlaceSelectRef = useRef(onPlaceSelect);
  const places = useMapsLibrary("places");

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onPlaceSelectRef.current = onPlaceSelect;
  }, [onPlaceSelect]);

  useEffect(() => {
    if (!hasGoogleMaps || !places || !inputRef.current) return;

    const input = inputRef.current;
    const autocomplete = new places.Autocomplete(input, {
      fields: ["formatted_address", "geometry", "name", "address_components"],
      componentRestrictions: { country: "ca" },
      ...(types?.length ? { types } : {}),
    });
    if (biasLocation && typeof google !== "undefined") {
      const center = new google.maps.LatLng(biasLocation.lat, biasLocation.lng);
      autocomplete.setBounds(new google.maps.Circle({ center, radius: 40000 }).getBounds()!);
    }

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const address = place.formatted_address ?? place.name ?? input.value ?? "";
      const lat = place.geometry?.location?.lat();
      const lng = place.geometry?.location?.lng();
      const countryPart = place.address_components?.find((part) =>
        part.types.includes("country"),
      );
      const country = countryPart?.long_name;
      const countryCode = countryPart?.short_name;

      onChangeRef.current(address);
      if (lat != null && lng != null) {
        onPlaceSelectRef.current?.({ address, lat, lng, country, countryCode });
      } else {
        onPlaceSelectRef.current?.({ address, country, countryCode });
      }
    });

    return () => {
      if (typeof google !== "undefined") {
        google.maps.event.removeListener(listener);
      }
    };
  }, [biasLocation?.lat, biasLocation?.lng, places, types]);

  const input = (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete="off"
      style={{
        flex: 1,
        border: "none",
        outline: "none",
        font: "600 15px var(--font-hanken)",
        color: "#0E0E10",
        background: "transparent",
        ...inputStyle,
      }}
    />
  );

  if (!hasGoogleMaps) {
    return (
      <div
        style={{
          height,
          border: "1.5px solid rgba(0,0,0,.14)",
          borderRadius: 12,
          background: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 13,
          padding: "0 16px",
          ...containerStyle,
        }}
      >
        {dot !== undefined && (
          <span
            style={
              dot
                ? {
                    width: 11,
                    height: 11,
                    borderRadius: "50%",
                    background: "var(--accent)",
                    border: "2px solid #0E0E10",
                    flex: "none",
                  }
                : { width: 11, height: 11, background: "#0E0E10", flex: "none" }
            }
          />
        )}
        {input}
      </div>
    );
  }

  return (
    <div
      style={{
        height,
        border: "1.5px solid rgba(0,0,0,.14)",
        borderRadius: 12,
        background: "#fff",
        display: "flex",
        alignItems: "center",
        gap: dot !== undefined ? 13 : 0,
        padding: "0 16px",
        ...containerStyle,
      }}
    >
      {dot !== undefined && (
        <span
          style={
            dot
              ? {
                  width: 11,
                  height: 11,
                  borderRadius: "50%",
                  background: "var(--accent)",
                  border: "2px solid #0E0E10",
                  flex: "none",
                }
              : { width: 11, height: 11, background: "#0E0E10", flex: "none" }
          }
        />
      )}
      {input}
    </div>
  );
}
