"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FieldLabel } from "@/components/FormControls";
import { AppIcon } from "@/components/ui/Icons";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toIsoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatMoveDate(value: string) {
  if (!value) return "";
  const parsed = value.includes("-") && value.length === 10
    ? new Date(`${value}T12:00:00`)
    : new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

type DatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  height?: number;
  inline?: boolean;
};

export default function DatePicker({
  value,
  onChange,
  label,
  placeholder = "Select date",
  height = 42,
  inline = false,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const today = startOfDay(new Date());

  const selected = useMemo(() => {
    if (!value) return null;
    const d = value.includes("-") && value.length === 10
      ? new Date(`${value}T12:00:00`)
      : new Date(value);
    return Number.isNaN(d.getTime()) ? null : startOfDay(d);
  }, [value]);

  const [viewMonth, setViewMonth] = useState(() => selected ?? today);

  useEffect(() => {
    if (selected) setViewMonth(selected);
  }, [selected]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const cells = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const items: Array<{ date: Date | null; key: string }> = [];

    for (let i = 0; i < firstDay; i += 1) {
      items.push({ date: null, key: `empty-${i}` });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      items.push({ date: new Date(year, month, day), key: `${year}-${month}-${day}` });
    }
    return items;
  }, [viewMonth]);

  const pickDate = (d: Date) => {
    onChange(toIsoDate(d));
    setOpen(false);
  };

  const display = value ? formatMoveDate(value) : placeholder;

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
        font: "600 13px 'Hanken Grotesk'",
        color: value ? "#0E0E10" : "#8A8A90",
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
          width: 18,
          height: 18,
          borderRadius: 4,
          border: "1.5px solid rgba(0,0,0,.28)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          font: "800 9px 'Archivo'",
          color: "#6B6B70",
          flex: "none",
        }}
      >
        D
      </span>
    </button>
  );

  const calendar = (
    <div
      style={{
        ...(inline
          ? {
              width: "100%",
              background: "#fff",
              border: "1.5px solid rgba(0,0,0,.12)",
              borderRadius: 16,
              padding: 16,
              boxSizing: "border-box" as const,
            }
          : {
              position: "absolute",
              top: "calc(100% + 8px)",
              left: 0,
              width: "min(320px, calc(100vw - 32px))",
              zIndex: 100,
              background: "#fff",
              border: "1.5px solid rgba(0,0,0,.12)",
              borderRadius: 16,
              padding: 16,
              boxShadow: "0 18px 40px rgba(0,0,0,.14)",
              boxSizing: "border-box" as const,
            }),
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
          style={navBtn}
        >
          <AppIcon name="chevronLeft" size={16} color="#0E0E10" />
        </button>
        <div style={{ font: "800 15px 'Archivo'" }}>
          {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
        </div>
        <button
          type="button"
          onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
          style={navBtn}
        >
          <AppIcon name="chevronRight" size={16} color="#0E0E10" />
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 4, marginBottom: 6 }}>
        {WEEKDAYS.map((d) => (
          <div key={d} style={{ textAlign: "center", font: "700 11px 'Hanken Grotesk'", color: "#8A8A90", padding: "4px 0" }}>
            {d}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 4 }}>
        {cells.map(({ date, key }) => {
          if (!date) return <div key={key} />;
          const disabled = date < today;
          const isSelected = selected?.getTime() === date.getTime();
          const isToday = date.getTime() === today.getTime();
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => pickDate(date)}
              style={{
                width: "100%",
                minWidth: 0,
                padding: 0,
                height: 36,
                borderRadius: 10,
                border: isToday && !isSelected ? "1.5px solid var(--accent)" : "1.5px solid transparent",
                background: isSelected ? "var(--accent)" : disabled ? "transparent" : "#fff",
                color: disabled ? "#c8c8cc" : "#0E0E10",
                font: isSelected ? "800 13px 'Archivo'" : "600 13px 'Hanken Grotesk'",
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );

  if (inline) {
    return (
      <div ref={rootRef} style={{ width: "100%" }}>
        {label && <FieldLabel>{label}</FieldLabel>}
        {value && (
          <div style={{ font: "600 14px 'Hanken Grotesk'", color: "#0E0E10", marginBottom: 10 }}>
            Selected: {formatMoveDate(value)}
          </div>
        )}
        {calendar}
      </div>
    );
  }

  if (!label) {
    return (
      <div ref={rootRef} style={{ position: "relative", flex: 1 }}>
        {trigger}
        {open ? calendar : null}
      </div>
    );
  }

  return (
    <div ref={rootRef} style={{ position: "relative", flex: 1 }}>
      <FieldLabel>{label}</FieldLabel>
      {trigger}
      {open ? calendar : null}
    </div>
  );
}

const navBtn: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 10,
  border: "1.5px solid rgba(0,0,0,.12)",
  background: "#fff",
  cursor: "pointer",
  font: "700 14px 'Hanken Grotesk'",
  color: "#0E0E10",
};
