"use client";

import { useRef, useState } from "react";
import DatePicker from "@/components/DatePicker";
import TimeSelect from "@/components/TimeSelect";
import RouteMap from "@/components/maps/RouteMap";
import { TextArea, FieldLabel } from "@/components/FormControls";
import { AppIcon } from "@/components/ui/Icons";
import { useForm, type Photo } from "@/contexts/MoveFormContext";
import { uploadsApi } from "@/lib/api";
import { RouteMetricsBadge, WizardFooter, WizardShell, stepHeading, stepSub } from "@/components/move/WizardChrome";

export const ESTIMATED_LOAD_OPTIONS = ["A few items", "Half load", "Full load", "Multiple trips"];

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

  const canContinue = f.moveDescription.trim().length >= 10 && Boolean(f.estimatedLoad);

  const handleNext = async () => {
    if (!canContinue) {
      setLocalError(
        f.moveDescription.trim().length < 10
          ? "Describe your move in at least 10 characters."
          : "Select an estimated load.",
      );
      return;
    }
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

            <div className="details-date-time" style={{ display: "flex", gap: 12, marginBottom: 22 }}>
              <DatePicker label="Date" value={f.moveDate} onChange={f.setMoveDate} placeholder="Select date" />
              <TimeSelect label="Time" value={f.timeWindow} onChange={f.setTimeWindow} />
            </div>

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

            <div style={{ marginBottom: 22 }}>
              <FieldLabel>Estimated load</FieldLabel>
              <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
                {ESTIMATED_LOAD_OPTIONS.map((option) => {
                  const active = f.estimatedLoad === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => f.setEstimatedLoad(option)}
                      style={{
                        height: 42,
                        padding: "0 16px",
                        borderRadius: 999,
                        background: active ? "var(--accent)" : "#fff",
                        border: active ? "1.5px solid var(--accent)" : "1.5px solid rgba(0,0,0,.14)",
                        font: active ? "700 13px 'Hanken Grotesk'" : "600 13px 'Hanken Grotesk'",
                        color: "#0E0E10",
                        cursor: "pointer",
                      }}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <FieldLabel>Photos (optional)</FieldLabel>
              <PhotoUpload photos={f.photos} onUpload={f.addPhoto} />
            </div>

            {(localError || error) && (
              <div style={{ marginTop: 20, padding: "12px 14px", borderRadius: 10, background: "#fff0f0", color: "#b00020", font: "600 13px 'Hanken Grotesk'" }}>
                {localError ?? error}
              </div>
            )}
          </div>

          <div style={{ flex: "none", padding: "16px 28px 22px", borderTop: "1px solid rgba(0,0,0,.07)" }}>
            <WizardFooter onBack={onBack} onNext={handleNext} nextLabel="Publish request →" busy={publishing} />
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
