"use client";

import { FieldLabel } from "@/components/FormControls";
import PlaceAutocompleteInput from "@/components/maps/PlaceAutocompleteInput";
import type { MapPlace } from "@/lib/maps";

type LocationFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: MapPlace) => void;
  placeholder?: string;
  dot?: boolean;
  types?: string[];
  height?: number;
  error?: string | null;
};

export default function LocationField({
  label,
  dot,
  types,
  height = 42,
  error,
  ...props
}: LocationFieldProps) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <PlaceAutocompleteInput
        {...props}
        dot={dot}
        types={types}
        height={height}
        containerStyle={{
          gap: dot !== undefined ? 13 : 0,
          padding: "0 12px",
          border: error ? "1px solid #a8442a" : undefined,
        }}
      />
      {error ? (
        <div style={{ marginTop: 6, font: "600 12px 'Hanken Grotesk'", color: "#a8442a" }}>{error}</div>
      ) : null}
    </div>
  );
}
