"use client";

import { useState } from "react";
import {
  DRIVER_JOB_STEPS,
  driverStageAction,
  driverStageHeadline,
  resolveDriverJobStage,
  stepIndexForStage,
} from "@/lib/driverJobFlow";
import type { Booking } from "@/lib/api/types";
import { isBookingJobPaid } from "@/lib/bookingFlow";
import { DriverAlert, DriverPrimaryButton } from "@/components/driver/DriverDashboardShell";
import responsive from "./DriverResponsive.module.css";

export function DriverJobProgress({
  booking,
  busy,
  onStart,
  onAdvance,
  onOpenProof,
  onNavigate,
  onConfirmCash,
  currentStopLabel,
  currentStopAddress,
  proofCount,
  compact = false,
}: {
  booking: Booking;
  busy?: boolean;
  onStart: () => void;
  onAdvance: (action: { trackingStatus: string; note: string }) => void;
  onOpenProof: () => void;
  onNavigate?: () => void;
  onConfirmCash?: () => Promise<void> | void;
  currentStopLabel?: string;
  currentStopAddress?: string;
  proofCount: number;
  compact?: boolean;
}) {
  const stage = resolveDriverJobStage(booking);
  const currentIdx = stepIndexForStage(stage);
  const action = driverStageAction(stage);
  const paid = isBookingJobPaid(booking);
  const isCashJob = (booking.paymentMethod ?? "cash_on_site") === "cash_on_site";
  const [confirmingCash, setConfirmingCash] = useState(false);
  const [cashError, setCashError] = useState<string | null>(null);

  if (stage === "completed" || booking.status === "completed") {
    if (isCashJob && !paid && onConfirmCash) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(255,222,46,.2)", font: "700 14px 'Hanken Grotesk'" }}>
            Job completed · collect ${Number(booking.price).toFixed(0)} cash
          </div>
          {cashError && (
            <DriverAlert variant="warn" inline>
              {cashError}
            </DriverAlert>
          )}
          <DriverPrimaryButton
            variant="accent"
            fullWidth
            disabled={busy || confirmingCash}
            onClick={async () => {
              setConfirmingCash(true);
              setCashError(null);
              try {
                await onConfirmCash();
              } catch (e) {
                setCashError(e instanceof Error ? e.message : "Could not confirm cash");
              } finally {
                setConfirmingCash(false);
              }
            }}
          >
            {confirmingCash ? "Confirming…" : "I received the cash →"}
          </DriverPrimaryButton>
        </div>
      );
    }

    return (
      <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(31,107,31,.1)", color: "#1f6b1f", font: "700 14px 'Hanken Grotesk'" }}>
        {paid
          ? isCashJob
            ? "Job completed · cash confirmed"
            : "Job completed · wallet payment received"
          : "Job completed · waiting for customer wallet payment"}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: compact ? 10 : 14 }}>
      {!compact && (
        <div style={{ padding: "15px 16px", borderRadius: 14, background: "#0E0E10", color: "#fff" }}>
          <div style={{ font: "700 10px 'Hanken Grotesk'", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 6 }}>
            Current task · {currentStopLabel ?? "Next stop"}
          </div>
          <div style={{ font: "800 18px 'Archivo'", marginBottom: currentStopAddress ? 5 : 0 }}>{driverStageHeadline(stage)}</div>
          {currentStopAddress && (
            <div style={{ font: "500 13px/1.4 'Hanken Grotesk'", color: "rgba(255,255,255,.72)" }}>{currentStopAddress}</div>
          )}
        </div>
      )}

      {!compact && onNavigate && (
        <DriverPrimaryButton variant="ghost" fullWidth onClick={onNavigate}>
          Open navigation ↗
        </DriverPrimaryButton>
      )}

      {stage === "awaiting_start" && booking.status === "confirmed" && (
        <DriverPrimaryButton variant="accent" fullWidth disabled={busy} onClick={onStart}>
          {busy ? "Starting…" : "Start job & drive to pickup"}
        </DriverPrimaryButton>
      )}

      {action && stage !== "awaiting_start" && (
        <DriverPrimaryButton
          variant="accent"
          fullWidth
          disabled={busy}
          onClick={() => onAdvance({ trackingStatus: action.trackingStatus, note: action.note })}
        >
          {busy ? "Updating…" : action.label}
        </DriverPrimaryButton>
      )}

      <div>
        {!compact && (
          <>
            <div style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".08em", textTransform: "uppercase", color: "#8A8A90", marginBottom: 8 }}>
              Job progress
            </div>
            <div style={{ font: "800 16px 'Archivo'", marginBottom: 4 }}>{driverStageHeadline(stage)}</div>
          </>
        )}
        {compact && (
          <div style={{ font: "800 14px 'Archivo'", marginBottom: 8 }}>{driverStageHeadline(stage)}</div>
        )}
        <div className={responsive.progressSteps}>
          {DRIVER_JOB_STEPS.map((step, i) => {
            const done = currentIdx > i;
            const active = currentIdx === i || (stage === "awaiting_start" && i === 0);
            return (
              <div
                key={step.key}
                style={{
                  textAlign: "center",
                  padding: compact ? "6px 4px" : "8px 6px",
                  borderRadius: 8,
                  background: done ? "#0E0E10" : active ? "var(--accent)" : "rgba(0,0,0,.06)",
                  color: done || active ? (done ? "#fff" : "#0E0E10") : "#8A8A90",
                  font: done || active ? "800 11px 'Archivo'" : "700 11px 'Hanken Grotesk'",
                  letterSpacing: ".02em",
                }}
              >
                {step.label}
              </div>
            );
          })}
        </div>
      </div>

      {(stage === "arrived_dropoff" || stage === "proof_required" || stage === "ready_to_complete") && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {proofCount === 0 && (
            <DriverAlert variant="warn" inline>
              Upload at least one delivery proof photo before you can complete the job.
            </DriverAlert>
          )}
          <DriverPrimaryButton variant="ghost" fullWidth disabled={busy} onClick={onOpenProof}>
            {proofCount ? `View / add proof (${proofCount})` : "+ Upload delivery proof"}
          </DriverPrimaryButton>
        </div>
      )}
    </div>
  );
}

export function driverJobStageLabel(booking: Booking): string | undefined {
  const stage = resolveDriverJobStage(booking);
  if (stage === "awaiting_start") return "Ready";
  if (stage === "completed") return "Done";
  return driverStageHeadline(stage).split("—")[0].trim();
}
