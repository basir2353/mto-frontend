"use client";

import { useState } from "react";
import RouteMap from "@/components/maps/RouteMap";
import { formatMoveDate } from "@/components/DatePicker";
import { MoverAvatar } from "@/components/ui/AppUi";
import { moverDisplayName } from "@/components/move/JobPanels";
import { useForm } from "@/contexts/MoveFormContext";
import type { PaymentMethod, Quote } from "@/lib/api";
import { formatDurationLabel, parseQuoteArrivalLabel } from "@/lib/quoteTiming";
import { ReviewCard, RouteMetricsBadge, WizardFooter, WizardShell, stepHeading, stepSub } from "@/components/move/WizardChrome";

export function BookScreen({
  quote,
  onBack,
  onConfirm,
  busy,
  error,
}: {
  quote: Quote;
  onBack: () => void;
  onConfirm: (paymentMethod: PaymentMethod) => void | Promise<void>;
  busy?: boolean;
  error?: string | null;
}) {
  const f = useForm();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash_on_site");
  const moverLabel = moverDisplayName(quote.mover);
  const arrival = parseQuoteArrivalLabel(quote.notes);
  const duration = formatDurationLabel(quote.estimatedHours != null ? Number(quote.estimatedHours) : null);
  const moveFee = Number(quote.price);
  const total = moveFee;

  const timingLabel =
    f.moveType === "now" ? "Move Now" : `${formatMoveDate(f.moveDate) || "Date TBD"} · ${f.timeWindow}`;

  return (
    <WizardShell
      mobileSheetSize="tall"
      left={
        <>
          <div style={{ flex: 1, overflow: "auto", padding: "26px 28px 18px" }}>
            <h2 style={stepHeading}>Confirm &amp; book</h2>
            <p style={stepSub}>Review your move before booking {moverLabel}.</p>

            <div className="book-mover-card" style={{ background: "#0E0E10", color: "#fff", borderRadius: 14, padding: 16, marginBottom: 18, display: "flex", alignItems: "center", gap: 12 }}>
              <MoverAvatar name={moverLabel} imageUrl={quote.mover?.moverProfile?.avatarUrl} size={44} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <b style={{ font: "800 15px 'Archivo'" }}>{moverLabel}</b>
                <div style={{ font: "500 12px 'Hanken Grotesk'", color: "rgba(255,255,255,.6)" }}>
                  {f.selectedVehicleName || "Vehicle TBD"}
                  {[arrival ? `Can start at ${arrival}` : null, duration ? `Estimated ${duration}` : null].filter(Boolean).join(" · ")}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ font: "600 10px 'Hanken Grotesk'", letterSpacing: ".06em", textTransform: "uppercase", color: "var(--accent)" }}>Agreed</div>
                <b style={{ font: "900 18px 'Archivo'" }}>${moveFee.toFixed(0)}</b>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
              <ReviewCard label="Route" value={`${f.pickup || "Pickup"} → ${f.destination || "Destination"}`} />
              <ReviewCard label="Date & time" value={timingLabel} />
              <ReviewCard label="Items" value={f.moveDescription.trim().slice(0, 60) + (f.moveDescription.length > 60 ? "…" : "") || "No description"} />
              <ReviewCard label="Load" value={f.estimatedLoad || "Not specified"} />
            </div>

            <div style={{ border: "1.5px solid rgba(0,0,0,.1)", borderRadius: 12, padding: 16, marginBottom: 18 }}>
              <FeeRow label="Move fee (agreed)" value={moveFee} />
              <div style={{ height: 1, background: "rgba(0,0,0,.08)", margin: "10px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <b style={{ font: "700 15px 'Hanken Grotesk'" }}>Total</b>
                <b style={{ font: "900 20px 'Archivo'" }}>${total.toFixed(0)}</b>
              </div>
            </div>

            <div>
              <div style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".08em", textTransform: "uppercase", color: "#8A8A90", marginBottom: 8 }}>
                Payment method
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <PaymentOption
                  selected={paymentMethod === "cash_on_site"}
                  title="Cash on site"
                  subtitle="Pay the mover in cash after delivery. They confirm receipt in the app."
                  onSelect={() => setPaymentMethod("cash_on_site")}
                />
                <PaymentOption
                  selected={paymentMethod === "wallet"}
                  title="Wallet"
                  subtitle="Pay from your MoveThisOut wallet after the move completes."
                  onSelect={() => setPaymentMethod("wallet")}
                />
              </div>
            </div>
          </div>

          <div style={{ flex: "none", padding: "16px 28px 22px", borderTop: "1px solid rgba(0,0,0,.07)" }}>
            <WizardFooter
              onBack={onBack}
              onNext={() => void onConfirm(paymentMethod)}
              nextLabel={
                paymentMethod === "wallet"
                  ? `Book with wallet $${total.toFixed(0)} →`
                  : `Book cash on site $${total.toFixed(0)} →`
              }
              busy={busy}
              notice={error}
            />
          </div>
        </>
      }
      right={
        <>
          <RouteMap pickup={f.pickupPlace} destination={f.destinationPlace} showRoute />
          <RouteMetricsBadge pickup={f.pickupPlace} destination={f.destinationPlace} />
        </>
      }
    >
      <style>{`
        @media(max-width:480px){
          .book-mover-card{align-items:flex-start!important}
          .book-mover-card>div:last-child{flex:none}
        }
      `}</style>
    </WizardShell>
  );
}

function PaymentOption({
  selected,
  title,
  subtitle,
  onSelect,
}: {
  selected: boolean;
  title: string;
  subtitle: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "14px 16px",
        borderRadius: 12,
        border: selected ? "1.5px solid #0E0E10" : "1.5px solid rgba(0,0,0,.12)",
        background: selected ? "rgba(255,222,46,.18)" : "#fff",
        textAlign: "left",
        cursor: "pointer",
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          marginTop: 2,
          borderRadius: "50%",
          border: selected ? "5px solid #0E0E10" : "1.5px solid rgba(0,0,0,.25)",
          flex: "none",
        }}
      />
      <span>
        <span style={{ display: "block", font: "700 14px 'Hanken Grotesk'", marginBottom: 2 }}>{title}</span>
        <span style={{ display: "block", font: "500 12px/1.4 'Hanken Grotesk'", color: "#6B6B70" }}>{subtitle}</span>
      </span>
    </button>
  );
}

function FeeRow({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", font: "500 14px 'Hanken Grotesk'", marginBottom: 8 }}>
      <span style={{ color: "#6B6B70" }}>{label}</span>
      <span>${value.toFixed(0)}</span>
    </div>
  );
}
