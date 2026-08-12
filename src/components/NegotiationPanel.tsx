"use client";

import { useEffect, useState } from "react";
import { HintBanner, StatusBadge } from "@/components/ui/AppUi";
import { priceDeltaLabel } from "@/lib/moveEstimate";
import type { Quote, QuoteCounteroffer } from "@/lib/api/types";

type Role = "customer" | "mover";

const PRICE_STEP = 10;

function adjustPrice(current: string, delta: number) {
  const base = Math.max(1, Math.round(Number(current) || 0) + delta);
  return String(base);
}

function CounterOfferForm({
  partnerLabel,
  price,
  notes,
  error,
  busy,
  referencePrice,
  estimatedPrice,
  onPriceChange,
  onNotesChange,
  onCancel,
  onSubmit,
}: {
  partnerLabel: string;
  price: string;
  notes: string;
  error: string | null;
  busy: boolean;
  referencePrice: number;
  estimatedPrice?: number | null;
  onPriceChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const numeric = Math.max(1, Math.round(Number(price) || 0));
  const estimateRef = estimatedPrice != null && estimatedPrice > 0 ? Math.round(estimatedPrice) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 4 }}>
      <div style={{ font: "600 12px 'Hanken Grotesk'", color: "#6B6B70" }}>
        Suggest a new price to {partnerLabel}
        {estimateRef != null ? (
          <span style={{ color: "#8A8A90" }}>
            {" "}
            · estimate ~${estimateRef} ({priceDeltaLabel(numeric, estimateRef)})
          </span>
        ) : (
          <span style={{ color: "#8A8A90" }}> · mover offered ${Math.round(referencePrice)}</span>
        )}
      </div>

      <div style={priceStepper}>
        <button
          type="button"
          onClick={() => onPriceChange(adjustPrice(price, -PRICE_STEP))}
          disabled={busy || numeric <= PRICE_STEP}
          style={{ ...stepBtn, borderRight: "1px solid rgba(0,0,0,.12)", opacity: busy || numeric <= PRICE_STEP ? 0.4 : 1 }}
          aria-label="Decrease price"
        >
          −
        </button>
        <label style={priceInputShell}>
          <span aria-hidden style={{ font: "700 15px 'Archivo'", color: "#8A8A90", lineHeight: 1 }}>$</span>
          <input
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={price}
            onChange={(e) => onPriceChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !busy && onSubmit()}
            autoFocus
            placeholder="0"
            aria-label="Counter offer amount"
            className="mto-price-input"
            style={priceInput}
          />
        </label>
        <button
          type="button"
          onClick={() => onPriceChange(adjustPrice(price, PRICE_STEP))}
          disabled={busy}
          style={{ ...stepBtn, borderLeft: "1px solid rgba(0,0,0,.12)" }}
          aria-label="Increase price"
        >
          +
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        {[
          { label: "−$25", delta: -25 },
          { label: "−$10", delta: -10 },
          { label: "+$10", delta: 10 },
          { label: "+$25", delta: 25 },
        ].map((chip) => (
          <button
            key={chip.label}
            type="button"
            disabled={busy}
            onClick={() => onPriceChange(adjustPrice(price, chip.delta))}
            style={chipBtn}
          >
            {chip.label}
          </button>
        ))}
        {estimateRef != null && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onPriceChange(String(estimateRef))}
            style={estimateLinkBtn}
          >
            Use estimate ${estimateRef}
          </button>
        )}
      </div>

      <textarea
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="Add a short note (optional)"
        rows={2}
        aria-label="Counter offer note"
        style={noteInput}
      />
      {error && (
        <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(168,68,42,.08)", border: "1px solid rgba(168,68,42,.25)", font: "600 13px 'Hanken Grotesk'", color: "#a8442a" }}>
          {error}
        </div>
      )}
      <div style={{ display: "flex", gap: 9 }}>
        <button type="button" onClick={onCancel} disabled={busy} style={cancelBtn}>
          Cancel
        </button>
        <button type="button" onClick={onSubmit} disabled={busy} style={{ ...submitBtn, background: busy ? "rgba(0,0,0,.12)" : "var(--accent)", cursor: busy ? "wait" : "pointer" }}>
          {busy ? "Sending…" : `Send $${numeric}`}
        </button>
      </div>
    </div>
  );
}

const priceStepper: React.CSSProperties = {
  display: "flex",
  alignItems: "stretch",
  height: 44,
  border: "1.5px solid rgba(0,0,0,.14)",
  borderRadius: 10,
  background: "#fff",
  overflow: "hidden",
};

