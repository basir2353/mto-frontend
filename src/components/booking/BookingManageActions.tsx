"use client";

import { useRef, useState } from "react";
import { TextInput, TextArea } from "@/components/FormControls";
import DatePicker from "@/components/DatePicker";
import TimeSelect, { parseClockTime } from "@/components/TimeSelect";
import { uploadsApi } from "@/lib/api";

function clockTo24h(value: string): string {
  const { hour, minute, period } = parseClockTime(value);
  let h24 = hour % 12;
  if (period === "PM") h24 += 12;
  return `${String(h24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

const DISPUTE_CATEGORIES = [
  { id: "damage", label: "Item damage", hint: "Furniture or goods were scratched, broken, or lost." },
  { id: "service", label: "Poor service", hint: "Late arrival, unprofessional behavior, or incomplete job." },
  { id: "billing", label: "Billing issue", hint: "Overcharge, wrong invoice, or payment not reflected." },
  { id: "safety", label: "Safety concern", hint: "Unsafe handling, property damage, or harassment." },
  { id: "other", label: "Other", hint: "Anything not covered above." },
];

type Props = {
  bookingId: string;
  status: string;
  canCancel?: boolean;
  canDispute?: boolean;
  canReschedule?: boolean;
  canShare?: boolean;
  onCancel: (reason: string) => Promise<void>;
  onDispute: (reason: string, evidenceUrls?: string[]) => Promise<void>;
  onReschedule: (date: string) => Promise<void>;
  onShare: (expiresInHours: number) => Promise<{ shareUrl?: string } | null>;
  onDone?: () => void;
};

export function BookingManageActions({
  bookingId,
  status,
  canCancel = true,
  canDispute = true,
  canReschedule = true,
  canShare = true,
  onCancel,
  onDispute,
  onReschedule,
  onShare,
  onDone,
}: Props) {
  const [mode, setMode] = useState<"none" | "cancel" | "dispute" | "reschedule" | "share">("none");
  const [reason, setReason] = useState("");
  const [disputeCategory, setDisputeCategory] = useState("damage");
  const [disputeDetails, setDisputeDetails] = useState("");
  const [disputePhotos, setDisputePhotos] = useState<Array<{ name: string; url: string }>>([]);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const evidenceInputRef = useRef<HTMLInputElement>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("9:00 AM");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareExpiry, setShareExpiry] = useState("72");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const active = !["cancelled", "completed"].includes(status);
  const categoryMeta = DISPUTE_CATEGORIES.find((c) => c.id === disputeCategory);

  if (!active && mode === "none" && !canDispute) return null;

  const run = async (fn: () => Promise<void>, successMsg?: string) => {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await fn();
      setMode("none");
      setReason("");
      setDisputeDetails("");
      setDisputeCategory("damage");
      setDisputePhotos([]);
      if (successMsg) setSuccess(successMsg);
      onDone?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const disputeMinChars = 20;
  const disputeReady = disputeDetails.trim().length >= disputeMinChars;

  const buildDisputeReason = () => {
    const cat = DISPUTE_CATEGORIES.find((c) => c.id === disputeCategory)?.label ?? "Issue";
    return `[${cat}] ${disputeDetails.trim()}`.trim();
  };

  const loadShare = async () => {
    setBusy(true);
    setError(null);
    try {
      const hours = Math.min(168, Math.max(1, Number(shareExpiry) || 72));
      const res = await onShare(hours);
      setShareUrl(res?.shareUrl ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not share");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ marginTop: 16, padding: "18px 20px", borderRadius: 14, border: "1.5px solid rgba(0,0,0,.1)", background: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <div>
          <div style={{ font: "800 16px 'Archivo'" }}>Manage this move</div>
          <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#6B6B70", marginTop: 4 }}>
            Booking {bookingId.slice(0, 8)}… · Status <b>{status.replace(/_/g, " ")}</b>
          </div>
        </div>
      </div>

      {success && (
        <div style={{ marginBottom: 12, padding: "12px 14px", borderRadius: 10, background: "#e7f5ea", color: "#1f6b1f", font: "600 13px 'Hanken Grotesk'" }}>
          {success}
        </div>
      )}

      {mode === "none" && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {canCancel && active && <ActionChip label="Cancel move" onClick={() => setMode("cancel")} tone="danger" hint="Free cancellation before pickup" />}
          {canDispute && <ActionChip label="Raise dispute" onClick={() => setMode("dispute")} tone="warn" hint="Report damage, billing, or service issues" />}
          {canReschedule && active && <ActionChip label="Reschedule" onClick={() => setMode("reschedule")} hint="Pick a new date & time" />}
          {canShare && active && (
            <ActionChip label="Share live tracking" onClick={() => { setMode("share"); void loadShare(); }} hint="Send link to family or friends" />
          )}
        </div>
      )}

      {mode === "cancel" && (
        <FormBlock title="Cancel this move" subtitle="Your mover will be notified immediately." onBack={() => setMode("none")}>
          <TextArea label="Why are you cancelling?" value={reason} onChange={setReason} placeholder="Changed plans, found another mover, duplicate booking…" minHeight={90} />
          <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#6B6B70" }}>
            Cancellations within 2 hours of pickup may affect your account standing.
          </div>
          <PrimaryBtn label="Confirm cancellation" busy={busy} busyLabel="Cancelling…" disabled={!reason.trim()} onClick={() => void run(() => onCancel(reason), "Move cancelled.")} tone="danger" />
        </FormBlock>
      )}

      {mode === "dispute" && (
        <FormBlock title="Raise a dispute" subtitle="Our team reviews every case within 24–48 hours." onBack={() => setMode("none")}>
          <div style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".06em", textTransform: "uppercase", color: "#8A8A90" }}>Issue category</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {DISPUTE_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setDisputeCategory(c.id)}
                style={{
                  height: 34,
                  padding: "0 12px",
                  borderRadius: 999,
                  border: disputeCategory === c.id ? "none" : "1.5px solid rgba(0,0,0,.14)",
                  background: disputeCategory === c.id ? "var(--accent)" : "#fff",
                  font: "700 12px 'Hanken Grotesk'",
                  cursor: "pointer",
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
          {categoryMeta && (
            <div style={{ padding: "10px 12px", borderRadius: 10, background: "#fafaf8", font: "500 13px 'Hanken Grotesk'", color: "#6B6B70" }}>
              {categoryMeta.hint}
            </div>
          )}
          <TextArea
            label="Describe what happened"
            value={disputeDetails}
            onChange={setDisputeDetails}
            placeholder="Include dates, item names, photos you uploaded, and what outcome you expect (refund, partial credit, apology)…"
            minHeight={120}
          />
          <div style={{ font: "600 12px 'Hanken Grotesk'", color: disputeReady ? "#1f6b1f" : "#8A8A90" }}>
            {disputeDetails.trim().length}/{disputeMinChars} characters minimum
            {!disputeReady && " — add a bit more detail before submitting"}
          </div>
          <div>
            <div style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".06em", textTransform: "uppercase", color: "#8A8A90", marginBottom: 8 }}>
              Evidence photos (optional)
            </div>
            <button
              type="button"
              onClick={() => evidenceInputRef.current?.click()}
              disabled={uploadingEvidence || busy}
              style={{
                height: 38,
                padding: "0 14px",
                borderRadius: 10,
                border: "1.5px solid rgba(0,0,0,.14)",
                background: "#fff",
                font: "700 13px 'Hanken Grotesk'",
                cursor: uploadingEvidence ? "wait" : "pointer",
              }}
            >
              {uploadingEvidence ? "Uploading…" : "+ Add photos"}
            </button>
            {disputePhotos.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                {disputePhotos.map((photo) => (
                  <img
                    key={photo.url}
                    src={photo.url}
                    alt={photo.name}
                    style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10, border: "1px solid rgba(0,0,0,.1)" }}
                  />
                ))}
              </div>
            )}
            <input
              ref={evidenceInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={(e) => {
                const files = [...(e.target.files ?? [])];
                if (!files.length) return;
                void (async () => {
                  setUploadingEvidence(true);
                  try {
                    for (const file of files) {
                      const uploaded = await uploadsApi.upload(file);
                      setDisputePhotos((prev) => [...prev, { name: file.name, url: uploaded.url }]);
                    }
                  } finally {
                    setUploadingEvidence(false);
                    e.target.value = "";
                  }
                })();
              }}
            />
          </div>
          <PrimaryBtn
            label="Submit dispute"
            busy={busy}
            busyLabel="Submitting…"
            disabled={!disputeReady}
            onClick={() =>
              void run(async () => {
                await onDispute(buildDisputeReason(), disputePhotos.map((p) => p.url));
              }, "Dispute submitted. We'll email you when reviewed.")
            }
            tone="warn"
          />
        </FormBlock>
      )}

      {mode === "reschedule" && (
        <FormBlock title="Reschedule move" subtitle="Your mover must confirm the new window." onBack={() => setMode("none")}>
          <DatePicker label="New date" value={newDate} onChange={setNewDate} inline />
          <TimeSelect label="Preferred time" value={newTime} onChange={setNewTime} height={52} />
          <PrimaryBtn
            label="Request new date"
            busy={busy}
            busyLabel="Saving…"
            disabled={!newDate.trim()}
            onClick={() => {
              const timePart = clockTo24h(newTime);
              void run(
                () => onReschedule(`${newDate.trim()}T${timePart}:00.000Z`),
                "Move rescheduled.",
              );
            }}
          />
        </FormBlock>
      )}

      {mode === "share" && (
        <FormBlock title="Share live tracking" subtitle="Anyone with the link can see mover location on the map." onBack={() => setMode("none")}>
          <TextInput label="Link expires in (hours)" value={shareExpiry} onChange={setShareExpiry} placeholder="72" />
          {shareUrl ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input readOnly value={shareUrl} style={{ width: "100%", height: 42, borderRadius: 10, border: "1.5px solid rgba(0,0,0,.14)", padding: "0 12px", font: "500 13px 'Hanken Grotesk'" }} />
              <div style={{ display: "flex", gap: 8 }}>
                <PrimaryBtn label="Copy link" onClick={() => void navigator.clipboard.writeText(shareUrl)} />
                <PrimaryBtn label="Regenerate" onClick={() => void loadShare()} />
              </div>
            </div>
          ) : (
            <div style={{ font: "600 14px 'Hanken Grotesk'", color: "#6B6B70" }}>{busy ? "Generating secure link…" : "No link yet"}</div>
          )}
        </FormBlock>
      )}

      {error && (
        <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10, background: "rgba(168,68,42,.08)", color: "#a8442a", font: "600 13px 'Hanken Grotesk'" }}>
          {error}
        </div>
      )}
    </div>
  );
}

function ActionChip({ label, onClick, tone = "neutral", hint }: { label: string; onClick: () => void; tone?: "neutral" | "danger" | "warn"; hint?: string }) {
  const bg = tone === "danger" ? "rgba(168,68,42,.1)" : tone === "warn" ? "#fff4df" : "#f0f0ec";
  const color = tone === "danger" ? "#a8442a" : tone === "warn" ? "#8a5a00" : "#0E0E10";
  return (
    <button type="button" onClick={onClick} title={hint} style={{ minHeight: 36, padding: "8px 14px", borderRadius: 12, border: "none", background: bg, color, font: "700 13px 'Hanken Grotesk'", cursor: "pointer", textAlign: "left" }}>
      {label}
      {hint && <div style={{ font: "500 11px 'Hanken Grotesk'", opacity: 0.75, marginTop: 2 }}>{hint}</div>}
    </button>
  );
}

function FormBlock({ title, subtitle, onBack, children }: { title: string; subtitle?: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <b style={{ font: "700 16px 'Hanken Grotesk'" }}>{title}</b>
          {subtitle && <div style={{ font: "500 13px 'Hanken Grotesk'", color: "#6B6B70", marginTop: 4 }}>{subtitle}</div>}
        </div>
        <button type="button" onClick={onBack} style={{ border: "none", background: "transparent", font: "700 13px 'Hanken Grotesk'", color: "#6B6B70", cursor: "pointer" }}>
          Back
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
    </div>
  );
}

function PrimaryBtn({
  label,
  onClick,
  disabled,
  busy,
  busyLabel,
  tone = "neutral",
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
  busyLabel?: string;
  tone?: "neutral" | "danger" | "warn";
}) {
  const bg = tone === "danger" ? "#a8442a" : tone === "warn" ? "#8a5a00" : "#0E0E10";
  const isDisabled = !!disabled || !!busy;
  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onClick}
      style={{
        height: 44,
        borderRadius: 10,
        border: "none",
        background: bg,
        color: "#fff",
        font: "800 14px 'Archivo'",
        cursor: busy ? "wait" : disabled ? "not-allowed" : "pointer",
        opacity: busy ? 0.9 : disabled ? 0.5 : 1,
      }}
    >
      {busy ? busyLabel ?? label : label}
    </button>
  );
}
