"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FieldLabel } from "@/components/FormControls";
import { AppIcon } from "@/components/ui/Icons";
import { useAnchoredPanel } from "@/hooks/useAnchoredPanel";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const FONT_BODY = "var(--font-hanken, 'Hanken Grotesk', sans-serif)";
const FONT_DISPLAY = "var(--font-archivo, Archivo, sans-serif)";
const ACCENT = "#FFDE2E";
const ACCENT_BLUE = "#2F6BFF";

function toIsoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseIsoDate(value: string): Date | null {
  if (!value) return null;
  const d =
    value.includes("-") && value.length === 10
      ? new Date(`${value}T12:00:00`)
      : new Date(value);
  return Number.isNaN(d.getTime()) ? null : startOfDay(d);
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function formatMoveDate(value: string) {
  if (!value) return "";
  const parsed = parseIsoDate(value);
  if (!parsed) return value;
  return parsed.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatMdy(value: string) {
  if (!value) return "";
  const parsed = parseIsoDate(value);
  if (!parsed) return value;
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const d = String(parsed.getDate()).padStart(2, "0");
  return `${m}/${d}/${parsed.getFullYear()}`;
}

type DatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  height?: number;
  inline?: boolean;
  disablePast?: boolean;
  disableFuture?: boolean;
  displayFormat?: "long" | "mdy";
  /**
   * `wheels` = Month / Day / Year columns (best for date of birth).
   * `calendar` = classic month grid (best for booking dates).
   * Default: wheels when disableFuture, else calendar.
   */
  variant?: "calendar" | "wheels";
};

type Cell = { date: Date; inMonth: boolean; key: string };

export default function DatePicker({
  value,
  onChange,
  label,
  placeholder = "mm/dd/yyyy",
  height = 50,
  inline = false,
  disablePast = true,
  disableFuture = false,
  displayFormat = "long",
  variant,
}: DatePickerProps) {
  const mode = variant ?? (disableFuture ? "wheels" : "calendar");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const anchor = useAnchoredPanel(open && !inline, rootRef);
  const today = startOfDay(new Date());

  const selected = useMemo(() => parseIsoDate(value), [value]);

  const defaultBirth = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 25);
    return startOfDay(d);
  }, []);

  const [viewMonth, setViewMonth] = useState(() => selected ?? today);
  const [wheelY, setWheelY] = useState(
    () => (selected ?? defaultBirth).getFullYear(),
  );
  const [wheelM, setWheelM] = useState(
    () => (selected ?? defaultBirth).getMonth(),
  );
  const [wheelD, setWheelD] = useState(
    () => (selected ?? defaultBirth).getDate(),
  );

  useEffect(() => {
    if (selected) {
      setViewMonth(selected);
      setWheelY(selected.getFullYear());
      setWheelM(selected.getMonth());
      setWheelD(selected.getDate());
    }
  }, [selected]);

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

  const isDisabled = (d: Date) => {
    if (disablePast && d < today) return true;
    if (disableFuture && d > today) return true;
    return false;
  };

  const yearOptions = useMemo(() => {
    const end = disableFuture ? today.getFullYear() : today.getFullYear() + 5;
    const start = disablePast ? today.getFullYear() : today.getFullYear() - 100;
    const years: number[] = [];
    for (let y = end; y >= start; y -= 1) years.push(y);
    return years;
  }, [disableFuture, disablePast, today]);

  const maxDay = daysInMonth(wheelY, wheelM);
  const safeDay = Math.min(wheelD, maxDay);

  useEffect(() => {
    if (wheelD > maxDay) setWheelD(maxDay);
  }, [wheelD, maxDay]);

  const applyWheel = (y: number, m: number, d: number) => {
    const day = Math.min(d, daysInMonth(y, m));
    const next = startOfDay(new Date(y, m, day));
    if (isDisabled(next)) return;
    setWheelY(y);
    setWheelM(m);
    setWheelD(day);
    onChange(toIsoDate(next));
  };

  const cells = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const dim = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();
    const items: Cell[] = [];

    for (let i = firstDay - 1; i >= 0; i -= 1) {
      const day = prevDays - i;
      items.push({
        date: new Date(year, month - 1, day),
        inMonth: false,
        key: `p-${day}`,
      });
    }
    for (let day = 1; day <= dim; day += 1) {
      items.push({
        date: new Date(year, month, day),
        inMonth: true,
        key: `c-${day}`,
      });
    }
    const trailing = 42 - items.length;
    for (let day = 1; day <= trailing; day += 1) {
      items.push({
        date: new Date(year, month + 1, day),
        inMonth: false,
        key: `n-${day}`,
      });
    }
    return items;
  }, [viewMonth]);

  const pickDate = (d: Date) => {
    if (isDisabled(d)) return;
    onChange(toIsoDate(d));
    setOpen(false);
  };

  const display = value
    ? displayFormat === "long"
      ? formatMoveDate(value)
      : formatMdy(value)
    : placeholder;

  const trigger = (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      aria-expanded={open}
      style={{
        width: "100%",
        height,
        border: "1px solid rgba(0,0,0,.14)",
        borderRadius: 12,
        padding: "0 14px",
        font: `600 14px ${FONT_BODY}`,
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
      <AppIcon name="calendar" size={18} color="#0E0E10" />
    </button>
  );

  const wheelsPanel = (
    <div ref={panelRef} style={panelStyle(inline, anchor)}>
      <div
        style={{
          font: `700 13px ${FONT_BODY}`,
          color: "#6B6B70",
          marginBottom: 12,
          textAlign: "center",
        }}
      >
        Choose month, day, and year
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr 1fr",
          gap: 8,
        }}
      >
        <WheelColumn
          label="Month"
          value={wheelM}
          options={MONTHS_SHORT.map((label, value) => ({ label, value }))}
          onChange={(m) => applyWheel(wheelY, m, safeDay)}
        />
        <WheelColumn
          label="Day"
          value={safeDay}
          options={Array.from({ length: maxDay }, (_, i) => ({
            label: String(i + 1),
            value: i + 1,
          }))}
          onChange={(d) => applyWheel(wheelY, wheelM, d)}
        />
        <WheelColumn
          label="Year"
          value={wheelY}
          options={yearOptions.map((y) => ({ label: String(y), value: y }))}
          onChange={(y) => applyWheel(y, wheelM, safeDay)}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 14,
          gap: 10,
        }}
      >
        <button
          type="button"
          onClick={() => {
            onChange("");
            setOpen(false);
          }}
          style={ghostBtn}
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => {
            applyWheel(wheelY, wheelM, safeDay);
            setOpen(false);
          }}
          style={primaryBtn}
        >
          Done
        </button>
      </div>
    </div>
  );

  const calendarPanel = (
    <div ref={panelRef} style={panelStyle(inline, anchor)}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
          gap: 8,
        }}
      >
        <button
          type="button"
          onClick={() =>
            setViewMonth(
              new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1),
            )
          }
          style={navSquare}
          aria-label="Previous month"
        >
          ‹
        </button>
        <div style={{ font: `800 15px ${FONT_DISPLAY}` }}>
          {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
        </div>
        <button
          type="button"
          onClick={() =>
            setViewMonth(
              new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1),
            )
          }
          style={navSquare}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
          gap: 2,
          marginBottom: 4,
        }}
      >
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              font: `600 12px ${FONT_BODY}`,
              color: "#6B6B70",
              padding: "6px 0",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
          gap: 2,
        }}
      >
        {cells.map(({ date, inMonth, key }) => {
          const disabled = isDisabled(date);
          const isSelected = selected?.getTime() === date.getTime();
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
                height: 38,
                borderRadius: 8,
                border: isSelected ? "1.5px solid #0E0E10" : "1.5px solid transparent",
                background: isSelected ? ACCENT : "transparent",
                color: isSelected
                  ? "#0E0E10"
                  : !inMonth || disabled
                    ? "#B0B0B5"
                    : "#0E0E10",
                font: isSelected
                  ? `800 13px ${FONT_DISPLAY}`
                  : `600 13px ${FONT_BODY}`,
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 12,
        }}
      >
        <button
          type="button"
          onClick={() => {
            onChange("");
            setOpen(false);
          }}
          style={footerLink}
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => {
            if (!isDisabled(today)) pickDate(today);
            else setViewMonth(today);
          }}
          style={footerLink}
        >
          Today
        </button>
      </div>
    </div>
  );

  const panel = mode === "wheels" ? wheelsPanel : calendarPanel;
  const portaled =
    open && typeof document !== "undefined"
      ? createPortal(panel, document.body)
      : null;

  if (inline) {
    return (
      <div ref={rootRef} style={{ width: "100%" }}>
        {label ? <FieldLabel>{label}</FieldLabel> : null}
        {panel}
      </div>
    );
  }

  return (
    <div ref={rootRef} style={{ position: "relative", flex: 1, width: "100%" }}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      {trigger}
      {portaled}
    </div>
  );
}

