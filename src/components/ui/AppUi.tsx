"use client";

import type { CSSProperties, ReactNode } from "react";
import { Check } from "lucide-react";

export function FlowSteps({ steps, current, inverted = false }: { steps: string[]; current: number; inverted?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const bg = done || active ? (inverted ? "#fff" : "#0E0E10") : inverted ? "rgba(255,255,255,.1)" : "rgba(0,0,0,.06)";
        const fg = done || active ? (inverted ? "#0E0E10" : "#fff") : inverted ? "rgba(255,255,255,.55)" : "#8A8A90";
        const numBg = active ? "var(--accent)" : done ? (inverted ? "rgba(14,14,16,.15)" : "rgba(255,255,255,.2)") : inverted ? "rgba(255,255,255,.15)" : "rgba(0,0,0,.08)";
        const numFg = active ? "#0E0E10" : done ? (inverted ? "#0E0E10" : "#fff") : inverted ? "rgba(255,255,255,.7)" : "#8A8A90";
        const lineBg = done ? (inverted ? "#fff" : "#0E0E10") : inverted ? "rgba(255,255,255,.15)" : "rgba(0,0,0,.1)";
        return (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {i > 0 && <div style={{ width: 20, height: 2, background: lineBg, borderRadius: 1 }} />}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px 6px 6px",
                borderRadius: 999,
                background: bg,
                color: fg,
                font: active ? "700 12px var(--font-hanken)" : "600 12px var(--font-hanken)",
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: numBg,
                  color: numFg,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  font: "800 11px var(--font-archivo)",
                  flexShrink: 0,
                }}
              >
                {done ? <Check size={12} strokeWidth={2.5} fill="none" /> : i + 1}
              </span>
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const MOVE_PROCESS_STEPS = [
  { title: "Get quotes", description: "Nearby movers send prices for your job" },
  { title: "Agree price", description: "Counter-offer until you both agree on a fair price" },
  { title: "Book & track", description: "Confirm booking, chat with mover, and track live" },
] as const;

export function MoveProcessOverview({ current }: { current: number }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1.5px solid rgba(0,0,0,.08)",
        borderRadius: 14,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ font: "700 11px var(--font-hanken)", letterSpacing: ".08em", textTransform: "uppercase", color: "#8A8A90" }}>
        Your move · step {Math.min(current + 1, MOVE_PROCESS_STEPS.length)} of {MOVE_PROCESS_STEPS.length}
      </div>
      <FlowSteps steps={MOVE_PROCESS_STEPS.map((s) => s.title)} current={current} />
      <div style={{ font: "500 13px/1.45 var(--font-hanken)", color: "#6B6B70" }}>
        {MOVE_PROCESS_STEPS[Math.min(current, MOVE_PROCESS_STEPS.length - 1)]?.description}
      </div>
    </div>
  );
}

export function UserAvatar({
  name,
  imageUrl,
  size = 44,
}: {
  name: string;
  imageUrl?: string | null;
  size?: number;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  if (imageUrl) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          flex: "none",
          background: `center/cover url(${imageUrl}) no-repeat`,
          border: "2px solid rgba(0,0,0,.08)",
        }}
        aria-label={name}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "linear-gradient(135deg,#dfe0d6,#c9cabf)",
        flex: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        font: `800 ${Math.round(size * 0.36)}px var(--font-archivo)`,
        color: "#0E0E10",
      }}
    >
      {initial}
    </div>
  );
}

export function MoverAvatar({
  name,
  imageUrl,
  size = 44,
}: {
  name: string;
  imageUrl?: string | null;
  size?: number;
}) {
  return <UserAvatar name={name} imageUrl={imageUrl} size={size} />;
}

export function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "accent" | "neutral" | "success" | "waiting";
}) {
  const styles: Record<string, CSSProperties> = {
    accent: { background: "rgba(255,222,46,.25)", color: "#0E0E10", border: "1px solid var(--accent)" },
    neutral: { background: "rgba(0,0,0,.06)", color: "#6B6B70", border: "1px solid rgba(0,0,0,.08)" },
    success: { background: "rgba(31,107,31,.1)", color: "#1f6b1f", border: "1px solid rgba(31,107,31,.25)" },
    waiting: { background: "rgba(0,0,0,.04)", color: "#8A8A90", border: "1px solid rgba(0,0,0,.1)" },
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: 999,
        font: "700 11px var(--font-hanken)",
        letterSpacing: ".02em",
        ...styles[tone],
      }}
    >
      {label}
    </span>
  );
}

export function HintBanner({
  children,
  variant = "info",
}: {
  children: ReactNode;
  variant?: "info" | "success" | "locked" | "waiting";
}) {
  const styles: Record<string, CSSProperties> = {
    info: { background: "rgba(255,222,46,.12)", border: "1px solid rgba(255,222,46,.35)", color: "#3a3a40" },
    success: { background: "rgba(31,107,31,.08)", border: "1px solid rgba(31,107,31,.2)", color: "#1f6b1f" },
    locked: { background: "rgba(0,0,0,.04)", border: "1px solid rgba(0,0,0,.08)", color: "#6B6B70" },
    waiting: { background: "rgba(0,0,0,.03)", border: "1px dashed rgba(0,0,0,.12)", color: "#6B6B70" },
  };
  return (
    <div style={{ ...styles[variant], borderRadius: 12, padding: "12px 14px", font: "500 13px/1.45 var(--font-hanken)" }}>
      {children}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div style={{ textAlign: "center", padding: "28px 20px" }}>
      {icon && <div style={{ marginBottom: 4 }}>{icon}</div>}
      <div style={{ font: "800 16px var(--font-archivo)", marginBottom: 6 }}>{title}</div>
      <div style={{ font: "500 13px/1.5 var(--font-hanken)", color: "#6B6B70", maxWidth: 280, margin: "0 auto" }}>{description}</div>
    </div>
  );
}

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ margin: 0, font: "800 22px var(--font-archivo)", letterSpacing: "-.02em" }}>{title}</h2>
      {subtitle && <p style={{ margin: "6px 0 0", font: "500 14px var(--font-hanken)", color: "#6B6B70" }}>{subtitle}</p>}
    </div>
  );
}

export function TabBar<T extends string>({
  tabs,
  active,
  onChange,
  counts,
}: {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
  counts?: Partial<Record<T, number>>;
}) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        const count = counts?.[tab.id];
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            style={{
              height: 40,
              padding: "0 16px",
              borderRadius: 10,
              border: isActive ? "1.5px solid #0E0E10" : "1.5px solid rgba(255,255,255,.15)",
              background: isActive ? "var(--accent)" : "rgba(255,255,255,.06)",
              color: isActive ? "#0E0E10" : "#fff",
              font: isActive ? "800 13px var(--font-archivo)" : "700 13px var(--font-hanken)",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {tab.label}
            {count != null && count > 0 && (
              <span
                style={{
                  minWidth: 20,
                  height: 20,
                  padding: "0 6px",
                  borderRadius: 999,
                  background: isActive ? "#0E0E10" : "var(--accent)",
                  color: isActive ? "#fff" : "#0E0E10",
                  font: "800 11px var(--font-archivo)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
