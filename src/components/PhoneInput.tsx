"use client";

import { useEffect, useMemo, useState } from "react";
import { FieldLabel } from "@/components/FormControls";

export type DialCountry = {
  iso: string;
  name: string;
  dial: string;
};

/** Common dial codes — country selector + national number. */
export const DIAL_COUNTRIES: DialCountry[] = [
  { iso: "US", name: "United States", dial: "+1" },
  { iso: "CA", name: "Canada", dial: "+1" },
  { iso: "GB", name: "United Kingdom", dial: "+44" },
  { iso: "PK", name: "Pakistan", dial: "+92" },
  { iso: "IN", name: "India", dial: "+91" },
  { iso: "AE", name: "United Arab Emirates", dial: "+971" },
  { iso: "SA", name: "Saudi Arabia", dial: "+966" },
  { iso: "AU", name: "Australia", dial: "+61" },
  { iso: "DE", name: "Germany", dial: "+49" },
  { iso: "FR", name: "France", dial: "+33" },
  { iso: "NL", name: "Netherlands", dial: "+31" },
  { iso: "ES", name: "Spain", dial: "+34" },
  { iso: "IT", name: "Italy", dial: "+39" },
  { iso: "BR", name: "Brazil", dial: "+55" },
  { iso: "MX", name: "Mexico", dial: "+52" },
  { iso: "NG", name: "Nigeria", dial: "+234" },
  { iso: "KE", name: "Kenya", dial: "+254" },
  { iso: "ZA", name: "South Africa", dial: "+27" },
  { iso: "SG", name: "Singapore", dial: "+65" },
  { iso: "PH", name: "Philippines", dial: "+63" },
  { iso: "BD", name: "Bangladesh", dial: "+880" },
  { iso: "TR", name: "Turkey", dial: "+90" },
  { iso: "EG", name: "Egypt", dial: "+20" },
];

function digitsOnly(v: string) {
  return v.replace(/\D/g, "");
}

/** Split a stored phone into country + national number. */
export function parsePhoneValue(value: string, fallbackIso = "US"): { iso: string; national: string } {
  const trimmed = value.trim();
  if (!trimmed) return { iso: fallbackIso, national: "" };

  const sorted = [...DIAL_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  const normalized = trimmed.startsWith("+") ? trimmed : `+${digitsOnly(trimmed)}`;

  for (const c of sorted) {
    if (normalized.startsWith(c.dial)) {
      if (c.dial === "+1") {
        return {
          iso: fallbackIso === "CA" ? "CA" : "US",
          national: digitsOnly(normalized.slice(2)),
        };
      }
      return { iso: c.iso, national: digitsOnly(normalized.slice(c.dial.length)) };
    }
  }

  if (normalized.startsWith("+1")) {
    return { iso: fallbackIso === "CA" ? "CA" : "US", national: digitsOnly(normalized.slice(2)) };
  }

  return { iso: fallbackIso, national: digitsOnly(trimmed) };
}

export function formatFullPhone(iso: string, national: string): string {
  const country = DIAL_COUNTRIES.find((c) => c.iso === iso) ?? DIAL_COUNTRIES[0];
  const n = digitsOnly(national);
  if (!n) return "";
  return `${country.dial}${n}`;
}

export function isValidNationalPhone(iso: string, national: string): boolean {
  const n = digitsOnly(national);
  if (iso === "US" || iso === "CA") return n.length === 10;
  if (iso === "PK") return n.length === 10;
  if (iso === "GB") return n.length >= 9 && n.length <= 11;
  if (iso === "IN") return n.length === 10;
  return n.length >= 7 && n.length <= 14;
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
  defaultIso = "US",
}: PhoneInputProps) {
  const initial = useMemo(() => parsePhoneValue(value, defaultIso), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [iso, setIso] = useState(initial.iso);
  const [national, setNational] = useState(initial.national);

  useEffect(() => {
    if (!value.trim()) {
      setNational("");
      return;
    }
    const parsed = parsePhoneValue(value, iso);
    const current = formatFullPhone(iso, national);
    if (digitsOnly(value) !== digitsOnly(current)) {
      setIso(parsed.iso);
      setNational(parsed.national);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const country = DIAL_COUNTRIES.find((c) => c.iso === iso) ?? DIAL_COUNTRIES[0];

  const emit = (nextIso: string, nextNational: string) => {
    onChange(formatFullPhone(nextIso, nextNational));
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
            padding: "0 8px 0 12px",
            borderRight: "1.5px solid rgba(0,0,0,.1)",
            background: "rgba(0,0,0,.02)",
            minWidth: 86,
          }}
        >
          <select
            value={iso}
            aria-label="Country code"
            onChange={(e) => {
              const next = e.target.value;
              setIso(next);
              emit(next, national);
            }}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              background: "transparent",
              font: "700 13px 'Hanken Grotesk'",
              color: "#0E0E10",
              cursor: "pointer",
              appearance: "none",
              WebkitAppearance: "none",
              paddingRight: 16,
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238A8A90' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0 center",
            }}
          >
            {DIAL_COUNTRIES.map((c) => (
              <option key={c.iso} value={c.iso} title={`${c.name} (${c.dial})`}>
                {c.iso}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            flex: "none",
            display: "flex",
            alignItems: "center",
            padding: "0 2px 0 12px",
            font: "800 15px 'Archivo'",
            color: "#0E0E10",
            letterSpacing: ".02em",
          }}
        >
          {country.dial}
        </div>

        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={national}
          placeholder="555 0142"
          onChange={(e) => {
            const next = digitsOnly(e.target.value).slice(0, 15);
            setNational(next);
            emit(iso, next);
          }}
          style={{
            flex: 1,
            minWidth: 0,
            border: "none",
            outline: "none",
            background: "transparent",
            padding: "0 14px 0 8px",
            font: "600 15px 'Hanken Grotesk'",
            color: "#0E0E10",
          }}
        />
      </div>
      {error ? (
        <div style={{ marginTop: 6, font: "600 12px 'Hanken Grotesk'", color: "#a8442a" }}>{error}</div>
      ) : (
        <div style={{ marginTop: 6, font: "500 12px 'Hanken Grotesk'", color: "#8A8A90" }}>
          Select country, then enter your number — saved as {country.dial}
          {national || "…"}
        </div>
      )}
    </div>
  );
}