function WheelColumn({
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
          font: `700 11px ${FONT_BODY}`,
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
          height: 180,
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
                height: 40,
                border: "none",
                borderRadius: 8,
                background: on ? ACCENT : "transparent",
                color: "#0E0E10",
                font: on ? `800 14px ${FONT_DISPLAY}` : `600 14px ${FONT_BODY}`,
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

function panelStyle(
  inline: boolean,
  anchor?: { top: number; left: number; width: number },
): React.CSSProperties {
  return inline
    ? {
        width: "100%",
        background: "#fff",
        border: "1px solid rgba(0,0,0,.14)",
        borderRadius: 14,
        padding: 14,
        boxSizing: "border-box",
      }
    : {
        position: "fixed",
        top: anchor?.top ?? 0,
        left: anchor?.left ?? 0,
        width: Math.max(anchor?.width ?? 280, 300),
        zIndex: 4000,
        background: "#fff",
        border: "1px solid rgba(0,0,0,.14)",
        borderRadius: 14,
        padding: 14,
        boxShadow: "0 16px 36px rgba(0,0,0,.18)",
        boxSizing: "border-box",
      };
}

const navSquare: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 10,
  border: "1px solid rgba(0,0,0,.12)",
  background: "#fff",
  cursor: "pointer",
  font: `700 20px ${FONT_BODY}`,
  color: "#0E0E10",
};

const footerLink: React.CSSProperties = {
  border: "none",
  background: "transparent",
  cursor: "pointer",
  color: ACCENT_BLUE,
  font: `600 13px ${FONT_BODY}`,
  padding: 0,
};

const ghostBtn: React.CSSProperties = {
  flex: 1,
  height: 44,
  borderRadius: 10,
  border: "1.5px solid rgba(0,0,0,.14)",
  background: "#fff",
  font: `700 14px ${FONT_BODY}`,
  cursor: "pointer",
  color: "#0E0E10",
};

const primaryBtn: React.CSSProperties = {
  flex: 1,
  height: 44,
  borderRadius: 10,
  border: "none",
  background: ACCENT,
  font: `800 14px ${FONT_DISPLAY}`,
  cursor: "pointer",
  color: "#0E0E10",
};
