"use client";

import { useEffect, useRef, useState } from "react";
import RouteMap from "@/components/maps/RouteMap";
import { NegotiationPanel } from "@/components/NegotiationPanel";
import { MoverAvatar, StatusBadge } from "@/components/ui/AppUi";
import { MessagePanel, moverDisplayName } from "@/components/move/JobPanels";
import { MoveSheet } from "@/components/move/MoveSheet";
import { quoteNegotiationMeta } from "@/lib/negotiation";
import { formatDurationLabel, parseQuoteArrivalLabel } from "@/lib/quoteTiming";
import { useForm } from "@/contexts/MoveFormContext";
import { useMoveFlow } from "@/contexts/MoveFlowContext";
import type { MovingRequest, Quote } from "@/lib/api";
import { MapPill, RouteMetricsBadge, WizardShell, stepHeading, stepSub } from "@/components/move/WizardChrome";
import styles from "./QuotesScreen.module.css";

const SEARCH_TIMEOUT_MS = 2 * 60 * 1000;

export function QuotesScreen({
  request,
  quotes,
  selectedQuoteId,
  onSelectQuote,
  onBook,
  onSendCounter,
  counterBusy,
  myUserId,
  onCancelRequest,
  onStartNew,
}: {
  request: MovingRequest | null;
  quotes: Quote[];
  selectedQuoteId: string | null;
  onSelectQuote: (id: string) => void;
  onBook: () => void;
  onSendCounter: (price: number, notes?: string) => Promise<boolean>;
  counterBusy: boolean;
  myUserId: string;
  onCancelRequest?: () => Promise<void> | void;
  onStartNew?: () => void;
}) {
  const f = useForm();
  const flow = useMoveFlow();
  const [sheet, setSheet] = useState<"chat" | "negotiate" | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [keepWaiting, setKeepWaiting] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    startedAt.current = Date.now();
    setTimedOut(false);
    setKeepWaiting(false);
  }, [request?.id]);

  useEffect(() => {
    if (!request?.id) return;
    if (quotes.length > 0) return;
    if (timedOut && !keepWaiting) return;
    const poll = () => flow.refreshRequest(request.id);
    poll();
    const t = setInterval(poll, 8000);
    return () => clearInterval(t);
  }, [request?.id, quotes.length, timedOut, keepWaiting, flow]);

  useEffect(() => {
    if (!request?.id || quotes.length > 0 || keepWaiting) return;
    const remaining = SEARCH_TIMEOUT_MS - (Date.now() - startedAt.current);
    const t = setTimeout(() => setTimedOut(true), Math.max(0, remaining));
    return () => clearTimeout(t);
  }, [request?.id, quotes.length, keepWaiting]);

  useEffect(() => {
    if (!quotes.length) return;
    if (!selectedQuoteId || !quotes.some((q) => q.id === selectedQuoteId)) {
      const preferred =
        quotes.find((q) => quoteNegotiationMeta(q).yourTurn) ??
        quotes.find((q) => quoteNegotiationMeta(q).negotiating) ??
        quotes[0];
      onSelectQuote(preferred.id);
    }
  }, [quotes, selectedQuoteId, onSelectQuote]);

  const activeQuote = quotes.find((q) => q.id === selectedQuoteId) ?? quotes[0] ?? null;
  const moverLabel = activeQuote ? moverDisplayName(activeQuote.mover) : "Mover";

  const handleCancel = async () => {
    if (!onCancelRequest || cancelBusy) return;
    setCancelBusy(true);
    try {
      await onCancelRequest();
    } finally {
      setCancelBusy(false);
    }
  };

  return (
    <WizardShell
      mobileSheetSize="tall"
      left={
        <div style={{ flex: 1, overflow: "auto", padding: "26px 28px 22px", display: "flex", flexDirection: "column" }}>
          {quotes.length === 0 ? (
            <FindingMovers
              timedOut={timedOut && !keepWaiting}
              cancelBusy={cancelBusy}
              canCancel={!!onCancelRequest}
              onKeepWaiting={() => {
                setKeepWaiting(true);
                setTimedOut(false);
                startedAt.current = Date.now();
              }}
              onCancel={() => void handleCancel()}
              onStartNew={onStartNew}
            />
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                <div>
                  <h2 style={stepHeading}>Compare quotes</h2>
                  <p style={stepSub}>{quotes.length} received</p>
                </div>
                {onCancelRequest ? (
                  <button
                    type="button"
                    onClick={() => void handleCancel()}
                    disabled={cancelBusy}
                    style={{
                      height: 40,
                      padding: "0 14px",
                      borderRadius: 10,
                      border: "1.5px solid rgba(0,0,0,.14)",
                      background: "#fff",
                      font: "700 13px 'Hanken Grotesk'",
                      cursor: cancelBusy ? "wait" : "pointer",
                      flex: "none",
                    }}
                  >
                    {cancelBusy ? "Cancelling…" : "Cancel move"}
                  </button>
                ) : null}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                {quotes.map((q) => (
                  <QuoteCard key={q.id} quote={q} selected={q.id === activeQuote?.id} onSelect={() => onSelectQuote(q.id)} />
                ))}
              </div>

              {activeQuote && (
                <div style={{ display: "flex", gap: 10, marginBottom: "auto" }}>
                  <button
                    type="button"
                    onClick={() => setSheet("chat")}
                    style={{ flex: 1, height: 48, borderRadius: 12, border: "1.5px solid rgba(0,0,0,.14)", background: "#fff", font: "700 14px 'Hanken Grotesk'", cursor: "pointer" }}
                  >
                    Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => setSheet("negotiate")}
                    style={{ flex: 1, height: 48, borderRadius: 12, border: "1.5px solid rgba(0,0,0,.14)", background: "#fff", font: "700 14px 'Hanken Grotesk'", cursor: "pointer" }}
                  >
                    Negotiate
                  </button>
                </div>
              )}

              <div style={{ paddingTop: 20 }}>
                <div
                  onClick={activeQuote ? onBook : undefined}
                  style={{
                    height: 58,
                    borderRadius: 12,
                    background: activeQuote ? "var(--accent)" : "rgba(0,0,0,.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    font: "800 17px 'Archivo'",
                    color: activeQuote ? "#0E0E10" : "#8A8A90",
                    cursor: activeQuote ? "pointer" : "not-allowed",
                  }}
                >
                  {activeQuote ? `Book $${Number(activeQuote.price).toFixed(0)} →` : "Book →"}
                </div>
              </div>
            </>
          )}
        </div>
      }
      right={
        <>
          <RouteMap pickup={f.pickupPlace} destination={f.destinationPlace} showRoute />
          <RouteMetricsBadge pickup={f.pickupPlace} destination={f.destinationPlace} />
          <MapPill>
            {quotes.length > 0 ? `${quotes.length} movers viewing` : "Movers reviewing your job"} · <b style={{ color: "var(--accent)" }}>live map</b>
          </MapPill>
        </>
      }
    >
      <MoveSheet title="Messages" open={sheet === "chat"} onClose={() => setSheet(null)}>
        <MessagePanel
          bookingId={null}
          partnerName={moverLabel}
          myUserId={myUserId}
          disabled
          disabledHint="Book this mover to unlock chat, or negotiate price first."
          fillHeight
        />
      </MoveSheet>

      <MoveSheet title="Negotiate price" open={sheet === "negotiate"} onClose={() => setSheet(null)}>
        {activeQuote && request ? (
          <NegotiationPanel
            role="customer"
            partnerLabel={moverLabel}
            quote={activeQuote}
            estimatedPrice={request.estimatedPrice != null ? Number(request.estimatedPrice) : null}
            busy={counterBusy}
            onSendCounter={onSendCounter}
            onAccept={onBook}
          />
        ) : null}
      </MoveSheet>
    </WizardShell>
  );
}

