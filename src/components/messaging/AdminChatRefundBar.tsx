"use client";

import { useState } from "react";
import { TextInput } from "@/components/FormControls";
import { adminApi } from "@/lib/api";
import styles from "./AdminChatRefundBar.module.css";

export function AdminChatRefundBar({
  disputeId,
  busy,
  onRefunded,
}: {
  disputeId: string;
  busy?: boolean;
  onRefunded?: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const issueRefund = async () => {
    const value = Number(amount);
    if (!value || value <= 0) {
      setError("Enter a valid refund amount.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await adminApi.issueDisputeRefund(disputeId, value, note.trim() || undefined);
      setSuccess(`$${value.toFixed(2)} credited to customer wallet. New balance: $${Number(result.balance).toFixed(2)}`);
      setAmount("");
      setNote("");
      onRefunded?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not issue refund");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: 12,
        background: "#f3faf4",
        border: "1.5px solid rgba(31,107,31,.2)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ font: "800 13px 'Archivo'", color: "#1f6b1f" }}>Refund from this chat</div>
      <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#3a6b3a" }}>
        Send money back to the customer wallet without closing the dispute.
      </div>
      <div className={styles.fields} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <TextInput label="Refund amount ($)" value={amount} onChange={setAmount} placeholder="25.00" />
        <TextInput label="Note (optional)" value={note} onChange={setNote} placeholder="Partial damage credit" />
      </div>
      {error && <div style={{ font: "600 12px 'Hanken Grotesk'", color: "#a8442a" }}>{error}</div>}
      {success && <div style={{ font: "600 12px 'Hanken Grotesk'", color: "#1f6b1f" }}>{success}</div>}
      <button
        type="button"
        disabled={busy || submitting || !amount.trim()}
        onClick={() => void issueRefund()}
        style={{
          height: 40,
          borderRadius: 10,
          border: "none",
          background: "#1f6b1f",
          color: "#fff",
          font: "800 13px 'Archivo'",
          cursor: busy || submitting ? "wait" : "pointer",
          opacity: busy || submitting ? 0.7 : 1,
        }}
      >
        {submitting ? "Sending refund…" : "Send refund to customer wallet"}
      </button>
    </div>
  );
}
