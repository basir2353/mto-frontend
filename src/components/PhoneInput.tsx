"use client";

import { useMemo, useState } from "react";
import { FieldLabel } from "@/components/FormControls";

export type DialCountry = {
  iso: string;
  name: string;
  dial: string;
};

/** Canada-only dial codes for MoveThisOut. */
export const DIAL_COUNTRIES: DialCountry[] = [
  { iso: "CA", name: "Canada", dial: "+1" },
];

function digitsOnly(v: string) {
  return v.replace(/\D/g, "");
}

/** Split a stored phone into country + national number. */
export function parsePhoneValue(value: string, fallbackIso = "CA"): { iso: string; national: string } {
  const trimmed = value.trim();
  if (!trimmed) return { iso: "CA", national: "" };

  const normalized = trimmed.startsWith("+") ? trimmed : `+${digitsOnly(trimmed)}`;
  if (normalized.startsWith("+1")) {
    return { iso: "CA", national: digitsOnly(normalized.slice(2)) };
  }
  // Strip non-CA country codes and keep remaining digits as national (user must re-enter if wrong).
  return { iso: fallbackIso === "CA" ? "CA" : "CA", national: digitsOnly(trimmed).replace(/^1/, "") };
}

export function formatFullPhone(iso: string, national: string): string {
  const n = digitsOnly(national);
  if (!n) return "";
  return `+1${n}`;
}

export function isValidNationalPhone(iso: string, national: string): boolean {
  const n = digitsOnly(national);
  return n.length === 10;
}

type PhoneInputProps = {
  label?: string;
  value: string;
  onChange: (fullPhone: string) => void;
  error?: string | null;
  height?: number;
  defaultIso?: string;
};

export function PhoneInput({
  label = "Phone",
  value,
  onChange,
  error,
  height = 52,
  defaultIso = "CA",
}: PhoneInputProps) {
  const initial = useMemo(() => parsePhoneValue(value, defaultIso), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [national, setNational] = useState(initial.national);
  const iso = "CA";

  const [syncedValue, setSyncedValue] = useState(value);
  if (value !== syncedValue) {
    setSyncedValue(value);
    if (!value.trim()) {
      setNational("");
    } else {
      const parsed = parsePhoneValue(value, iso);
      const current = formatFullPhone(iso, national);
      if (digitsOnly(value) !== digitsOnly(current)) {
        setNational(parsed.national);
      }
    }
  }

  const emit = (nextNational: string) => {
    onChange(formatFullPhone(iso, nextNational));
  };

  return (
    <div style={{ width: "100%" }}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <div
        style={{
          display: "flex",
          height,
          borderRadius: 12,
          border: error ? "1.5px solid #a8442a" : "1.5px solid rgba(0,0,0,.14)",
          background: "#fff",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            flex: "none",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 12px",
            borderRight: "1.5px solid rgba(0,0,0,.1)",
            background: "rgba(0,0,0,.02)",
            minWidth: 92,
            font: "700 13px 'Hanken Grotesk'",
            color: "#0E0E10",
          }}
          aria-label="Canada country code"
        >
          <span>CA</span>
          <span style={{ font: "800 15px 'Archivo'" }}>+1</span>
        </div>

        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="4165551234"
          value={national}
          onChange={(e) => {
            const next = digitsOnly(e.target.value).slice(0, 10);
            setNational(next);
            emit(next);
          }}
          style={{
            flex: 1,
            minWidth: 0,
            border: "none",
            outline: "none",
            padding: "0 14px",
            font: "600 15px 'Hanken Grotesk'",
            color: "#0E0E10",
            background: "transparent",
          }}
        />
      </div>
      {error ? (
        <div style={{ marginTop: 6, font: "600 12px 'Hanken Grotesk'", color: "#a8442a" }}>{error}</div>
      ) : (
        <div style={{ marginTop: 6, font: "500 12px 'Hanken Grotesk'", color: "#8A8A90" }}>
          Canadian mobile numbers only (+1)
        </div>
      )}
    </div>
  );
}
