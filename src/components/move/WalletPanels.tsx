"use client";

import type { PaymentInvoice } from "@/lib/api/types";

const money = (amount: number) => `$${Number(amount).toFixed(2)}`;

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
          <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#6B6B70", marginTop: 4 }}>{new Date(invoice.issuedAt).toLocaleString()}</div>
        </div>
        <span style={{ font: "800 11px 'Hanken Grotesk'", padding: "5px 10px", borderRadius: 999, background: invoice.status === "paid" ? "rgba(31,107,31,.12)" : "rgba(255,222,46,.35)", color: invoice.status === "paid" ? "#1f6b1f" : "#0E0E10" }}>
          {invoice.status === "paid" ? "PAID" : "READY TO PAY"}
        </span>
      </div>
      <div style={{ padding: "16px 20px" }}>
        <div className="invoice-parties" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div><div style={labelStyle}>Bill to</div><div style={partyStyle}>{invoice.customer.name ?? "Customer"}</div></div>
          <div><div style={labelStyle}>Mover</div><div style={partyStyle}>{invoice.mover.name}</div></div>
        </div>
        <div style={{ font: "600 13px 'Hanken Grotesk'", color: "#6B6B70", marginBottom: 14 }}>{invoice.route.pickup} → {invoice.route.destination}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {invoice.lineItems.map((item) => (
            <div key={item.label} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,.06)" }}>
              <div style={{ flex: 1 }}><div style={{ font: "700 14px 'Hanken Grotesk'" }}>{item.label}</div>{item.description && <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#6B6B70", marginTop: 3 }}>{item.description}</div>}</div>
              <b style={{ font: "800 15px 'Archivo'", color: item.amount < 0 ? "#a8442a" : "#0E0E10" }}>{item.amount < 0 ? `-${money(Math.abs(item.amount))}` : item.amount > 0 ? money(item.amount) : "—"}</b>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: "2px solid #0E0E10", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ font: "800 14px 'Archivo'" }}>Total due</span><span style={{ font: "900 28px 'Archivo'" }}>{money(invoice.total)}</span>
        </div>
      </div>
      {(onDownload || onShare) && <div className="invoice-actions" style={{ padding: "0 20px 18px", display: "flex", gap: 10 }}>{onDownload && <button type="button" onClick={onDownload} style={actionStyle}>Download PDF</button>}{onShare && <button type="button" onClick={onShare} style={{ ...actionStyle, background: "#0E0E10", color: "#fff" }}>Share bill</button>}</div>}
      {shareNote && <div style={{ padding: "0 20px 16px", font: "600 12px 'Hanken Grotesk'", color: "#1f6b1f" }}>{shareNote}</div>}
      <style>{`@media(max-width:480px){.invoice-header{padding:15px!important}.invoice-preview>div:nth-child(2){padding:15px!important}.invoice-parties{grid-template-columns:1fr!important}.invoice-actions{padding:0 15px 15px!important;flex-direction:column}}`}</style>
    </div>
  );
}

const labelStyle: React.CSSProperties = { font: "700 10px 'Hanken Grotesk'", color: "#8A8A90", textTransform: "uppercase", letterSpacing: ".06em" };
const partyStyle: React.CSSProperties = { font: "700 14px 'Hanken Grotesk'", marginTop: 4 };
const actionStyle: React.CSSProperties = { flex: 1, height: 44, borderRadius: 10, border: "1.5px solid rgba(0,0,0,.14)", background: "#fff", font: "800 13px 'Archivo'", cursor: "pointer" };
