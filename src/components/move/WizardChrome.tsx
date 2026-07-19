"use client";

import { useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouteMetrics } from "@/hooks/useRouteMetrics";
import type { MapPlace } from "@/lib/maps";
import { NotificationsBell } from "@/components/notifications/NotificationsBell";
import type { Notification } from "@/lib/api/types";

export type WizardStepId = "plan" | "details" | "quotes" | "book" | "track";

const WIZARD_STEPS: { id: WizardStepId; label: string }[] = [
  { id: "plan", label: "Plan" },
  { id: "details", label: "Details" },
  { id: "quotes", label: "Quotes" },
  { id: "book", label: "Book" },
  { id: "track", label: "Track" },
];

export function WizardHeader({
  stepId,
  displayName,
  onLogoClick,
  onOpenNotification,
}: {
  stepId: WizardStepId;
  displayName: string;
  onLogoClick: () => void;
  onOpenNotification?: (notification: Notification) => void | Promise<void>;
}) {
  const index = Math.max(0, WIZARD_STEPS.findIndex((s) => s.id === stepId));
  const current = WIZARD_STEPS[index];

  return (
    <div className="wizard-header" style={{ flex: "none", background: "#fff", borderBottom: "1px solid rgba(0,0,0,.08)" }}>
      <div className="wizard-header-row" style={{ height: 64, display: "flex", alignItems: "center", padding: "0 26px", gap: 16 }}>
        <div className="wizard-logo" onClick={onLogoClick} style={{ display: "flex", alignItems: "center", gap: 11, cursor: "pointer" }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              background: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              font: "900 17px 'Archivo'",
              color: "#0E0E10",
            }}
          >
            M
          </div>
          <span className="wizard-logo-text" style={{ font: "800 19px 'Archivo'", letterSpacing: "-.02em", color: "#0E0E10" }}>MoveThisOut</span>
        </div>

        <div className="wizard-header-actions" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
          <span className="wizard-step-label" style={{ font: "600 13px 'Hanken Grotesk'", color: "#8A8A90" }}>
            Step {index + 1} of {WIZARD_STEPS.length} · {current?.label}
          </span>
          <span className="wizard-header-bell">
            <NotificationsBell dark={false} onOpenNotification={onOpenNotification} />
          </span>
          <Link
            className="wizard-header-avatar"
            href="/customer-app/profile"
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              font: "800 13px 'Archivo'",
              color: "#0E0E10",
              textDecoration: "none",
            }}
            aria-label="Profile"
          >
            {displayName.charAt(0).toUpperCase()}
          </Link>
        </div>
      </div>
      <div className="wizard-progress" style={{ display: "flex", gap: 5, padding: "0 26px 12px" }}>
        {WIZARD_STEPS.map((s, i) => (
          <div
            key={s.id}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 999,
              background: i <= index ? "#0E0E10" : "rgba(0,0,0,.1)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function WizardShell({
  left,
  right,
  children,
  mobileSheetSize = "standard",
}: {
  left: ReactNode;
  right: ReactNode;
  children?: ReactNode;
  mobileSheetSize?: "compact" | "standard" | "tall";
}) {
  const initialSheetHeight = mobileSheetSize === "tall" ? 42 : mobileSheetSize === "standard" ? 36 : 24;
  const [mobileSheetHeight, setMobileSheetHeight] = useState(initialSheetHeight);
  const dragStart = useRef({ y: 0, height: initialSheetHeight });
  const isCollapsed = mobileSheetHeight <= 28;

  const startSheetDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    const pane = event.currentTarget.parentElement;
    const measured =
      pane && typeof window !== "undefined"
        ? Math.round((pane.getBoundingClientRect().height / window.innerHeight) * 100)
        : mobileSheetHeight;
    dragStart.current = { y: event.clientY, height: Math.max(measured, 22) };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveSheet = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const deltaVh = ((dragStart.current.y - event.clientY) / window.innerHeight) * 100;
    setMobileSheetHeight(Math.min(88, Math.max(22, dragStart.current.height + deltaVh)));
  };

  const toggleSheet = () => {
    setMobileSheetHeight((height) => (height > 40 ? 24 : 78));
  };

  return (
    <div
      className={`wizard-shell wizard-sheet-${mobileSheetSize} ${isCollapsed ? "wizard-sheet-collapsed" : "wizard-sheet-expanded"}`}
      style={{ flex: 1, display: "flex", minHeight: 0, "--mobile-sheet-height": `${mobileSheetHeight}%` } as React.CSSProperties}
    >
      <div
        className="wizard-form-pane"
        style={{
          width: 420,
          flex: "none",
          background: "#fff",
          borderRight: "1px solid rgba(0,0,0,.08)",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <button
          type="button"
          className="wizard-sheet-handle"
          aria-label="Drag to resize booking panel"
          onPointerDown={startSheetDrag}
          onPointerMove={moveSheet}
          onDoubleClick={toggleSheet}
        >
          <span />
        </button>
        {left}
      </div>
      <div className="wizard-map-pane" style={{ flex: 1, position: "relative", overflow: "hidden", background: "#E7EAE3", minWidth: 0 }}>{right}</div>
      {children}
      <style>{`
        @media(max-width:900px){
          .wizard-header{display:none!important}
          .wizard-shell{display:block!important;position:relative;overflow:hidden;isolation:isolate;background:#dfe3dc}
          .wizard-map-pane{position:absolute!important;inset:0;z-index:0;width:100%;height:100%;border:0}
          .wizard-form-pane{
            position:absolute;z-index:10;left:0;right:0;bottom:0;width:auto!important;
            height:var(--mobile-sheet-height,24%);min-height:0;max-height:88%;
            border:1px solid rgba(0,0,0,.08)!important;border-bottom:0!important;border-radius:24px 24px 0 0;
            box-shadow:0 -8px 36px rgba(14,14,16,.18);overflow:hidden;transition:height .12s ease-out;
          }
          .wizard-sheet-collapsed .wizard-form-pane{
            height:auto!important;
            max-height:88%;
            overflow:visible;
          }
          .wizard-sheet-collapsed .plan-sheet-body,
          .wizard-sheet-collapsed .wizard-form-pane>div[style*="flex: 1"],
          .wizard-sheet-collapsed .wizard-form-pane>div[style*="flex:1"]{
            flex:0 0 auto!important;
            overflow:visible!important;
            min-height:0!important;
          }
          .wizard-form-pane:has(.wizard-sheet-handle:active){transition:none}
          .wizard-sheet-handle{display:flex;flex:none;width:100%;height:24px;padding:8px 0 6px;border:0;background:#fff;align-items:center;justify-content:center;cursor:ns-resize;touch-action:none;position:relative;z-index:3}
          .wizard-sheet-handle span{width:46px;height:5px;border-radius:999px;background:rgba(0,0,0,.2)}
          .wizard-sheet-collapsed .plan-sheet-heading,
          .wizard-sheet-collapsed .plan-sheet-sub,
          .wizard-sheet-collapsed .plan-sheet-options,
          .wizard-sheet-collapsed .plan-sheet-status{display:none!important}
          .wizard-sheet-collapsed .plan-sheet-body{padding:2px 16px 14px!important}
          .wizard-sheet-collapsed .plan-sheet-locations{margin-top:0!important}
          .wizard-sheet-collapsed .plan-sheet-footer{display:none!important}
          .wizard-map-pane>div[style*="bottom: 24px"]{display:none!important}
          .wizard-map-pane>div[style*="top: 24px"]{top:76px!important;left:12px!important;right:auto!important;max-width:calc(100% - 24px)}
          .wizard-map-pane>div[style*="bottom: 24px"][style*="right: 24px"]{display:none!important}
        }
        @media(max-width:560px){
          .wizard-form-pane{left:0;right:0;bottom:0;border-radius:22px 22px 0 0}
        }
        @media(max-height:650px) and (max-width:900px){
          .wizard-form-pane{max-height:86%}
        }
        @media(min-width:901px){.wizard-sheet-handle{display:none}}
      `}</style>
    </div>
  );
}

export function MapPill({
  children,
  position = "bottom-left",
}: {
  children: ReactNode;
  position?: "bottom-left" | "top-left";
}) {
  return (
    <div
      style={{
        position: "absolute",
        [position === "top-left" ? "top" : "bottom"]: 24,
        left: 24,
        background: "#0E0E10",
        color: "#fff",
        borderRadius: 14,
        padding: "12px 16px",
        font: "600 13px 'Hanken Grotesk'",
        boxShadow: "0 12px 30px rgba(0,0,0,.25)",
        zIndex: 2,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      {children}
    </div>
  );
}

export function RouteMetricsBadge({ pickup, destination }: { pickup: MapPlace; destination: MapPlace }) {
  const { tripKm, tripMinutes } = useRouteMetrics(pickup, destination);
  if (tripKm == null) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: 24,
        left: 24,
        background: "#0E0E10",
        color: "#fff",
        borderRadius: 14,
        padding: "10px 16px",
        display: "flex",
        gap: 18,
        boxShadow: "0 12px 30px rgba(0,0,0,.25)",
        zIndex: 2,
      }}
    >
      <div>
        <div style={{ font: "800 16px 'Archivo'" }}>{(tripKm * 0.621371).toFixed(1)} mi</div>
        <div style={{ font: "600 10px 'Hanken Grotesk'", color: "rgba(255,255,255,.6)", letterSpacing: ".04em" }}>DISTANCE</div>
      </div>
      <div style={{ width: 1, background: "rgba(255,255,255,.15)" }} />
      <div>
        <div style={{ font: "800 16px 'Archivo'" }}>~{tripMinutes ?? "-"} min</div>
        <div style={{ font: "600 10px 'Hanken Grotesk'", color: "rgba(255,255,255,.6)", letterSpacing: ".04em" }}>DRIVE</div>
      </div>
    </div>
  );
}

export function ZoomControls() {
  return (
    <div style={{ position: "absolute", top: 24, right: 24, display: "flex", flexDirection: "column", background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 6px 18px rgba(0,0,0,.14)" }}>
      <div style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", font: "600 22px 'Hanken Grotesk'", borderBottom: "1px solid rgba(0,0,0,.08)" }}>+</div>
      <div style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", font: "600 22px 'Hanken Grotesk'" }}>-</div>
    </div>
  );
}

export const stepHeading: React.CSSProperties = { margin: "0 0 4px", font: "800 26px 'Archivo'", letterSpacing: "-.02em" };
export const stepSub: React.CSSProperties = { margin: "0 0 26px", font: "500 14px 'Hanken Grotesk'", color: "#6B6B70" };

export function ReviewCard({ label, value, sub, onEdit }: { label: string; value: string; sub?: string; onEdit?: () => void }) {
  return (
    <div style={{ border: "1.5px solid rgba(0,0,0,.1)", borderRadius: 12, padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, minWidth: 0 }}>
      <div style={{ minWidth: 0, overflowWrap: "anywhere" }}>
        <div style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".08em", color: "#8A8A90", textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
        <div style={{ font: "600 15px 'Hanken Grotesk'" }}>{value}</div>
        {sub && <div style={{ font: "500 13px 'Hanken Grotesk'", color: "#6B6B70" }}>{sub}</div>}
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          style={{ border: "none", background: "transparent", font: "700 13px 'Hanken Grotesk'", color: "#0E0E10", cursor: "pointer", textDecoration: "underline" }}
        >
          Edit
        </button>
      )}
    </div>
  );
}

export function WizardFooter({
  onBack,
  onNext,
  nextLabel,
  busy,
  disabled,
}: {
  onBack: () => void;
  onNext: () => void | Promise<void>;
  nextLabel: string;
  busy?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="wizard-footer" style={{ display: "flex", gap: 12 }}>
      <div
        className="wizard-back"
        onClick={onBack}
        style={{ width: 130, height: 54, borderRadius: 12, border: "1.5px solid rgba(0,0,0,.18)", display: "flex", alignItems: "center", justifyContent: "center", font: "700 15px 'Hanken Grotesk'", cursor: "pointer" }}
      >
        ← Back
      </div>
      <div
        onClick={disabled || busy ? undefined : () => void onNext()}
        style={{
          flex: 1,
          height: 54,
          borderRadius: 12,
          background: disabled ? "rgba(0,0,0,.12)" : "var(--accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          font: "800 16px 'Archivo'",
          color: disabled ? "#8A8A90" : "#0E0E10",
          cursor: disabled ? "not-allowed" : busy ? "wait" : "pointer",
          opacity: busy ? 0.7 : 1,
        }}
      >
        {busy ? "Working…" : nextLabel}
      </div>
      <style>{`
        @media(max-width:480px){
          .wizard-footer{gap:8px!important}
          .wizard-footer>div{height:50px!important;font-size:14px!important}
          .wizard-back{width:92px!important}
        }
      `}</style>
    </div>
  );
}