const priceInputShell: React.CSSProperties = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 3,
  minWidth: 0,
  padding: "0 8px",
  margin: 0,
  cursor: "text",
};

const priceInput: React.CSSProperties = {
  width: "4.5ch",
  maxWidth: "100%",
  height: 28,
  border: "none",
  outline: "none",
  background: "transparent",
  font: "800 22px/1 'Archivo'",
  color: "#0E0E10",
  textAlign: "center",
  padding: 0,
  MozAppearance: "textfield",
};

const stepBtn: React.CSSProperties = {
  width: 44,
  border: "none",
  background: "#FAFAF8",
  font: "800 18px/1 'Archivo'",
  color: "#0E0E10",
  cursor: "pointer",
  flex: "none",
};

const chipBtn: React.CSSProperties = {
  height: 30,
  padding: "0 10px",
  borderRadius: 8,
  border: "1px solid rgba(0,0,0,.12)",
  background: "#fff",
  font: "600 12px 'Hanken Grotesk'",
  color: "#0E0E10",
  cursor: "pointer",
};

const estimateLinkBtn: React.CSSProperties = {
  height: 30,
  padding: "0 10px",
  borderRadius: 8,
  border: "none",
  background: "transparent",
  font: "700 12px 'Hanken Grotesk'",
  color: "#0E0E10",
  textDecoration: "underline",
  textUnderlineOffset: 2,
  cursor: "pointer",
};

const noteInput: React.CSSProperties = {
  width: "100%",
  border: "1.5px solid rgba(0,0,0,.14)",
  borderRadius: 10,
  padding: "10px 12px",
  font: "500 13px/1.4 'Hanken Grotesk'",
  color: "#0E0E10",
  outline: "none",
  resize: "none",
  background: "#fff",
  boxSizing: "border-box",
};

function TimelineRow({
  label,
  price,
  notes,
  isLatest,
  isYou,
}: {
  label: string;
  price: number;
  notes?: string | null;
  isLatest?: boolean;
  isYou?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        padding: "10px 12px",
        borderRadius: 10,
        background: isLatest ? "rgba(255,222,46,.14)" : "#FAFAF8",
        border: isLatest ? "1.5px solid var(--accent)" : "1px solid rgba(0,0,0,.06)",
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          marginTop: 6,
          flexShrink: 0,
          background: isYou ? "#0E0E10" : "#8A8A90",
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: "700 12px 'Hanken Grotesk'", color: isYou ? "#0E0E10" : "#6B6B70" }}>{label}</div>
        <div style={{ font: "900 20px 'Archivo'", marginTop: 2 }}>${Number(price).toFixed(0)}</div>
        {notes && <div style={{ font: "500 12px/1.4 'Hanken Grotesk'", color: "#6B6B70", marginTop: 4 }}>{notes}</div>}
      </div>
    </div>
  );
}

function offerLabel(role: Role, authorRole: string, partnerLabel: string) {
  if (authorRole === role) return "You";
  return partnerLabel;
}

