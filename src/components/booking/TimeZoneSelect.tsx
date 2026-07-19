"use client";

import { FieldLabel } from "@/components/FormControls";

const TIME_ZONES = [
  "America/Toronto",
  "America/Vancouver",
  "America/Edmonton",
  "America/Winnipeg",
  "America/Halifax",
  "America/St_Johns",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Karachi",
  "Australia/Sydney",
  "Pacific/Auckland",
] as const;

export function defaultTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Toronto";
  } catch {
    return "America/Toronto";
  }
}

type TimeZoneSelectProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
};

export function TimeZoneSelect({ value, onChange, label = "Time zone" }: TimeZoneSelectProps) {
  const options = TIME_ZONES.includes(value as (typeof TIME_ZONES)[number])
    ? TIME_ZONES
    : [value as string, ...TIME_ZONES];

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          height: 42,
          border: "1px solid rgba(0,0,0,.14)",
          borderRadius: 10,
          padding: "0 12px",
          font: "600 13px 'Hanken Grotesk'",
          color: "#0E0E10",
          background: "#fff",
          outline: "none",
          cursor: "pointer",
        }}
      >
        {options.map((zone) => (
          <option key={zone} value={zone}>
            {zone.replace(/_/g, " ")}
          </option>
        ))}
      </select>
    </div>
  );
}
