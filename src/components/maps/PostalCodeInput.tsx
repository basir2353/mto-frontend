"use client";

import { useEffect, useRef } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { FieldLabel } from "@/components/FormControls";
import { hasGoogleMaps } from "@/lib/env";

function extractPostalCode(
  components: google.maps.GeocoderAddressComponent[] | undefined,
  fallback: string,
) {
  const postal = components?.find((part) => part.types.includes("postal_code"));
  if (postal?.long_name) return postal.long_name;
  // Sometimes only the first segment is typed — keep user input trimmed.
  return fallback.trim();
}

type PostalCodeInputProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  height?: number;
  /** ISO country restriction (default Canada). */
  country?: string;
};

/**
 * Zip / postal field with Google Places suggestions.
 * Selecting a suggestion writes the postal_code component into the field.
 */
export default function PostalCodeInput({
  value,
  onChange,
  label = "Zip / postal code",
  placeholder = "M5V 2T6",
  height = 50,
  country = "ca",
}: PostalCodeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  const places = useMapsLibrary("places");

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!hasGoogleMaps || !places || !inputRef.current) return;

    const input = inputRef.current;
    const autocomplete = new places.Autocomplete(input, {
      fields: ["address_components", "formatted_address", "name"],
      types: ["postal_code"],
      componentRestrictions: { country },
    });

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const code = extractPostalCode(
        place.address_components,
        place.name || place.formatted_address || input.value || "",
      );
      onChangeRef.current(code);
    });

    return () => {
      if (typeof google !== "undefined") {
        google.maps.event.removeListener(listener);
      }
    };
  }, [places, country]);

  return (
    <div style={{ width: "100%", position: "relative" }}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="postal-code"
        inputMode="text"
        style={{
          width: "100%",
          height,
          border: "1px solid rgba(0,0,0,.14)",
          borderRadius: 12,
          padding: "0 14px",
          font: "600 14px var(--font-hanken, 'Hanken Grotesk', sans-serif)",
          color: "#0E0E10",
          background: "#fff",
          outline: "none",
        }}
      />
      {!hasGoogleMaps ? (
        <div
          style={{
            marginTop: 6,
            font: "500 12px var(--font-hanken, 'Hanken Grotesk', sans-serif)",
            color: "#8A8A90",
          }}
        >
          Maps suggestions need NEXT_PUBLIC_GOOGLE_MAPS_KEY.
        </div>
      ) : null}
    </div>
  );
}
