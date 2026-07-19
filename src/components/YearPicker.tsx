"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FieldLabel } from "@/components/FormControls";
import { AppIcon } from "@/components/ui/Icons";

type YearPickerProps = {
  label?: string;
  value: string;
  onChange: (year: string) => void;
  minYear?: number;
  maxYear?: number;
  error?: string | null;
  height?: number;
};

export function YearPicker({
  label = "Year",
  value,
  onChange,
  minYear = 1990,
  maxYear = new Date().getFullYear() + 1,
  error,
  height = 52,
}: YearPickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = Number(value) || null;

  const pageSize = 12;
  const [pageStart, setPageStart] = useState(() => {
    const y = selected ?? new Date().getFullYear();
    const start = Math.floor((y - minYear) / pageSize) * pageSize + minYear;
    return Math.min(Math.max(start, minYear), Math.max(minYear, maxYear - pageSize + 1));
  });

  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = pageStart; y < pageStart + pageSize && y <= maxYear; y++) list.push(y);
    return list;
  }, [pageStart, maxYear]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!selected) return;
    const start = Math.floor((selected - minYear) / pageSize) * pageSize + minYear;
    setPageStart(Math.min(Math.max(start, minYear), Math.max(minYear, maxYear - pageSize + 1)));
  }, [selected, minYear, maxYear]);

  const canPrev = pageStart > minYear;
  const canNext = pageStart + pageSize <= maxYear;

  return (
    <div ref={rootRef} style={{ width: "100%", position: "relative" }}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          height,
          borderRadius: 12,
          border: error ? "1.5px solid #a8442a" : "1.5px solid rgba(0,0,0,.14)",
          background: "#fff",
          padding: "0 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          font: value ? "700 15px 'Hanken Grotesk'" : "600 15px 'Hanken Grotesk'",
          color: value ? "#0E0E10" : "#8A8A90",
        }}
      >
        <span>{value || "Select model year"}</span>
        <AppIcon name="calendar" size={18} color="#8A8A90" />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            zIndex: 40,
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1.5px solid rgba(0,0,0,.12)",
            borderRadius: 16,
            boxShadow: "0 18px 48px rgba(0,0,0,.14)",
            padding: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <button
              type="button"
              disabled={!canPrev}
              onClick={() => setPageStart((s) => Math.max(minYear, s - pageSize))}
              style={navBtn}
            >
              <AppIcon name="chevronLeft" size={16} color={canPrev ? "#0E0E10" : "#c0c0c4"} />
            </button>
            <div style={{ font: "800 14px 'Archivo'" }}>
              {years[0]} – {years[years.length - 1]}
            </div>
            <button
              type="button"
              disabled={!canNext}
              onClick={() => setPageStart((s) => Math.min(s + pageSize, maxYear - pageSize + 1))}
              style={navBtn}
            >
              <AppIcon name="chevronRight" size={16} color={canNext ? "#0E0E10" : "#c0c0c4"} />
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {years.map((y) => {
              const active = selected === y;
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    onChange(String(y));
                    setOpen(false);
                  }}
                  style={{
                    height: 44,
                    borderRadius: 10,
                    border: active ? "1.5px solid #0E0E10" : "1.5px solid rgba(0,0,0,.1)",
                    background: active ? "var(--accent)" : "#fff",
                    font: active ? "800 14px 'Archivo'" : "700 14px 'Hanken Grotesk'",
                    color: "#0E0E10",
                    cursor: "pointer",
                  }}
                >
                  {y}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {error ? (
        <div style={{ marginTop: 6, font: "600 12px 'Hanken Grotesk'", color: "#a8442a" }}>{error}</div>
      ) : null}
    </div>
  );
}

const navBtn: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 10,
  border: "1.5px solid rgba(0,0,0,.12)",
  background: "#fff",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};
