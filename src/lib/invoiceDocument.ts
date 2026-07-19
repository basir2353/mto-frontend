import type { PaymentInvoice } from "@/lib/api/types";

function money(n: number) {
  return `$${Number(n).toFixed(2)}`;
}

function invoiceHtml(invoice: PaymentInvoice) {
  const rows = invoice.lineItems
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;">
          <div style="font-weight:700;">${item.label}</div>
          ${item.description ? `<div style="font-size:12px;color:#666;margin-top:4px;">${item.description}</div>` : ""}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;">${item.unitPrice > 0 ? money(item.unitPrice) : "—"}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;font-weight:700;">${item.amount > 0 ? money(item.amount) : "—"}</td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${invoice.invoiceNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111; margin: 0; padding: 32px; }
    h1 { margin: 0 0 8px; font-size: 28px; }
    .muted { color: #666; font-size: 13px; }
    .card { border: 1px solid #ddd; border-radius: 12px; padding: 24px; margin-top: 24px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th { text-align: left; font-size: 12px; color: #666; padding-bottom: 8px; border-bottom: 2px solid #111; }
    .total { font-size: 24px; font-weight: 800; margin-top: 18px; text-align: right; }
    .badge { display:inline-block; padding:4px 10px; border-radius:999px; background:#ffde2e; font-size:12px; font-weight:700; }
  </style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:24px;">
    <div>
      <h1>MoveThisOut</h1>
      <div class="muted">Invoice ${invoice.invoiceNumber}</div>
      <div class="muted">Issued ${new Date(invoice.issuedAt).toLocaleString()}</div>
    </div>
    <div style="text-align:right;">
      <span class="badge">${invoice.status === "paid" ? "PAID" : "DRAFT"}</span>
      ${invoice.paidAt ? `<div class="muted" style="margin-top:8px;">Paid ${new Date(invoice.paidAt).toLocaleString()}</div>` : ""}
    </div>
  </div>

  <div class="card">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
      <div>
        <div class="muted">Bill to</div>
        <div style="font-weight:700;margin-top:6px;">${invoice.customer.name ?? "Customer"}</div>
        ${invoice.customer.email ? `<div class="muted">${invoice.customer.email}</div>` : ""}
      </div>
      <div>
        <div class="muted">Mover</div>
        <div style="font-weight:700;margin-top:6px;">${invoice.mover.name}</div>
        <div class="muted">${invoice.route.pickup} → ${invoice.route.destination}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align:center;">Qty</th>
          <th style="text-align:right;">Unit</th>
          <th style="text-align:right;">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="total">Total ${money(invoice.total)}</div>
    ${invoice.viewerRole === "mover" && invoice.netEarnings != null ? `<div class="total" style="color:#1f6b1f;margin-top:8px;">Your payout ${money(invoice.netEarnings)}</div>` : ""}
  </div>
</body>
</html>`;
}

export function downloadInvoicePdf(invoice: PaymentInvoice) {
  const html = invoiceHtml(invoice);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (!win) {
    URL.revokeObjectURL(url);
    return;
  }
  win.onload = () => {
    win.focus();
    win.print();
    URL.revokeObjectURL(url);
  };
}

export async function shareInvoice(invoice: PaymentInvoice) {
  const text = `MoveThisOut invoice ${invoice.invoiceNumber}\n${invoice.route.pickup} → ${invoice.route.destination}\nTotal: ${money(invoice.total)}`;
  if (navigator.share) {
    try {
      await navigator.share({
        title: `Invoice ${invoice.invoiceNumber}`,
        text,
        url: window.location.href,
      });
      return true;
    } catch {
      return false;
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
