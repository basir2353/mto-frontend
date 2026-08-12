"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FieldLabel } from "@/components/FormControls";
import { useAnchoredPanel } from "@/hooks/useAnchoredPanel";

/** Legacy window labels — still accepted when reading old values. */
export const TIME_WINDOW_OPTIONS = [
  { value: "Morning", label: "Morning", sub: "8:00 – 11:00 AM" },
  { value: "Afternoon", label: "Afternoon", sub: "12:00 – 4:00 PM" },
  { value: "Evening", label: "Evening", sub: "5:00 – 8:00 PM" },
  { value: "Any time", label: "Any time", sub: "Flexible all day" },
] as const;

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = [0, 15, 30, 45];
const PERIODS = ["AM", "PM"] as const;

type ParsedTime = { hour: number; minute: number; period: "AM" | "PM" };

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function formatClockTime(hour: number, minute: number, period: "AM" | "PM") {
  return `${hour}:${pad(minute)} ${period}`;
}

export function parseClockTime(value: string | null | undefined): ParsedTime {
  const raw = (value || "").trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match) {
    const hour = Math.min(12, Math.max(1, Number(match[1])));
    const minute = MINUTES.includes(Number(match[2]) as (typeof MINUTES)[number])
      ? Number(match[2])
      : Math.round(Number(match[2]) / 15) * 15;
    const period = match[3].toUpperCase() === "PM" ? "PM" : "AM";
    return { hour, minute: minute === 60 ? 0 : minute, period };
  }

  const lower = raw.toLowerCase();
  if (lower.includes("afternoon")) return { hour: 1, minute: 0, period: "PM" };
  if (lower.includes("evening")) return { hour: 5, minute: 0, period: "PM" };
  if (lower.includes("any")) return { hour: 10, minute: 0, period: "AM" };
  return { hour: 9, minute: 0, period: "AM" };
}

type TimeSelectProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  height?: number;
};

export default function TimeSelect({ value, onChange, label, height = 42 }: TimeSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const anchor = useAnchoredPanel(open, rootRef);
  const parsed = useMemo(() => parseClockTime(value), [value]);
  const [hour, setHour] = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);
  const [period, setPeriod] = useState<"AM" | "PM">(parsed.period);

  useEffect(() => {
    const next = parseClockTime(value);
    setHour(next.hour);
    setMinute(next.minute);
    setPeriod(next.period);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const display = formatClockTime(parsed.hour, parsed.minute, parsed.period);

  const commit = (h: number, m: number, p: "AM" | "PM") => {
    onChange(formatClockTime(h, m, p));
  };

  const trigger = (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      aria-haspopup="dialog"
      aria-expanded={open}
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
      <span>{display}</span>
      <span
        style={{
          fontSize: 10,
          opacity: 0.55,
          transform: open ? "rotate(180deg)" : "none",
          transition: "transform .15s ease",
        }}
      >
        ▼
      </span>
    </button>
  );

  const menu =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label="Select time"
            style={{
              position: "fixed",
              top: anchor.top,
              left: anchor.left,
              width: Math.max(anchor.width, 260),
              zIndex: 4000,
              background: "#fff",
              border: "1.5px solid rgba(0,0,0,.12)",
              borderRadius: 14,
              padding: 10,
              boxShadow: "0 18px 40px rgba(0,0,0,.18)",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <Wheel
                label="Hour"
                value={hour}
                options={HOURS.map((h) => ({ label: String(h), value: h }))}
                onChange={(h) => {
                  setHour(h);
                  commit(h, minute, period);
                }}
              />
              <Wheel
                label="Min"
                value={minute}
                options={MINUTES.map((m) => ({ label: pad(m), value: m }))}
                onChange={(m) => {
                  setMinute(m);
                  commit(hour, m, period);
                }}
              />
              <Wheel
                label="AM/PM"
                value={period === "AM" ? 0 : 1}
                options={PERIODS.map((p, i) => ({ label: p, value: i }))}
                onChange={(i) => {
                  const p = i === 1 ? "PM" : "AM";
                  setPeriod(p);
                  commit(hour, minute, p);
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                marginTop: 10,
                width: "100%",
                height: 40,
                border: "none",
                borderRadius: 10,
                background: "#0E0E10",
                color: "#fff",
                font: "700 13px var(--font-hanken)",
                cursor: "pointer",
              }}
            >
              Done
            </button>
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} style={{ position: "relative", flex: 1 }}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      {trigger}
      {menu}
    </div>
  );
}

function Wheel({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: number;
  options: Array<{ label: string; value: number }>;
  onChange: (value: number) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-v="${value}"]`);
    el?.scrollIntoView({ block: "center" });
  }, [value, options.length]);

  return (
    <div>
      <div
        style={{
          font: "700 10px var(--font-hanken)",
          letterSpacing: ".06em",
          textTransform: "uppercase",
          color: "#8A8A90",
          marginBottom: 6,
          textAlign: "center",
        }}
      >
        {label}
      </div>
      <div
        ref={listRef}
        style={{
          height: 160,
          overflowY: "auto",
          border: "1px solid rgba(0,0,0,.12)",
          borderRadius: 12,
          background: "#F5F4EF",
          padding: 4,
          scrollSnapType: "y mandatory",
        }}
      >
        {options.map((opt) => {
          const on = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              data-v={opt.value}
              onClick={() => onChange(opt.value)}
              style={{
                width: "100%",
                height: 36,
                border: "none",
                borderRadius: 8,
                background: on ? "#0E0E10" : "transparent",
                color: on ? "#fff" : "#0E0E10",
                font: on ? "800 14px var(--font-archivo)" : "600 14px var(--font-hanken)",
                cursor: "pointer",
                scrollSnapAlign: "center",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
