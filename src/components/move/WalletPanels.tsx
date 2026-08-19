"use client";

import { useEffect, useState } from "react";
import type { CustomerWallet, MoverWallet, PaymentInvoice, WalletStatement, WalletStatementEntry } from "@/lib/api/types";
import { downloadInvoicePdf, shareInvoice } from "@/lib/invoiceDocument";
import { moversApi } from "@/lib/api/movers";
import { MoveSheet } from "@/components/move/MoveSheet";
import { BlockLoader } from "@/components/ui/MtoLoader";
import styles from "./WalletPanels.module.css";

function money(n: number) {
  return `$${Number(n).toFixed(2)}`;
}

function directionLabel(entry: WalletStatementEntry) {
  return entry.direction === "credit" ? "Received" : "Paid out";
}

export function WalletStatementPanel({
  statement,
  loading,
  title = "Payment statement",
  subtitle = "Money in, money out, reason, and where it moved",
  compact = false,
}: {
  statement?: WalletStatement | null;
  loading?: boolean;
  title?: string;
  subtitle?: string;
  compact?: boolean;
}) {
  const entries = statement?.entries ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <div style={{ font: "800 16px 'Archivo'", marginBottom: 4 }}>{title}</div>
        <div style={{ font: "500 13px 'Hanken Grotesk'", color: "#6B6B70" }}>{subtitle}</div>
      </div>

      {statement && (
        <div className="wallet-summary-grid" style={{ display: "grid", gridTemplateColumns: compact ? "1fr 1fr" : "repeat(3, 1fr)", gap: 10 }}>
          <SummaryCard label="Current balance" value={money(statement.currentBalance)} accent />
          <SummaryCard label="Total received" value={money(statement.totalIn)} positive />
          <SummaryCard label="Total paid out" value={money(statement.totalOut)} negative />
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {loading && !entries.length && (
          <BlockLoader label="Loading statement…" minHeight={140} />
        )}
        {!loading && !entries.length && (
          <div style={{ padding: 22, borderRadius: 14, border: "1.5px dashed rgba(0,0,0,.14)", textAlign: "center", background: "#FAFAF8" }}>
            <div style={{ font: "800 15px 'Archivo'", marginBottom: 6 }}>No transactions yet</div>
            <div style={{ font: "500 13px 'Hanken Grotesk'", color: "#6B6B70" }}>
              Top-ups, payments, tips, and dispute refunds will appear here.
            </div>
          </div>
        )}
        {entries.map((entry) => (
          <div
            key={entry.id}
            style={{
              background: "#fff",
              border: "1.5px solid rgba(0,0,0,.08)",
              borderRadius: 14,
              padding: "14px 16px",
            }}
          >
            <div className="wallet-statement-row" style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                  <b style={{ font: "700 15px 'Hanken Grotesk'" }}>{entry.reason}</b>
                  <span
                    style={{
                      font: "700 10px 'Hanken Grotesk'",
                      letterSpacing: ".06em",
                      textTransform: "uppercase",
                      padding: "4px 8px",
                      borderRadius: 999,
                      background: entry.direction === "credit" ? "rgba(31,107,31,.1)" : "rgba(168,68,42,.1)",
                      color: entry.direction === "credit" ? "#1f6b1f" : "#a8442a",
                    }}
                  >
                    {directionLabel(entry)}
                  </span>
                </div>
                <div style={{ font: "500 13px 'Hanken Grotesk'", color: "#6B6B70" }}>{entry.description}</div>
                <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8A8A90", marginTop: 8 }}>
                  {entry.source ? <span>From <b>{entry.source}</b></span> : null}
                  {entry.source && entry.destination ? <span> → </span> : null}
                  {entry.destination ? <span>To <b>{entry.destination}</b></span> : null}
                </div>
                <div style={{ font: "500 11px 'Hanken Grotesk'", color: "#9a9aa0", marginTop: 6 }}>
                  {new Date(entry.createdAt).toLocaleString()}
                  {entry.reference ? ` · ${entry.reference}` : ""}
                  {entry.balanceAfter != null ? ` · balance ${money(entry.balanceAfter)}` : ""}
                </div>
              </div>
              <b
                style={{
                  font: "800 18px 'Archivo'",
                  color: entry.direction === "credit" ? "#1f6b1f" : "#a8442a",
                  flex: "none",
                }}
              >
                {entry.direction === "credit" ? "+" : "-"}
                {money(entry.amount)}
              </b>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
  positive,
  negative,
}: {
  label: string;
  value: string;
  accent?: boolean;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <div
      style={{
        borderRadius: 12,
        padding: "12px 14px",
        background: accent ? "#0E0E10" : "#fff",
        color: accent ? "#fff" : "#0E0E10",
        border: accent ? "none" : "1.5px solid rgba(0,0,0,.08)",
      }}
    >
      <div style={{ font: "600 11px 'Hanken Grotesk'", opacity: accent ? 0.65 : 1, color: accent ? undefined : "#8A8A90", marginBottom: 6 }}>
        {label}
      </div>
      <div
        style={{
          font: "800 20px 'Archivo'",
          color: positive ? "#1f6b1f" : negative ? "#a8442a" : undefined,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function MoverPaymentList({
  payments,
  loading,
  onViewInvoice,
  invoiceBusyId,
}: {
  payments: MoverWallet["payments"];
  loading?: boolean;
  onViewInvoice?: (paymentId: string) => void;
  invoiceBusyId?: string | null;
}) {
  if (!payments.length && !loading) {
    return (
      <div style={{ border: "1.5px dashed rgba(0,0,0,.14)", borderRadius: 14, padding: 28, textAlign: "center", background: "#FAFAF8" }}>
        <div style={{ font: "800 16px 'Archivo'", marginBottom: 6 }}>No payouts yet</div>
        <div style={{ font: "500 14px 'Hanken Grotesk'", color: "#6B6B70" }}>
          When a customer verifies delivery and pays, job pay and tips show up here.
        </div>
      </div>
    );
  }

  if (!payments.length) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {payments.map((p) => (
        <div
          key={p.id}
          style={{
            background: "#FAFAF8",
            borderRadius: 14,
            padding: "14px 16px",
            border: "1.5px solid rgba(0,0,0,.08)",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: p.kind === "tip" ? "rgba(255,222,46,.35)" : "#0E0E10",
              color: p.kind === "tip" ? "#0E0E10" : "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              font: "800 12px 'Archivo'",
              flex: "none",
            }}
          >
            {p.kind === "tip" ? "TIP" : "JOB"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
              <b style={{ font: "700 15px 'Hanken Grotesk'" }}>{p.customerName}</b>
              <b style={{ font: "800 16px 'Archivo'", color: "#1f6b1f" }}>+{money(p.net)}</b>
            </div>
            <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#6B6B70" }}>
              {p.kind === "tip" ? "Customer tip" : "Job payment"}
              {p.route ? ` · ${p.route.pickup} → ${p.route.destination}` : ""}
            </div>
            <div style={{ font: "500 11px 'Hanken Grotesk'", color: "#9a9aa0", marginTop: 4 }}>
              {new Date(p.createdAt).toLocaleString()} · gross {money(p.amount)} · fee {money(p.platformCommission)}
              {p.invoiceNumber ? ` · ${p.invoiceNumber}` : ""}
            </div>
            {onViewInvoice && (
              <button
                type="button"
                onClick={() => onViewInvoice(p.id)}
                disabled={invoiceBusyId === p.id}
                style={{
                  marginTop: 8,
                  height: 32,
                  padding: "0 12px",
                  borderRadius: 8,
                  border: "1.5px solid rgba(0,0,0,.12)",
                  background: "#fff",
                  font: "700 12px 'Hanken Grotesk'",
                  cursor: invoiceBusyId === p.id ? "wait" : "pointer",
                }}
              >
                {invoiceBusyId === p.id ? "Loading…" : "View invoice"}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function MoverPayDashboard({
  wallet,
  loading,
  onRefresh,
  embedded = false,
}: {
  wallet: MoverWallet | null;
  loading?: boolean;
  onRefresh?: () => void;
  embedded?: boolean;
}) {
  const balance = wallet?.availableBalance ?? 0;
  const jobs = wallet?.jobEarnings ?? 0;
  const tips = wallet?.tipEarnings ?? 0;
  const fees = wallet?.platformFees ?? 0;
  const payments = wallet?.payments ?? [];
  const [selectedInvoice, setSelectedInvoice] = useState<PaymentInvoice | null>(null);
  const [invoiceBusyId, setInvoiceBusyId] = useState<string | null>(null);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [cashOutAmount, setCashOutAmount] = useState("");
  const [cashOutNote, setCashOutNote] = useState("");
  const [cashOutBusy, setCashOutBusy] = useState(false);
  const [cashOutMsg, setCashOutMsg] = useState<string | null>(null);

  const submitCashOut = async () => {
    const amount = Number(cashOutAmount);
    if (!(amount > 0)) {
      setCashOutMsg("Enter a valid amount.");
      return;
    }
    setCashOutBusy(true);
    setCashOutMsg(null);
    try {
      await moversApi.requestCashOut(amount, cashOutNote.trim() || undefined);
      setCashOutMsg("Cash-out requested. An admin will review it shortly.");
      setCashOutAmount("");
      setCashOutNote("");
      onRefresh?.();
    } catch (err) {
      setCashOutMsg(err instanceof Error ? err.message : "Cash-out failed");
    } finally {
      setCashOutBusy(false);
    }
  };

  const viewInvoice = async (paymentId: string) => {
    setInvoiceBusyId(paymentId);
    setShareNote(null);
    try {
      setSelectedInvoice(await moversApi.getPaymentInvoice(paymentId));
    } catch {
      setSelectedInvoice(null);
    } finally {
      setInvoiceBusyId(null);
    }
  };

  const handleShare = async () => {
    if (!selectedInvoice) return;
    const ok = await shareInvoice(selectedInvoice);
    setShareNote(ok ? "Invoice shared." : "Could not share invoice.");
  };

  const cashOutForm = (
    <div style={{ background: embedded ? "#fff" : "rgba(255,255,255,.06)", border: embedded ? "1.5px solid rgba(0,0,0,.08)" : "1px solid rgba(255,255,255,.12)", borderRadius: 18, padding: "22px 24px" }}>
      <div style={{ font: "800 16px 'Archivo'", marginBottom: 4, color: embedded ? "#0E0E10" : "#fff" }}>Request cash-out</div>
      <div style={{ font: "500 13px 'Hanken Grotesk'", color: embedded ? "#6B6B70" : "rgba(255,255,255,.55)", marginBottom: 14 }}>
        Withdraw available balance to your bank or Interac e-Transfer
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input
          type="number"
          min={1}
          step="0.01"
          placeholder="Amount (CAD)"
          value={cashOutAmount}
          onChange={(e) => setCashOutAmount(e.target.value)}
          style={{
            height: 44,
            borderRadius: 10,
            border: embedded ? "1.5px solid rgba(0,0,0,.12)" : "1px solid rgba(255,255,255,.2)",
            background: embedded ? "#FAFAF8" : "rgba(0,0,0,.25)",
            color: embedded ? "#0E0E10" : "#fff",
            padding: "0 14px",
            font: "600 14px 'Hanken Grotesk'",
          }}
        />
        <input
          type="text"
          placeholder="Bank / e-Transfer note (optional)"
          value={cashOutNote}
          onChange={(e) => setCashOutNote(e.target.value)}
          style={{
            height: 44,
            borderRadius: 10,
            border: embedded ? "1.5px solid rgba(0,0,0,.12)" : "1px solid rgba(255,255,255,.2)",
            background: embedded ? "#FAFAF8" : "rgba(0,0,0,.25)",
            color: embedded ? "#0E0E10" : "#fff",
            padding: "0 14px",
            font: "600 14px 'Hanken Grotesk'",
          }}
        />
        <button
          type="button"
          disabled={cashOutBusy || balance <= 0}
          onClick={() => void submitCashOut()}
          style={{
            height: 44,
            borderRadius: 10,
            border: "none",
            background: "var(--accent)",
            color: "#0E0E10",
            font: "800 14px 'Archivo'",
            cursor: cashOutBusy || balance <= 0 ? "not-allowed" : "pointer",
            opacity: cashOutBusy || balance <= 0 ? 0.6 : 1,
          }}
        >
          {cashOutBusy ? "Submitting…" : "Submit cash-out request"}
        </button>
        {cashOutMsg && (
          <div style={{ font: "500 13px 'Hanken Grotesk'", color: embedded ? "#6B6B70" : "rgba(255,255,255,.7)" }}>
            {cashOutMsg}
          </div>
        )}
      </div>
    </div>
  );

  const activityBlock = (
    <>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ font: "800 18px 'Archivo'", color: embedded ? "#0E0E10" : undefined }}>Released invoices</div>
          <div style={{ font: "500 13px 'Hanken Grotesk'", color: "#6B6B70", marginTop: 4 }}>
            Customer payments released to you — tap to view full invoice
          </div>
        </div>
        {wallet && wallet.pendingJobs > 0 && (
          <div style={{ font: "700 12px 'Hanken Grotesk'", background: "rgba(255,222,46,.35)", padding: "6px 10px", borderRadius: 8 }}>
            {wallet.pendingJobs} active job{wallet.pendingJobs === 1 ? "" : "s"}
          </div>
        )}
      </div>
      <MoverPaymentList
        payments={payments}
        loading={loading}
        onViewInvoice={(id) => void viewInvoice(id)}
        invoiceBusyId={invoiceBusyId}
      />
      {selectedInvoice && !embedded && (
        <div style={{ marginTop: 16 }}>
          <InvoicePreviewCard
            invoice={selectedInvoice}
            onDownload={() => downloadInvoicePdf(selectedInvoice)}
            onShare={() => void handleShare()}
            shareNote={shareNote}
          />
        </div>
      )}
    </>
  );

  if (embedded) {
    return (
      <div className={styles.moverRoot} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div className={styles.moverTopGrid}>
          <div
            className={styles.moverHero}
            style={{
              borderRadius: 18,
              padding: "26px 28px",
              background: "linear-gradient(145deg, #0E0E10 0%, #1a1a1e 60%, #1f2610 100%)",
              color: "#fff",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 55% at 100% 0%, rgba(255,222,46,.28), transparent)", pointerEvents: "none" }} />
            <div style={{ position: "relative" }}>
              <div style={{ font: "600 12px 'Hanken Grotesk'", color: "rgba(255,255,255,.5)", marginBottom: 8 }}>Available balance</div>
              <div className={styles.balanceValue} style={{ font: "900 44px/1 'Archivo'", letterSpacing: "-.03em" }}>{loading && !wallet ? "…" : money(balance)}</div>
              <div style={{ marginTop: 10, font: "500 13px 'Hanken Grotesk'", color: "rgba(255,255,255,.45)" }}>Net after 10% platform fee</div>
              {onRefresh && (
                <button type="button" onClick={onRefresh} className={styles.refreshBtn} style={{ marginTop: 18, height: 44, padding: "0 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,.2)", background: "rgba(255,255,255,.08)", color: "#fff", font: "700 13px 'Hanken Grotesk'", cursor: "pointer" }}>
                  Refresh
                </button>
              )}
            </div>
          </div>
          <div className={styles.moverStats}>
            {[
              { label: "Job pay", value: money(jobs) },
              { label: "Tips", value: money(tips) },
              { label: "Fees paid", value: money(fees) },
              { label: "Completed", value: String(wallet?.completedJobs ?? 0) },
            ].map((card) => (
              <div className={styles.moverStat} key={card.label} style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,.08)", borderRadius: 14, padding: "16px 18px" }}>
                <div style={{ font: "600 11px 'Hanken Grotesk'", color: "#8A8A90", marginBottom: 8 }}>{card.label}</div>
                <div style={{ font: "800 22px 'Archivo'" }}>{card.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.moverPanel} style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,.08)", borderRadius: 18, padding: "22px 24px" }}>
          <WalletStatementPanel
            statement={wallet?.statement}
            loading={loading}
            title="Wallet statement"
            subtitle="Every payout, fee adjustment, and dispute deduction"
            compact
          />
        </div>

        {cashOutForm}

        <div className={styles.moverPanel} style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,.08)", borderRadius: 18, padding: "22px 24px" }}>
          {activityBlock}
        </div>

        <MoveSheet
          title="Invoice"
          open={Boolean(selectedInvoice)}
          onClose={() => setSelectedInvoice(null)}
          width={480}
        >
          {selectedInvoice && (
            <InvoicePreviewCard
              invoice={selectedInvoice}
              onDownload={() => downloadInvoicePdf(selectedInvoice)}
              onShare={() => void handleShare()}
              shareNote={shareNote}
            />
          )}
        </MoveSheet>
      </div>
    );
  }

  return (
    <section
      style={{
        borderRadius: 18,
        overflow: "hidden",
        background: "linear-gradient(165deg, #1a1a1e 0%, #0E0E10 45%, #151812 100%)",
        color: "#fff",
        minHeight: 640,
      }}
    >
      <div style={{ padding: "28px 28px 20px", position: "relative" }}>
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 80% 60% at 90% -10%, rgba(255,222,46,.22), transparent 55%), radial-gradient(ellipse 50% 40% at 0% 100%, rgba(255,255,255,.06), transparent)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,.55)", marginBottom: 10 }}>
              Mover wallet
            </div>
            <div style={{ font: "500 14px 'Hanken Grotesk'", color: "rgba(255,255,255,.65)", marginBottom: 6 }}>Available balance</div>
            <div style={{ font: "900 48px/1 'Archivo'", letterSpacing: "-.03em" }}>{loading && !wallet ? "…" : money(balance)}</div>
            <div style={{ marginTop: 10, font: "500 13px 'Hanken Grotesk'", color: "rgba(255,255,255,.5)" }}>
              After 10% platform fee · tips included
            </div>
          </div>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              style={{
                height: 40,
                padding: "0 14px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,.2)",
                background: "rgba(255,255,255,.06)",
                color: "#fff",
                font: "700 13px 'Hanken Grotesk'",
                cursor: "pointer",
              }}
            >
              Refresh
            </button>
          )}
        </div>

        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 28 }}>
          {[
            { label: "Job pay", value: money(jobs) },
            { label: "Tips", value: money(tips) },
            { label: "Platform fees", value: money(fees) },
            { label: "Completed", value: String(wallet?.completedJobs ?? 0) },
          ].map((card) => (
            <div
              key={card.label}
              style={{
                borderRadius: 14,
                padding: "14px 16px",
                background: "rgba(255,255,255,.06)",
                border: "1px solid rgba(255,255,255,.08)",
              }}
            >
              <div style={{ font: "600 11px 'Hanken Grotesk'", color: "rgba(255,255,255,.5)", marginBottom: 8 }}>{card.label}</div>
              <div style={{ font: "800 20px 'Archivo'" }}>{card.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "#F5F4EF", color: "#0E0E10", padding: "22px 28px 28px", borderRadius: "20px 20px 0 0", minHeight: 360 }}>
        <div style={{ marginBottom: 22 }}>{cashOutForm}</div>

        <div style={{ marginBottom: 22 }}>
          <WalletStatementPanel
            statement={wallet?.statement}
            loading={loading}
            title="Wallet statement"
            subtitle="Track what came in, what went out, and why"
          />
        </div>

        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ font: "800 18px 'Archivo'" }}>Pay activity</div>
            <div style={{ font: "500 13px 'Hanken Grotesk'", color: "#6B6B70", marginTop: 4 }}>
              Job payments and tips from customers
            </div>
          </div>
          {wallet && wallet.pendingJobs > 0 && (
            <div style={{ font: "700 12px 'Hanken Grotesk'", background: "rgba(255,222,46,.35)", padding: "6px 10px", borderRadius: 8 }}>
              {wallet.pendingJobs} active job{wallet.pendingJobs === 1 ? "" : "s"}
            </div>
          )}
        </div>

        {!payments.length && !loading && (
          <div
            style={{
              border: "1.5px dashed rgba(0,0,0,.14)",
              borderRadius: 14,
              padding: 28,
              textAlign: "center",
              background: "#fff",
            }}
          >
            <div style={{ font: "800 16px 'Archivo'", marginBottom: 6 }}>No payouts yet</div>
            <div style={{ font: "500 14px 'Hanken Grotesk'", color: "#6B6B70" }}>
              When a customer verifies delivery and pays, job pay and tips show up here.
            </div>
          </div>
        )}

        {(payments.length > 0 || loading) && activityBlock}
      </div>
    </section>
  );
}

export function InvoicePreviewCard({
  invoice,
  onDownload,
  onShare,
  shareNote,
}: {
  invoice: PaymentInvoice;
  onDownload?: () => void;
  onShare?: () => void;
  shareNote?: string | null;
}) {
  return (
    <div className="invoice-preview" style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,.1)", borderRadius: 16, overflow: "hidden" }}>
      <div className="invoice-header" style={{ padding: "18px 20px", borderBottom: "1px solid rgba(0,0,0,.08)", display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div>
          <div style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".08em", textTransform: "uppercase", color: "#8A8A90" }}>Invoice</div>
          <div style={{ font: "900 22px 'Archivo'", marginTop: 4 }}>{invoice.invoiceNumber}</div>
          <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#6B6B70", marginTop: 4 }}>
            {new Date(invoice.issuedAt).toLocaleString()}
          </div>
        </div>
        <span
          style={{
            font: "800 11px 'Hanken Grotesk'",
            padding: "5px 10px",
            borderRadius: 999,
            background: invoice.status === "paid" ? "rgba(31,107,31,.12)" : "rgba(255,222,46,.35)",
            color: invoice.status === "paid" ? "#1f6b1f" : "#0E0E10",
          }}
        >
          {invoice.status === "paid" ? (invoice.viewerRole === "mover" ? "RELEASED" : "PAID") : "READY TO PAY"}
        </span>
      </div>

      <div style={{ padding: "16px 20px" }}>
        <div className="invoice-parties" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <div style={{ font: "700 10px 'Hanken Grotesk'", color: "#8A8A90", textTransform: "uppercase", letterSpacing: ".06em" }}>Bill to</div>
            <div style={{ font: "700 14px 'Hanken Grotesk'", marginTop: 4 }}>{invoice.customer.name ?? "Customer"}</div>
          </div>
          <div>
            <div style={{ font: "700 10px 'Hanken Grotesk'", color: "#8A8A90", textTransform: "uppercase", letterSpacing: ".06em" }}>Mover</div>
            <div style={{ font: "700 14px 'Hanken Grotesk'", marginTop: 4 }}>{invoice.mover.name}</div>
          </div>
        </div>

        <div style={{ font: "600 13px 'Hanken Grotesk'", color: "#6B6B70", marginBottom: 14 }}>
          {invoice.route.pickup} → {invoice.route.destination}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {invoice.lineItems.map((item) => (
            <div key={item.label} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,.06)" }}>
              <div style={{ flex: 1 }}>
                <div style={{ font: "700 14px 'Hanken Grotesk'" }}>{item.label}</div>
                {item.description && <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#6B6B70", marginTop: 3 }}>{item.description}</div>}
              </div>
              <b style={{ font: "800 15px 'Archivo'", color: item.amount < 0 ? "#a8442a" : "#0E0E10" }}>
                {item.amount < 0 ? `-${money(Math.abs(item.amount))}` : item.amount > 0 ? money(item.amount) : "—"}
              </b>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, paddingTop: 12, borderTop: "2px solid #0E0E10" }}>
          {invoice.viewerRole === "mover" && invoice.netEarnings != null ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ font: "600 13px 'Hanken Grotesk'", color: "#6B6B70" }}>Customer paid</span>
                <span style={{ font: "800 16px 'Archivo'" }}>{money(invoice.total)}</span>
              </div>
              {invoice.platformFee != null && invoice.platformFee > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ font: "600 13px 'Hanken Grotesk'", color: "#6B6B70" }}>Platform fee</span>
                  <span style={{ font: "800 16px 'Archivo'", color: "#a8442a" }}>-{money(invoice.platformFee)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ font: "800 14px 'Archivo'" }}>Your payout</span>
                <span style={{ font: "900 28px 'Archivo'", color: "#1f6b1f" }}>{money(invoice.netEarnings)}</span>
              </div>
            </>
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ font: "800 14px 'Archivo'" }}>Total due</span>
              <span style={{ font: "900 28px 'Archivo'" }}>{money(invoice.total)}</span>
            </div>
          )}
        </div>
      </div>

      {(onDownload || onShare) && (
        <div className="invoice-actions" style={{ padding: "0 20px 18px", display: "flex", gap: 10 }}>
          {onDownload && (
            <button type="button" onClick={onDownload} style={invoiceActionBtn}>
              Download PDF
            </button>
          )}
          {onShare && (
            <button type="button" onClick={onShare} style={{ ...invoiceActionBtn, background: "#0E0E10", color: "#fff" }}>
              Share bill
            </button>
          )}
        </div>
      )}
      {shareNote && <div style={{ padding: "0 20px 16px", font: "600 12px 'Hanken Grotesk'", color: "#1f6b1f" }}>{shareNote}</div>}
      <style>{`
        @media(max-width:480px){
          .invoice-header{padding:15px!important}
          .invoice-header>div>div:nth-child(2){font-size:18px!important;overflow-wrap:anywhere}
          .invoice-preview>div:nth-child(2){padding:15px!important}
          .invoice-parties{grid-template-columns:1fr!important;gap:10px!important}
          .invoice-actions{padding:0 15px 15px!important;flex-direction:column}
          .invoice-actions button{width:100%;flex:none!important}
        }
      `}</style>
    </div>
  );
}

const invoiceActionBtn: React.CSSProperties = {
  flex: 1,
  height: 44,
  borderRadius: 10,
  border: "1.5px solid rgba(0,0,0,.14)",
  background: "#fff",
  font: "800 13px 'Archivo'",
  cursor: "pointer",
};

export function CustomerWalletCheckout({
  wallet,
  invoice,
  loading,
  paying,
  onPay,
  onRefresh,
  onContinue,
  continueLabel = "Continue →",
}: {
  wallet: CustomerWallet | null;
  invoice: PaymentInvoice | null;
  loading?: boolean;
  paying?: boolean;
  topUpBusy?: boolean;
  onTopUp?: (amount: number) => Promise<void>;
  onPay?: () => Promise<void>;
  onRefresh?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
}) {
  const [shareNote, setShareNote] = useState<string | null>(null);
  const balance = wallet?.balance ?? invoice?.walletBalance ?? 0;
  const shortfall =
    invoice && !invoice.alreadyPaid ? Math.max(0, invoice.total - balance) : 0;

  useEffect(() => {
    // A newly loaded invoice should not retain the previous share result.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShareNote(null);
  }, [invoice?.invoiceNumber, invoice?.status]);

  const handleShare = async () => {
    if (!invoice) return;
    const ok = await shareInvoice(invoice);
    setShareNote(ok ? "Invoice details copied / shared." : "Could not share invoice.");
  };

  return (
    <div className="customer-wallet-checkout" style={{ width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", gap: 18 }}>
      <div
        className="customer-wallet-hero"
        style={{
          borderRadius: 18,
          padding: "28px 28px 24px",
          background: "linear-gradient(160deg, #0E0E10 0%, #1c1c20 55%, #1a2210 100%)",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 50% at 100% 0%, rgba(255,222,46,.25), transparent 50%)", pointerEvents: "none" }} />
        <div style={{ position: "relative" }}>
          <div style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,.55)", marginBottom: 10 }}>
            Wallet balance
          </div>
          <div style={{ font: "900 42px/1 'Archivo'", letterSpacing: "-.03em", marginBottom: 16 }}>
            {loading && wallet == null ? "…" : money(balance)}
          </div>
          <div style={{ font: "500 13px 'Hanken Grotesk'", color: "rgba(255,255,255,.55)", marginBottom: 16 }}>
            Jobs are paid in cash on site. Your mover wallet is credited when cash received is confirmed at the end of the move.
          </div>

          {onRefresh && (
            <button type="button" onClick={onRefresh} style={{ marginTop: 14, background: "none", border: "none", color: "rgba(255,255,255,.55)", font: "700 12px 'Hanken Grotesk'", cursor: "pointer", padding: 0 }}>
              Refresh wallet
            </button>
          )}
        </div>
      </div>

      {invoice ? (
        <>
          <InvoicePreviewCard
            invoice={invoice}
            onDownload={() => downloadInvoicePdf(invoice)}
            onShare={invoice.status === "paid" || invoice.alreadyPaid ? () => void handleShare() : undefined}
            shareNote={shareNote}
          />

          {!invoice.alreadyPaid && onPay && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {shortfall > 0 && (
                <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(168,68,42,.08)", color: "#a8442a", font: "600 13px 'Hanken Grotesk'" }}>
                  Add at least {money(shortfall)} more to pay this invoice.
                </div>
              )}
              <button
                type="button"
                disabled={paying || shortfall > 0}
                onClick={() => void onPay()}
                style={{
                  width: "100%",
                  height: 54,
                  borderRadius: 12,
                  border: "none",
                  background: paying || shortfall > 0 ? "rgba(0,0,0,.1)" : "var(--accent)",
                  color: "#0E0E10",
                  font: "800 16px 'Archivo'",
                  cursor: paying || shortfall > 0 ? "not-allowed" : "pointer",
                }}
              >
                {paying ? "Paying…" : `Pay ${money(invoice.total)} from wallet`}
              </button>
            </div>
          )}

          {invoice.alreadyPaid && onContinue && (
            <button
              type="button"
              onClick={onContinue}
              style={{
                width: "100%",
                height: 54,
                borderRadius: 12,
                border: "none",
                background: "#0E0E10",
                color: "#fff",
                font: "800 15px 'Archivo'",
                cursor: "pointer",
              }}
            >
              {continueLabel}
            </button>
          )}
        </>
      ) : (
        <CustomerWalletPanel wallet={wallet} loading={loading} onContinue={onContinue} continueLabel={continueLabel} />
      )}

      {wallet?.statement && (
        <WalletStatementPanel
          statement={wallet.statement}
          loading={loading}
          title="Account statement"
          subtitle="All wallet movements with source and destination"
          compact
        />
      )}
      <style>{`
        @media(max-width:560px){
          .customer-wallet-checkout{gap:14px!important}
          .customer-wallet-hero{padding:22px 18px!important;border-radius:15px!important}
          .customer-wallet-hero div[style*="font: 900 42px"]{font-size:34px!important}
          .wallet-topup-row{flex-wrap:wrap}
          .wallet-topup-row input{min-width:0}
          .wallet-topup-row button{padding:0 14px!important}
          .wallet-summary-grid{grid-template-columns:1fr 1fr!important}
          .wallet-statement-row{flex-wrap:wrap}
          .wallet-statement-row>b{margin-left:auto}
        }
        @media(max-width:380px){.wallet-summary-grid{grid-template-columns:1fr!important}}
      `}</style>
    </div>
  );
}

export function CustomerWalletPanel({
  wallet,
  loading,
  highlightBookingId,
  onContinue,
  continueLabel = "Rate your mover →",
}: {
  wallet: CustomerWallet | null;
  loading?: boolean;
  highlightBookingId?: string | null;
  onContinue?: () => void;
  continueLabel?: string;
}) {
  const payments = wallet?.payments ?? [];
  const highlighted = highlightBookingId
    ? payments.filter((p) => p.bookingId === highlightBookingId)
    : payments.slice(0, 3);

  return (
    <div style={{ width: "100%", maxWidth: 560 }}>
      <div
        style={{
          borderRadius: 18,
          padding: "28px 28px 24px",
          background: "linear-gradient(160deg, #0E0E10 0%, #1c1c20 55%, #1a2210 100%)",
          color: "#fff",
          marginBottom: 18,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse 70% 50% at 100% 0%, rgba(255,222,46,.25), transparent 50%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative" }}>
          <div style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,.55)", marginBottom: 10 }}>
            Your wallet
          </div>
          <div style={{ font: "500 14px 'Hanken Grotesk'", color: "rgba(255,255,255,.65)", marginBottom: 6 }}>Wallet balance</div>
          <div style={{ font: "900 42px/1 'Archivo'", letterSpacing: "-.03em", marginBottom: 18 }}>
            {loading && !wallet ? "…" : money(wallet?.balance ?? 0)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ borderRadius: 12, padding: "12px 14px", background: "rgba(255,255,255,.08)" }}>
              <div style={{ font: "600 11px 'Hanken Grotesk'", color: "rgba(255,255,255,.5)", marginBottom: 6 }}>Total paid</div>
              <div style={{ font: "800 18px 'Archivo'" }}>{money(wallet?.totalSpent ?? 0)}</div>
            </div>
            <div style={{ borderRadius: 12, padding: "12px 14px", background: "rgba(255,222,46,.18)" }}>
              <div style={{ font: "600 11px 'Hanken Grotesk'", color: "rgba(255,255,255,.65)", marginBottom: 6 }}>Move payments</div>
              <div style={{ font: "800 18px 'Archivo'" }}>{money(wallet?.jobPayments ?? 0)}</div>
            </div>
            <div style={{ borderRadius: 12, padding: "12px 14px", background: "rgba(255,255,255,.08)" }}>
              <div style={{ font: "600 11px 'Hanken Grotesk'", color: "rgba(255,255,255,.5)", marginBottom: 6 }}>Tips sent</div>
              <div style={{ font: "800 18px 'Archivo'" }}>{money(wallet?.tipsPaid ?? 0)}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ font: "800 16px 'Archivo'", marginBottom: 10 }}>
        {highlightBookingId ? "This payment" : "Recent payments"}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {(highlightBookingId ? highlighted : payments.slice(0, 8)).map((p) => (
          <div
            key={p.id}
            style={{
              background: "#fff",
              border: "1.5px solid rgba(0,0,0,.08)",
              borderRadius: 14,
              padding: "14px 16px",
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ font: "700 14px 'Hanken Grotesk'" }}>
                {p.kind === "tip" ? "Tip" : "Move payment"} · {p.moverName}
              </div>
              <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#6B6B70", marginTop: 4 }}>
                {new Date(p.createdAt).toLocaleString()}
                {p.invoiceNumber ? ` · ${p.invoiceNumber}` : ""}
              </div>
            </div>
            <b style={{ font: "800 16px 'Archivo'" }}>-{money(p.amount)}</b>
          </div>
        ))}
        {!payments.length && !loading && (
          <div style={{ padding: 20, borderRadius: 14, border: "1.5px dashed rgba(0,0,0,.14)", color: "#6B6B70", font: "500 14px 'Hanken Grotesk'", textAlign: "center" }}>
            No payments yet.
          </div>
        )}
      </div>

      <WalletStatementPanel
        statement={wallet?.statement}
        loading={loading}
        title="Full wallet statement"
        subtitle="Top-ups, move payments, tips, and dispute refunds"
        compact
      />

      <div style={{ marginTop: 20 }}>
      {onContinue && (
        <button
          type="button"
          onClick={onContinue}
          style={{
            width: "100%",
            height: 54,
            borderRadius: 12,
            border: "none",
            background: "#0E0E10",
            color: "#fff",
            font: "800 15px 'Archivo'",
            cursor: "pointer",
          }}
        >
          {continueLabel}
        </button>
      )}
      </div>
    </div>
  );
}
