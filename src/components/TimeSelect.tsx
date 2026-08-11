"use client";

import { useEffect, useRef, useState } from "react";
import { FieldLabel } from "@/components/FormControls";

export const TIME_WINDOW_OPTIONS = [
  { value: "Morning", label: "Morning", sub: "8:00 – 11:00 AM" },
  { value: "Afternoon", label: "Afternoon", sub: "12:00 – 4:00 PM" },
  { value: "Evening", label: "Evening", sub: "5:00 – 8:00 PM" },
  { value: "Any time", label: "Any time", sub: "Flexible all day" },
] as const;

type TimeSelectProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  height?: number;
};

export default function TimeSelect({ value, onChange, label, height = 42 }: TimeSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = TIME_WINDOW_OPTIONS.find((o) => o.value === value) ?? TIME_WINDOW_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const trigger = (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      style={{
        width: "100%",
        height,
        border: "1px solid rgba(0,0,0,.14)",
        borderRadius: 10,
        padding: "0 12px",
        font: "600 13px var(--font-hanken)",
        color: "#0E0E10",
        background: "#fff",
        outline: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        textAlign: "left",
      }}
    >
      <span>{selected.label}</span>
      <span style={{ fontSize: 10, opacity: 0.55, transform: open ? "rotate(180deg)" : "none", transition: "transform .15s ease" }}>▼</span>
    </button>
  );

  const menu = open ? (
    <div
      style={{
        position: "absolute",
        top: "calc(100% + 8px)",
        left: 0,
        right: 0,
        zIndex: 50,
        background: "#fff",
        border: "1.5px solid rgba(0,0,0,.12)",
        borderRadius: 14,
        padding: 6,
        boxShadow: "0 18px 40px rgba(0,0,0,.14)",
        overflow: "hidden",
      }}
    >
      {TIME_WINDOW_OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              onChange(option.value);
              setOpen(false);
            }}
            style={{
              width: "100%",
              border: "none",
              borderRadius: 10,
              padding: "10px 12px",
              background: active ? "var(--accent)" : "transparent",
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <span style={{ font: active ? "800 14px var(--font-archivo)" : "700 14px var(--font-hanken)", color: "#0E0E10" }}>
              {option.label}
            </span>
            <span style={{ font: "500 12px var(--font-hanken)", color: "#6B6B70" }}>{option.sub}</span>
          </button>
        );
      })}
    </div>
  ) : null;

  if (!label) {
    return (
      <div ref={rootRef} style={{ position: "relative", flex: 1 }}>
        {trigger}
        {menu}
      </div>
    );
  }

  return (
    <div ref={rootRef} style={{ position: "relative", flex: 1 }}>
      <FieldLabel>{label}</FieldLabel>
      {trigger}
      {menu}
    </div>
  );
}
