"use client";

import styles from "./MtoLoader.module.css";

const SIZES = {
  sm: { box: 28, font: 15, radius: 9, ringInset: -4 },
  md: { box: 42, font: 22, radius: 12, ringInset: -5 },
  lg: { box: 56, font: 28, radius: 16, ringInset: -6 },
} as const;

export function MtoLoader({
  label = "Loading…",
  size = "md",
  showLabel = true,
}: {
  label?: string;
  size?: keyof typeof SIZES;
  showLabel?: boolean;
}) {
  const s = SIZES[size];
  return (
    <div className={styles.wrap} role="status" aria-live="polite" aria-busy="true">
      <div
        className={styles.mark}
        style={{ width: s.box, height: s.box, fontSize: s.font, borderRadius: s.radius }}
        aria-hidden
      >
        <span className={styles.ring} style={{ inset: s.ringInset, borderRadius: s.radius + 4 }} />
        M
      </div>
      {showLabel && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <p className={styles.label}>{label}</p>
          <div className={styles.dots} aria-hidden>
            <span />
            <span />
            <span />
          </div>
        </div>
      )}
    </div>
  );
}

export function PageLoader({ label = "Loading MoveThisOut…" }: { label?: string }) {
  return (
    <div className={styles.page}>
      <MtoLoader label={label} size="lg" />
    </div>
  );
}

export function BlockLoader({ label = "Loading…", minHeight }: { label?: string; minHeight?: number }) {
  return (
    <div className={styles.block} style={minHeight ? { minHeight } : undefined}>
      <MtoLoader label={label} size="md" />
    </div>
  );
}

export function InlineLoader({ label }: { label?: string }) {
  return (
    <span className={styles.inline} role="status" aria-live="polite" aria-busy="true">
      <MtoLoader size="sm" showLabel={false} />
      {label ? <span className={styles.label} style={{ margin: 0 }}>{label}</span> : null}
    </span>
  );
}