export function NegotiationPanel({
  role,
  partnerLabel,
  quote,
  estimatedPrice,
  busy = false,
  embedded = false,
  onSendCounter,
  onAccept,
}: {
  role: Role;
  partnerLabel: string;
  quote: Quote | null;
  estimatedPrice?: number | null;
  busy?: boolean;
  embedded?: boolean;
  onSendCounter: (price: number, notes?: string) => Promise<boolean>;
  onAccept: () => void | Promise<void>;
}) {
  const [counterOpen, setCounterOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [counterPrice, setCounterPrice] = useState("");
  const [counterNotes, setCounterNotes] = useState("");
  const [counterError, setCounterError] = useState<string | null>(null);

  const counteroffers = quote?.counteroffers ?? [];
  const latestCounteroffer = counteroffers.length ? counteroffers[counteroffers.length - 1] : null;
  const opponentRole = role === "customer" ? "mover" : "customer";
  const priceAgreed = latestCounteroffer?.status === "accepted";
  const freshMoverQuote = role === "customer" && counteroffers.length === 0;
  const pendingOpponentOffer =
    latestCounteroffer?.authorRole === opponentRole && latestCounteroffer?.status === "pending";
  const yourTurn = freshMoverQuote || pendingOpponentOffer;
  const canAccept = freshMoverQuote || pendingOpponentOffer;
  const canBookAndTrack = priceAgreed && role === "customer";
  const suggestedPrice =
    pendingOpponentOffer && latestCounteroffer
      ? latestCounteroffer.price
      : quote?.price ?? 0;
  const acceptLabel = role === "customer" ? `Book for $${Number(quote?.price ?? 0).toFixed(0)}` : `Accept $${Number(quote?.price ?? 0).toFixed(0)}`;
  const bookAndTrackLabel = `Book & track · $${Number(quote?.price ?? 0).toFixed(0)}`;
  const estimateRef = estimatedPrice != null && estimatedPrice > 0 ? Math.round(Number(estimatedPrice)) : null;

  useEffect(() => {
    setCounterOpen(false);
    setCounterError(null);
  }, [quote?.id, latestCounteroffer?.id]);

  if (!quote) {
    return (
      <div style={{ ...panelShell, ...(embedded ? embeddedShell : null) }}>
        <div style={panelHeader}>Price & booking</div>
        <HintBanner variant="info">Select a mover quote to start negotiating the price.</HintBanner>
      </div>
    );
  }

  const openCounterForm = () => {
    const start =
      role === "customer" && estimateRef != null
        ? estimateRef
        : Math.round(Number(suggestedPrice));
    setCounterPrice(String(start));
    setCounterNotes("");
    setCounterError(null);
    setCounterOpen(true);
  };

  const submitCounter = async () => {
    const price = Number(counterPrice);
    if (!Number.isFinite(price) || price <= 0) {
      setCounterError("Please enter a valid amount");
      return;
    }
    setCounterError(null);
    const ok = await onSendCounter(price, counterNotes.trim() || undefined);
    if (ok) {
      setCounterOpen(false);
      setCounterNotes("");
    } else {
      setCounterError("Could not send your offer. Try again.");
    }
  };

  const timeline: Array<{ key: string; label: string; price: number; notes?: string | null; isYou: boolean }> = [];
  if (counteroffers.length === 0) {
    timeline.push({
      key: "initial",
      label: role === "customer" ? `${partnerLabel}'s quote` : "Your starting quote",
      price: quote.price,
      notes: quote.notes,
      isYou: role === "mover",
    });
  } else {
    counteroffers.forEach((c: QuoteCounteroffer) => {
      timeline.push({
        key: c.id,
        label: `${offerLabel(role, c.authorRole, partnerLabel)} offered`,
        price: c.price,
        notes: c.notes,
        isYou: c.authorRole === role,
      });
    });
  }

  const visibleTimeline = showHistory || timeline.length <= 2 ? timeline : [timeline[timeline.length - 1]];
  const hiddenCount = timeline.length - visibleTimeline.length;

  return (
    <div style={{ ...panelShell, ...(embedded ? embeddedShell : null) }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <div>
          <div style={panelHeader}>Price & booking</div>
          <div style={{ font: "500 13px 'Hanken Grotesk'", color: "#6B6B70" }}>Agree on a price with {partnerLabel}</div>
        </div>
        <StatusBadge
          label={priceAgreed ? "Price agreed" : yourTurn ? "Your turn" : "Waiting"}
          tone={priceAgreed ? "success" : yourTurn ? "accent" : "waiting"}
        />
      </div>

      {estimateRef != null && role === "customer" && (
        <div style={{ marginBottom: 12, padding: "10px 14px", borderRadius: 12, background: "#FAFAF8", border: "1px solid rgba(0,0,0,.08)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <div style={{ font: "700 11px 'Hanken Grotesk'", color: "#8A8A90", textTransform: "uppercase", letterSpacing: ".06em" }}>Your estimate when posted</div>
            <div style={{ font: "800 18px 'Archivo'", marginTop: 2 }}>~${estimateRef}</div>
          </div>
          <div style={{ font: "600 12px 'Hanken Grotesk'", color: "#6B6B70", textAlign: "right" }}>
            {priceDeltaLabel(Number(quote.price), estimateRef)}
          </div>
        </div>
      )}

      {estimateRef != null && role === "mover" && (
        <div style={{ marginBottom: 12, padding: "10px 14px", borderRadius: 12, background: "rgba(255,222,46,.14)", border: "1px solid rgba(255,222,46,.35)" }}>
          <div style={{ font: "700 11px 'Hanken Grotesk'", color: "#6b5a00", textTransform: "uppercase", letterSpacing: ".06em" }}>Customer budget estimate</div>
          <div style={{ font: "800 18px 'Archivo'", marginTop: 2 }}>~${estimateRef}</div>
        </div>
      )}

      <div
        style={{
          background: "#0E0E10",
          color: "#fff",
          borderRadius: 14,
          padding: "16px 18px",
          marginBottom: 14,
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <div style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(255,255,255,.5)", marginBottom: 4 }}>
            Current offer
          </div>
          <div style={{ font: "900 36px 'Archivo'", lineHeight: 1 }}>${Number(quote.price).toFixed(0)}</div>
        </div>
        {!yourTurn && (
          <div style={{ font: "600 12px 'Hanken Grotesk'", color: "rgba(255,255,255,.55)", textAlign: "right", maxWidth: 140 }}>
            {partnerLabel} will respond soon
          </div>
        )}
      </div>

      {timeline.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".09em", textTransform: "uppercase", color: "#8A8A90", marginBottom: 8 }}>
            Offer history
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {visibleTimeline.map((row) => (
              <TimelineRow
                key={row.key}
                label={row.label}
                price={row.price}
                notes={row.notes}
                isYou={row.isYou}
                isLatest={row.key === timeline[timeline.length - 1].key}
              />
            ))}
          </div>
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              style={{ marginTop: 8, background: "none", border: "none", padding: 0, font: "700 12px 'Hanken Grotesk'", color: "#0E0E10", textDecoration: "underline", cursor: "pointer" }}
            >
              {showHistory ? "Hide earlier offers" : `Show ${hiddenCount} earlier offer${hiddenCount > 1 ? "s" : ""}`}
            </button>
          )}
        </div>
      )}

      {counterOpen ? (
        <CounterOfferForm
          partnerLabel={partnerLabel}
          price={counterPrice}
          notes={counterNotes}
          error={counterError}
          busy={busy}
          referencePrice={Number(quote.price)}
          estimatedPrice={estimateRef}
          onPriceChange={setCounterPrice}
          onNotesChange={setCounterNotes}
          onCancel={() => {
            setCounterOpen(false);
            setCounterError(null);
          }}
          onSubmit={() => void submitCounter()}
        />
      ) : (
        <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
          {yourTurn && (
            <button type="button" onClick={openCounterForm} disabled={busy} style={outlineBtn}>
              {role === "customer" ? "Change price" : "Counter offer"}
            </button>
          )}
          {canAccept && (
            <button type="button" onClick={() => void onAccept()} disabled={busy} style={submitBtn}>
              {acceptLabel}
            </button>
          )}
          {canBookAndTrack && (
            <button type="button" onClick={() => void onAccept()} disabled={busy} style={submitBtn}>
              {busy ? "Booking…" : bookAndTrackLabel}
            </button>
          )}
          {!yourTurn && !canAccept && !priceAgreed && (
            <HintBanner variant="waiting">
              Offer sent — we&apos;ll notify you when {partnerLabel} responds.
            </HintBanner>
          )}
          {priceAgreed && role === "mover" && (
            <HintBanner variant="info">
              {`Price agreed at $${Number(quote.price).toFixed(0)} — waiting for ${partnerLabel} to book.`}
            </HintBanner>
          )}
        </div>
      )}
    </div>
  );
}

const panelShell: React.CSSProperties = {
  flex: "none",
  margin: "0 26px 16px",
  padding: "16px 18px",
  background: "#fff",
  border: "1.5px solid rgba(0,0,0,.1)",
  borderRadius: 16,
  boxShadow: "0 4px 16px rgba(0,0,0,.04)",
};

const embeddedShell: React.CSSProperties = {
  margin: 0,
  border: "none",
  borderRadius: 0,
  boxShadow: "none",
  padding: "16px 18px",
};

const panelHeader: React.CSSProperties = {
  font: "800 16px 'Archivo'",
  letterSpacing: "-.01em",
  marginBottom: 2,
};

const outlineBtn: React.CSSProperties = {
  flex: 1,
  minWidth: 140,
  height: 44,
  borderRadius: 10,
  border: "1.5px solid rgba(0,0,0,.18)",
  background: "#fff",
  font: "700 14px 'Hanken Grotesk'",
  color: "#0E0E10",
  cursor: "pointer",
};

const submitBtn: React.CSSProperties = {
  flex: 1,
  minWidth: 140,
  height: 44,
  borderRadius: 10,
  border: "none",
  background: "var(--accent)",
  font: "800 14px 'Archivo'",
  color: "#0E0E10",
  cursor: "pointer",
};

const cancelBtn: React.CSSProperties = {
  flex: 1,
  height: 44,
  borderRadius: 10,
  border: "1.5px solid rgba(0,0,0,.18)",
  background: "#fff",
  font: "700 14px 'Hanken Grotesk'",
  color: "#0E0E10",
  cursor: "pointer",
};
