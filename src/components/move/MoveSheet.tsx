"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import styles from "./MoveSheet.module.css";

export type MoveSheetId = "chat" | "negotiate" | "quotes" | "progress" | "pay" | "proof" | "manage";

type MoveSheetProps = {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: number;
  /** Mobile: tall bottom drawer (almost full height). */
  tall?: boolean;
  /** Mobile: half-screen bottom drawer. */
  half?: boolean;
  /** Mobile: centered popup instead of a bottom drawer. */
  mobileModal?: boolean;
};

export function MoveSheet({
  title,
  open,
  onClose,
  children,
  width = 500,
  tall = false,
  half = false,
  mobileModal = false,
}: MoveSheetProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [canDismiss, setCanDismiss] = useState(false);

  useEffect(() => {
    setPortalReady(true);
    const media = window.matchMedia("(max-width: 820px)");
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!open) {
      setCanDismiss(false);
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Ignore the same tap that opened the sheet.
    const unlock = window.setTimeout(() => setCanDismiss(true), 280);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(unlock);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open || !portalReady) return null;

  const useMobileModal = isMobile && mobileModal;
  const useBottomDrawer = isMobile && !mobileModal;
  const drawerClass = [
    styles.panel,
    useMobileModal ? styles.panelModal : useBottomDrawer ? styles.panelDrawer : styles.panelSide,
    useBottomDrawer && half ? styles.panelDrawerHalf : "",
    useBottomDrawer && tall ? styles.panelDrawerTall : "",
    useBottomDrawer ? "app-motion-sheet-up" : useMobileModal ? "" : "app-motion-sheet-left",
  ]
    .filter(Boolean)
    .join(" ");

  return createPortal(
    <>
      <button
        type="button"
        className={`${styles.backdrop} app-motion-backdrop`}
        aria-label="Close sheet"
        onClick={() => {
          if (canDismiss) onClose();
        }}
      />
      <div
        className={drawerClass}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={
          isMobile
            ? undefined
            : ({
                ["--sheet-width"]: `${width}px`,
              } as CSSProperties)
        }
      >
        {useBottomDrawer && (
          <div className={styles.handle} aria-hidden="true">
            <span />
          </div>
        )}

        <div className={`${styles.head} ${isMobile ? "" : styles.headSide}`}>
          <h2 className={styles.title}>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className={styles.closeBtn}>
            <X size={18} strokeWidth={2} fill="none" />
          </button>
        </div>

        <div className={`${styles.body} ${isMobile ? "" : styles.bodySide}`}>{children}</div>
      </div>
    </>,
    document.body,
  );
}

export function ActionTile({
  icon,
  label,
  onClick,
  accent,
  badge,
  disabled,
  compact,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  accent?: boolean;
  badge?: string;
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        minWidth: 0,
        padding: compact ? "8px 6px" : "12px 8px",
        borderRadius: compact ? 10 : 12,
        border: accent ? "2px solid #0E0E10" : "1.5px solid rgba(0,0,0,.1)",
        background: accent ? "#0E0E10" : "#fff",
        color: accent ? "#fff" : "#0E0E10",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: compact ? 4 : 6,
        position: "relative",
        minHeight: compact ? 56 : undefined,
      }}
    >
      <span style={{ lineHeight: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</span>
      <span style={{ font: compact ? "700 10px 'Hanken Grotesk'" : "700 11px 'Hanken Grotesk'", letterSpacing: ".02em" }}>{label}</span>
      {badge ? (
        <span
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            minWidth: 16,
            height: 16,
            padding: "0 4px",
            borderRadius: 999,
            background: "var(--accent)",
            color: "#0E0E10",
            font: "800 9px 'Archivo'",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}