function FindingMovers({
  timedOut,
  cancelBusy,
  canCancel,
  onKeepWaiting,
  onCancel,
  onStartNew,
}: {
  timedOut: boolean;
  cancelBusy: boolean;
  canCancel: boolean;
  onKeepWaiting: () => void;
  onCancel: () => void;
  onStartNew?: () => void;
}) {
  if (timedOut) {
    return (
      <div className={styles.finding}>
        <h2 style={{ ...stepHeading, marginBottom: 6 }}>No movers yet</h2>
        <p style={{ ...stepSub, marginBottom: 20 }}>
          Nearby movers were notified, but no quotes arrived in the last 2 minutes. Keep waiting or cancel this request.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            type="button"
            onClick={onKeepWaiting}
            style={{ height: 50, borderRadius: 12, border: 0, background: "var(--accent)", font: "800 15px 'Archivo'", cursor: "pointer" }}
          >
            Keep waiting
          </button>
          {canCancel ? (
            <button
              type="button"
              onClick={onCancel}
              disabled={cancelBusy}
              style={{
                height: 50,
                borderRadius: 12,
                border: "1.5px solid rgba(0,0,0,.14)",
                background: "#fff",
                font: "700 14px 'Hanken Grotesk'",
                cursor: cancelBusy ? "wait" : "pointer",
              }}
            >
              {cancelBusy ? "Cancelling…" : "Cancel this move"}
            </button>
          ) : null}
          {onStartNew ? (
            <button
              type="button"
              onClick={onStartNew}
              style={{
                height: 44,
                border: 0,
                background: "transparent",
                font: "700 13px 'Hanken Grotesk'",
                color: "#6B6B70",
                textDecoration: "underline",
                cursor: "pointer",
              }}
            >
              Start a new move instead
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.finding}>
      <div className={styles.radar} aria-hidden="true">
        <span className={`${styles.ring} ${styles.ringOne}`} />
        <span className={`${styles.ring} ${styles.ringTwo}`} />
        <span className={`${styles.ring} ${styles.ringThree}`} />
        <span className={styles.brandMark}>M</span>
        <span className={`${styles.mover} ${styles.moverOne}`}>🚚</span>
        <span className={`${styles.mover} ${styles.moverTwo}`}>🚚</span>
        <span className={`${styles.mover} ${styles.moverThree}`}>🚚</span>
        <span className={styles.livePill}>
          <span className={styles.liveDot} />
          Searching live
        </span>
      </div>

      <h2 style={{ ...stepHeading, marginBottom: 6 }}>Finding your movers…</h2>
      <p style={{ ...stepSub, marginBottom: 20 }}>Nearby verified movers have been notified. Your first quote usually arrives within a minute.</p>
      <div className={styles.statusList}>
        <ChecklistRow label="Request published" sub="Your job is live" done />
        <ChecklistRow label="Movers reviewing your job" sub="Matching nearby verified movers" done />
        <ChecklistRow label="Quotes arriving now" sub="We'll notify you instantly" done={false} />
      </div>
      {canCancel ? (
        <button
          type="button"
          onClick={onCancel}
          disabled={cancelBusy}
          style={{
            marginTop: 18,
            height: 44,
            borderRadius: 12,
            border: "1.5px solid rgba(0,0,0,.14)",
            background: "#fff",
            font: "700 13px 'Hanken Grotesk'",
            cursor: cancelBusy ? "wait" : "pointer",
          }}
        >
          {cancelBusy ? "Cancelling…" : "Cancel this move"}
        </button>
      ) : null}
    </div>
  );
}

function ChecklistRow({ label, sub, done }: { label: string; sub: string; done: boolean }) {
  return (
    <div className={styles.statusRow}>
      <div className={`${styles.statusIcon} ${done ? "" : styles.statusIconSearching}`}>
        {done ? "✓" : ""}
      </div>
      <div>
        <div className={styles.statusText}>{label}</div>
        <div className={styles.statusSub}>{sub}</div>
      </div>
    </div>
  );
}

function QuoteCard({ quote, selected, onSelect }: { quote: Quote; selected: boolean; onSelect: () => void }) {
  const meta = quoteNegotiationMeta(quote);
  const name = moverDisplayName(quote.mover);
  const arrival = parseQuoteArrivalLabel(quote.notes);
  const duration = formatDurationLabel(quote.estimatedHours != null ? Number(quote.estimatedHours) : null);
  return (
    <div
      onClick={onSelect}
      style={{
        border: selected ? "2px solid var(--accent)" : "1.5px solid rgba(0,0,0,.1)",
        borderRadius: 14,
        padding: 14,
        cursor: "pointer",
        position: "relative",
        background: "#fff",
      }}
    >
      {selected && (
        <div
          style={{
            position: "absolute",
            top: -10,
            left: 14,
            background: "var(--accent)",
            color: "#0E0E10",
            font: "800 10px 'Hanken Grotesk'",
            letterSpacing: ".05em",
            padding: "3px 9px",
            borderRadius: 999,
          }}
        >
          SELECTED
        </div>
      )}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <MoverAvatar name={name} imageUrl={quote.mover?.moverProfile?.avatarUrl} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <b style={{ font: "700 15px 'Hanken Grotesk'" }}>{name}</b>
            <b style={{ font: "900 18px 'Archivo'" }}>${Number(quote.price).toFixed(0)}</b>
          </div>
          <div style={{ marginTop: 4 }}>
            <StatusBadge label={meta.statusLabel} tone={meta.statusTone} />
          </div>
        </div>
      </div>
      {arrival || duration ? (
        <div style={{ marginTop: 10, font: "600 12px 'Hanken Grotesk'", color: "#6B6B70" }}>
          {[arrival ? `Can start at ${arrival}` : null, duration ? `Estimated ${duration}` : null].filter(Boolean).join(" · ")}
        </div>
      ) : null}
    </div>
  );
}
