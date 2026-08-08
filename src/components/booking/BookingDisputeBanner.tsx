"use client";

import type { Dispute } from "@/lib/api/types";

function parseCategory(reason: string): string {
  const match = reason.match(/^\[([^\]]+)\]/);
  return match?.[1] ?? "General issue";
}

export function BookingDisputeBanner({ disputes }: { disputes?: Dispute[] }) {
  if (!disputes?.length) return null;

  const latest = [...disputes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0];

  const open = latest.status === "open";
  const tone = open
    ? { bg: "#fff4df", border: "#e8c96a", color: "#7a5a00" }
    : { bg: "#e7f5ea", border: "#9fd4a8", color: "#1f6b1f" };

  return (
    <div
      style={{
        marginTop: 16,
        padding: "16px 18px",
        borderRadius: 12,
        background: tone.bg,
        border: `1.5px solid ${tone.border}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
        <div style={{ font: "800 15px 'Archivo'", color: tone.color }}>
          {open ? "Dispute under review" : "Dispute resolved"}
        </div>
        <span style={{ font: "700 11px 'Hanken Grotesk'", textTransform: "uppercase", color: tone.color }}>
          {latest.status}
        </span>
      </div>
      <div style={{ font: "600 13px 'Hanken Grotesk'", color: "#3a3a40", marginTop: 8 }}>
        <b>{parseCategory(latest.reason)}</b>
        <div style={{ marginTop: 6, color: "#6B6B70", lineHeight: 1.45 }}>
          {latest.reason.replace(/^\[[^\]]+\]\s*/, "")}
        </div>
      </div>
      {(latest.evidenceUrls ?? []).length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          {latest.evidenceUrls!.map((url) => (
            <a key={url} href={url} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element -- remote upload host isn't guaranteed to be in next.config.ts remotePatterns; next/image would 500 on an unconfigured domain */}
              <img src={url} alt="Dispute evidence" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10, border: "1px solid rgba(0,0,0,.1)" }} />
            </a>
          ))}
        </div>
      )}
      <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8A8A90", marginTop: 10 }}>
        Filed {new Date(latest.createdAt).toLocaleString()}
        {latest.resolution && (
          <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 8, background: "rgba(255,255,255,.65)" }}>
            <b>Resolution:</b> {latest.resolution}
            {latest.refundAmount != null && Number(latest.refundAmount) > 0 && (
              <div style={{ marginTop: 6, color: "#1f6b1f" }}>
                <b>Refund:</b> ${Number(latest.refundAmount).toFixed(2)} credited to your wallet.
              </div>
            )}
          </div>
        )}
        {open && (
          <div style={{ marginTop: 8, color: "#7a5a00" }}>
            Admin and your mover can reply in the dispute room below.
          </div>
        )}
      </div>
    </div>
  );
}
