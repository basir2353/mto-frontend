"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DatePicker, { formatMoveDate } from "@/components/DatePicker";
import TimeSelect from "@/components/TimeSelect";
import RouteMap from "@/components/maps/RouteMap";
import { TextArea, FieldLabel } from "@/components/FormControls";
import { AppIcon } from "@/components/ui/Icons";
import { useForm, type Photo } from "@/contexts/MoveFormContext";
import { uploadsApi } from "@/lib/api";
import { useNearbyMovers } from "@/hooks/useNearbyMovers";
import { useRouteMetrics } from "@/hooks/useRouteMetrics";
import { estimateVehicleTripPrice } from "@/lib/vehicleVisuals";
import { RouteMetricsBadge, WizardFooter, WizardShell, stepHeading, stepSub } from "@/components/move/WizardChrome";

/** Normalize legacy size labels stored from older sessions. */
function displayVehicleName(name: string): string {
  const n = name.trim();
  if (!n) return "Vehicle TBD";
  if (/16\s*ft|26\s*ft/i.test(n) || /^box\s*truck$/i.test(n)) return "Box Truck";
  return n;
}

export function DetailsScreen({
  onNext,
  onBack,
  publishing,
  error,
}: {
  onNext: () => void | Promise<void>;
  onBack: () => void;
  publishing?: boolean;
  error?: string | null;
}) {
  const f = useForm();
  const [localError, setLocalError] = useState<string | null>(null);
  const bidTouched = useRef(false);
  const nearby = useNearbyMovers({
    pickup: f.pickupPlace,
    destination: f.destinationPlace,
    vehicleFilter: f.vehicleFilter,
    sortBy: "distance",
  });
  const route = useRouteMetrics(f.pickupPlace, f.destinationPlace);

  const selectedVehicle = useMemo(
    () =>
      nearby.vehicleTypes.find((v) => v.id === f.selectedVehicleId) ??
      nearby.vehicleTypes.find((v) => v.name === f.selectedVehicleName || v.name === f.vehicleFilter) ??
      null,
    [nearby.vehicleTypes, f.selectedVehicleId, f.selectedVehicleName, f.vehicleFilter],
  );

  const suggestedBid =
    estimateVehicleTripPrice(
      route.tripKm,
      selectedVehicle?.basePrice,
      selectedVehicle?.pricePerKm,
    ) ?? 0;

  useEffect(() => {
    if (bidTouched.current) return;
    if (suggestedBid < 1) return;
    f.setStartBid(suggestedBid);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-seed when route/vehicle estimate changes
  }, [suggestedBid]);

  const vehicleLabel = displayVehicleName(
    selectedVehicle?.name || f.selectedVehicleName || f.vehicleFilter || "",
  );

  const whenLabel =
    f.moveType === "now"
      ? "Pick now"
      : [formatMoveDate(f.moveDate) || "Date TBD", f.timeWindow].filter(Boolean).join(" · ");

  const itemsLabel =
    f.moveDescription.trim().slice(0, 42) ||
    vehicleLabel ||
    "Your move";

  const canContinue = f.moveDescription.trim().length >= 10;
  const startBid = f.startBid != null && f.startBid > 0 ? f.startBid : suggestedBid;

  const handleNext = async () => {
    if (!canContinue) {
      setLocalError("Describe your move in at least 10 characters.");
      return;
    }
    if (!Number.isFinite(startBid) || startBid < 1) {
      setLocalError("Enter a starting bid of at least $1.");
      return;
    }
    f.setStartBid(Math.round(startBid));
    setLocalError(null);
    await onNext();
  };

  return (
    <WizardShell
      mobileSheetSize="tall"
      left={
        <>
          <div style={{ flex: 1, overflow: "auto", padding: "26px 28px 18px" }}>
            <h2 style={stepHeading}>Move details</h2>
            <p style={stepSub}>Tell movers what you&apos;re moving so quotes are accurate.</p>

            {f.moveType === "scheduled" && (
              <div className="details-date-time" style={{ display: "flex", gap: 12, marginBottom: 22 }}>
                <DatePicker label="Date" value={f.moveDate} onChange={f.setMoveDate} placeholder="Select date" disablePast displayFormat="long" />
                <TimeSelect label="Time" value={f.timeWindow} onChange={f.setTimeWindow} />
              </div>
            )}

            <div style={{ marginBottom: 22 }}>
              <TextArea
                label="What are you moving?"
                value={f.moveDescription}
                onChange={f.setMoveDescription}
                placeholder="e.g. 8 boxes, 3-seat sofa, queen bed + frame, fridge, 55&quot; TV, 2 fragile boxes"
                minHeight={110}
              />
              <div style={{ marginTop: 6, font: "500 12px 'Hanken Grotesk'", color: "#8A8A90" }}>
                The more detail you give, the more accurate movers&apos; quotes will be.
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <FieldLabel>Photos (optional)</FieldLabel>
              <PhotoUpload photos={f.photos} onUpload={f.addPhoto} />
            </div>

            <MoveSummaryBox
              itemsLabel={itemsLabel}
              vehicleLabel={vehicleLabel}
              whenLabel={whenLabel}
              startBid={startBid}
              suggestedBid={suggestedBid}
              helpNeeded={f.helpNeeded}
              onHelpNeededChange={f.setHelpNeeded}
              onStartBidChange={(value) => {
                bidTouched.current = true;
                f.setStartBid(value);
              }}
              onResetBid={() => {
                bidTouched.current = false;
                f.setStartBid(suggestedBid);
              }}
            />
          </div>

          <div style={{ flex: "none", padding: "16px 28px 22px", borderTop: "1px solid rgba(0,0,0,.07)" }}>
            <WizardFooter
              onBack={onBack}
              onNext={handleNext}
              nextLabel="Publish request →"
              busy={publishing}
              notice={localError ?? error}
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
    />
  );
}

function MoveSummaryBox({
  itemsLabel,
  vehicleLabel,
  whenLabel,
  startBid,
  suggestedBid,
  helpNeeded,
  onHelpNeededChange,
  onStartBidChange,
  onResetBid,
}: {
  itemsLabel: string;
  vehicleLabel: string;
  whenLabel: string;
  startBid: number;
  suggestedBid: number;
  helpNeeded: boolean;
  onHelpNeededChange: (v: boolean) => void;
  onStartBidChange: (v: number) => void;
  onResetBid: () => void;
}) {
  return (
    <div
      style={{
        border: "1.5px solid rgba(0,0,0,.12)",
        borderRadius: 14,
        padding: "12px 14px",
        background: "#FAFAF8",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ font: "800 13px var(--font-archivo, Archivo)", color: "#0E0E10" }}>{vehicleLabel}</div>
          <div
            style={{
              marginTop: 2,
              font: "500 12px var(--font-hanken, 'Hanken Grotesk')",
              color: "#6B6B70",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={itemsLabel}
          >
            {itemsLabel}
          </div>
          <div style={{ marginTop: 4, font: "600 12px var(--font-hanken, 'Hanken Grotesk')", color: "#3a3a40" }}>
            {whenLabel}
          </div>
        </div>
        <div style={{ textAlign: "right", flex: "none" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2 }}>
            <span style={{ font: "800 18px var(--font-archivo, Archivo)", color: "#0E0E10" }}>$</span>
            <input
              type="number"
              min={1}
              step={1}
              value={Number.isFinite(startBid) ? startBid : ""}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (!Number.isFinite(n)) {
                  onStartBidChange(0);
                  return;
                }
                onStartBidChange(Math.max(0, Math.round(n)));
              }}
              aria-label="Starting bid"
              style={{
                width: 72,
                border: "1.5px solid rgba(0,0,0,.14)",
                borderRadius: 10,
                padding: "4px 8px",
                font: "800 18px var(--font-archivo, Archivo)",
                color: "#0E0E10",
                letterSpacing: "-.02em",
                textAlign: "right",
                background: "#fff",
                outline: "none",
              }}
            />
          </div>
          <div style={{ marginTop: 2, font: "500 11px var(--font-hanken, 'Hanken Grotesk')", color: "#8A8A90" }}>
            your start bid
          </div>
          {startBid !== suggestedBid ? (
            <button
              type="button"
              onClick={onResetBid}
              style={{
                marginTop: 4,
                border: "none",
                background: "transparent",
                padding: 0,
                font: "600 11px var(--font-hanken, 'Hanken Grotesk')",
                color: "#0E0E10",
                textDecoration: "underline",
                cursor: "pointer",
              }}
            >
              Reset to ${suggestedBid}
            </button>
          ) : null}
        </div>
      </div>

      <div
        style={{
          paddingTop: 10,
          borderTop: "1px solid rgba(0,0,0,.08)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div style={{ font: "600 12px var(--font-hanken, 'Hanken Grotesk')", color: "#6B6B70" }}>
          Help needed?
          <span style={{ color: "#8A8A90", fontWeight: 500 }}> · does not change your bid</span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <HelpOption
            label="No thanks"
            selected={!helpNeeded}
            onClick={() => onHelpNeededChange(false)}
          />
          <HelpOption
            label="Yes, I need help"
            selected={helpNeeded}
            onClick={() => onHelpNeededChange(true)}
          />
        </div>
      </div>
    </div>
  );
}

function HelpOption({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      style={{
        flex: "1 1 140px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 12,
        border: selected ? "2px solid #0E0E10" : "1.5px solid rgba(0,0,0,.12)",
        background: selected ? "#0E0E10" : "#fff",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 16,
          height: 16,
          borderRadius: 999,
          border: selected ? "5px solid var(--accent)" : "1.5px solid rgba(0,0,0,.25)",
          background: selected ? "#0E0E10" : "#fff",
          flex: "none",
          boxSizing: "border-box",
        }}
      />
      <span
        style={{
          font: "700 13px var(--font-hanken, 'Hanken Grotesk')",
          color: selected ? "#fff" : "#0E0E10",
        }}
      >
        {label}
      </span>
    </button>
  );
}

function PhotoUpload({ photos, onUpload }: { photos: Photo[]; onUpload: (photo: Photo) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const result = await uploadsApi.upload(file);
      onUpload({ name: file.name, url: result.url });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div
        className="photo-upload"
        onClick={() => !uploading && inputRef.current?.click()}
        title={error ?? undefined}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "16px 18px",
          borderRadius: 12,
          border: `1.5px dashed ${error ? "#a8442a" : "rgba(0,0,0,.22)"}`,
          cursor: uploading ? "wait" : "pointer",
        }}
      >
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "#F5F4EF", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
          <AppIcon name="camera" size={18} />
        </div>
        <div>
          <div style={{ font: "700 14px 'Hanken Grotesk'" }}>{uploading ? "Uploading…" : "Add photos of your items"}</div>
          <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8A8A90" }}>Helps movers quote accurately</div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </div>
      {photos.length > 0 && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
          {photos.map((p) => (
            <div key={p.url} style={{ width: 64, height: 64, borderRadius: 10, border: "1.5px solid rgba(0,0,0,.1)", overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ))}
        </div>
      )}
      <style>{`
        @media(max-width:480px){
          .details-date-time{flex-direction:column}
          .photo-upload{padding:14px!important;gap:10px!important}
          .photo-upload>div:nth-child(2){min-width:0}
        }
      `}</style>
    </div>
  );
}
