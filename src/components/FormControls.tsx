"use client";

import { CSSProperties } from "react";
import { AppIcon } from "@/components/ui/Icons";

const fieldLabelStyle: CSSProperties = {
  font: "600 10px var(--font-hanken)",
  letterSpacing: ".07em",
  textTransform: "uppercase",
  color: "#8A8A90",
  marginBottom: 5,
  display: "block",
};

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div style={fieldLabelStyle}>{children}</div>;
}

const baseInputStyle: CSSProperties = {
  width: "100%",
  height: 42,
  border: "1px solid rgba(0,0,0,.14)",
  borderRadius: 10,
  padding: "0 12px",
  font: "600 13px var(--font-hanken)",
  color: "#0E0E10",
  background: "#fff",
  outline: "none",
};

export function TextInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  height = 42,
  style,
  error,
  autoComplete,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  height?: number;
  style?: CSSProperties;
  error?: string | null;
  autoComplete?: string;
}) {
  const input = (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      autoComplete={autoComplete}
      onChange={(e) => onChange(e.target.value)}
      style={{
        ...baseInputStyle,
        height,
        border: error ? "1.5px solid #a8442a" : baseInputStyle.border,
        ...style,
      }}
    />
  );
  if (!label && !error) return input;
  return (
    <div style={{ width: "100%" }}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      {input}
      {error ? (
        <div style={{ marginTop: 6, font: "600 12px var(--font-hanken)", color: "#a8442a" }}>{error}</div>
      ) : null}
    </div>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  minHeight = 96,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minHeight?: number;
}) {
  const area = (
    <textarea
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        minHeight,
        border: "1.5px solid rgba(0,0,0,.14)",
        borderRadius: 12,
        padding: 16,
        font: "500 14px/1.5 var(--font-hanken)",
        color: "#3a3a40",
        resize: "vertical",
        outline: "none",
        fontFamily: "var(--font-hanken), system-ui, sans-serif",
      }}
    />
  );
  if (!label) return area;
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      {area}
    </div>
  );
}

export function ChipToggle({
  label,
  options,
  selected,
  onSelect,
  multi = false,
}: {
  label?: string;
  options: string[];
  selected: string | string[];
  onSelect: (v: string) => void;
  multi?: boolean;
}) {
  const isActive = (o: string) => (multi ? (selected as string[]).includes(o) : selected === o);
  const chips = (
    <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
      {options.map((o) => {
        const active = isActive(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => onSelect(o)}
            style={{
              height: 42,
              padding: "0 18px",
              borderRadius: 999,
              background: active ? "var(--accent)" : "#fff",
              border: active ? "1.5px solid var(--accent)" : "1.5px solid rgba(0,0,0,.14)",
              display: "inline-flex",
              alignItems: "center",
              font: active ? "700 14px var(--font-hanken)" : "600 14px var(--font-hanken)",
              color: active ? "#0E0E10" : "#3a3a40",
              cursor: "pointer",
            }}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
  if (!label) return chips;
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      {chips}
    </div>
  );
}

export function Checkbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label
      onClick={() => onChange(!checked)}
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        marginTop: 6,
        font: "500 14px/1.45 var(--font-hanken)",
        color: "#3a3a40",
        cursor: "pointer",
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          flex: "none",
          borderRadius: 6,
          background: checked ? "var(--accent)" : "#fff",
          border: checked ? "1.5px solid var(--accent)" : "1.5px solid rgba(0,0,0,.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          font: "900 12px var(--font-archivo)",
          color: "#0E0E10",
        }}
      >
        {checked ? <AppIcon name="check" size={12} color="#0E0E10" strokeWidth={3} /> : null}
      </span>
      {children}
    </label>
  );
}

export function Slider({
  value,
  onChange,
  min = 1,
  max = 30,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{
        width: "100%",
        height: 8,
        borderRadius: 999,
        appearance: "none",
        background: `linear-gradient(to right, var(--accent) ${pct}%, rgba(0,0,0,.1) ${pct}%)`,
        outline: "none",
        cursor: "pointer",
      }}
    />
  );
}
