"use client";

import { useState } from "react";
import { businessApi } from "@/lib/api";
import { AppIcon } from "@/components/ui/Icons";
import styles from "@/app/public-pages.module.css";

export default function BusinessContactForm() {
  const [workEmail, setWorkEmail] = useState("");
  const [company, setCompany] = useState("");
  const [movesPerMonth, setMovesPerMonth] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (submitted) {
    return (
      <div className={styles.businessFormSuccess} style={{ width: 480, flex: "none", background: "rgba(255,255,255,.04)", padding: 40, display: "flex", flexDirection: "column", gap: 10, justifyContent: "center", textAlign: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
          <AppIcon name="check" size={22} color="#0E0E10" strokeWidth={3} />
        </div>
        <div style={{ font: "800 18px 'Archivo'", color: "#fff" }}>Thanks — we&apos;ll be in touch</div>
        <div style={{ font: "500 14px 'Hanken Grotesk'", color: "rgba(255,255,255,.6)" }}>
          A specialist will reach out to {workEmail || "your inbox"} within a day.
        </div>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    height: 52,
    width: "100%",
    border: "1.5px solid rgba(255,255,255,.16)",
    borderRadius: 12,
    padding: "0 16px",
    font: "600 14px 'Hanken Grotesk'",
    color: "#fff",
    background: "transparent",
    outline: "none",
  };

  return (
    <form
      className={styles.businessForm}
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
          await businessApi.submitLead({
            workEmail,
            company,
            movesPerMonth: movesPerMonth || undefined,
          });
          setSubmitted(true);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
          setSubmitting(false);
        }
      }}
      style={{ width: 480, flex: "none", background: "rgba(255,255,255,.04)", padding: 40, display: "flex", flexDirection: "column", gap: 12, justifyContent: "center" }}
    >
      {error && <div style={{ font: "600 13px 'Hanken Grotesk'", color: "#ff8080" }}>{error}</div>}
      <input required type="email" value={workEmail} onChange={(e) => setWorkEmail(e.target.value)} placeholder="Work email" style={inputStyle} />
      <input required value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" style={inputStyle} />
      <input value={movesPerMonth} onChange={(e) => setMovesPerMonth(e.target.value)} placeholder="Estimated moves / month" style={inputStyle} />
      <button
        type="submit"
        disabled={submitting}
        style={{
          height: 54,
          border: "none",
          borderRadius: 12,
          background: "var(--accent)",
          color: "#0E0E10",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          font: "800 16px 'Archivo'",
          marginTop: 4,
          cursor: submitting ? "wait" : "pointer",
          opacity: submitting ? 0.7 : 1,
        }}
      >
        {submitting ? "Sending…" : "Request a demo"}
      </button>
    </form>
  );
}
