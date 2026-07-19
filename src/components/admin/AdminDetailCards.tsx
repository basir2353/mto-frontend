"use client";

import { useState } from "react";
import { TextInput, TextArea } from "@/components/FormControls";
import { BookingInsightsPanel } from "@/components/booking/BookingInsightsPanel";
import { DisputeThreadPanel } from "@/components/dispute/DisputeThreadPanel";
import { BookingTimelinePanel } from "@/components/booking/BookingTimelinePanel";
import type { Booking, Dispute, User } from "@/lib/api/types";
import styles from "./AdminDetailCards.module.css";

export function AdminBookingCard({
  booking,
  busy,
  onRefund,
}: {
  booking: Booking;
  busy?: boolean;
  onRefund: (paymentId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const pickup = formatAddress(booking.pickupAddress) ?? booking.request?.pickupAddress ?? "Pickup";
  const dest = formatAddress(booking.destinationAddress) ?? booking.request?.destinationAddress ?? "Destination";
  const customer = booking.customer?.customerProfile
    ? `${booking.customer.customerProfile.firstName} ${booking.customer.customerProfile.lastName}`.trim()
    : booking.customer?.email ?? "Customer";
  const mover = booking.mover?.moverProfile?.businessName ?? booking.mover?.email ?? "Unassigned";
  const completedPayments = (booking.payments ?? []).filter((p) => p.status === "completed");
  const totalCommission = completedPayments.reduce((s, p) => s + Number(p.platformCommission ?? 0), 0);
  const totalPaid = completedPayments.reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className={styles.card} style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,.1)", borderRadius: 14, overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ width: "100%", textAlign: "left", border: "none", background: "transparent", padding: "16px 18px", cursor: "pointer" }}
      >
        <div className={styles.cardHeading} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
          <div style={{ font: "700 15px 'Hanken Grotesk'" }}>{pickup} → {dest}</div>
          <div style={{ font: "800 15px 'Archivo'", flex: "none" }}>${Number(booking.price).toFixed(0)}</div>
        </div>
        <div style={{ font: "500 13px 'Hanken Grotesk'", color: "#6B6B70", marginTop: 6 }}>
          {customer} · {mover} · {new Date(booking.scheduledDate).toLocaleDateString()}
        </div>
        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <Badge text={booking.status} />
          {totalPaid > 0 && <Badge text={`Paid $${totalPaid.toFixed(0)}`} tone="ok" />}
          {totalCommission > 0 && <Badge text={`Commission $${totalCommission.toFixed(2)}`} />}
          <span style={{ marginLeft: "auto", font: "700 12px 'Hanken Grotesk'", color: "#6B6B70" }}>{open ? "▲ Hide" : "▼ Details"}</span>
        </div>
      </button>

      {open && (
        <div style={{ padding: "0 18px 18px", borderTop: "1px solid rgba(0,0,0,.08)", background: "#fafaf8" }}>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
            <MetaRow label="Booking ID" value={booking.id} mono />
            <MetaRow label="Customer email" value={booking.customer?.email ?? "—"} />
            <MetaRow label="Mover email" value={booking.mover?.email ?? "—"} />
            <MetaRow label="Request ID" value={booking.requestId ?? "—"} mono />
            <MetaRow label="Created" value={new Date(booking.createdAt).toLocaleString()} />
            <MetaRow label="Updated" value={new Date(booking.updatedAt).toLocaleString()} />

            <BookingInsightsPanel booking={booking} />
            <BookingTimelinePanel bookingId={booking.id} compact />

            {completedPayments.length > 0 && (
              <div>
                <div style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".08em", textTransform: "uppercase", color: "#8A8A90", marginBottom: 10 }}>
                  Refund actions
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {completedPayments.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      disabled={busy}
                      onClick={() => onRefund(p.id)}
                      style={{
                        height: 36,
                        padding: "0 14px",
                        borderRadius: 8,
                        border: "1.5px solid rgba(168,68,42,.35)",
                        background: "#fff",
                        color: "#a8442a",
                        font: "700 12px 'Hanken Grotesk'",
                        cursor: busy ? "wait" : "pointer",
                      }}
                    >
                      Refund {p.kind ?? "job"} ${Number(p.amount).toFixed(2)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminDisputeCard({
  dispute,
  busy,
  myUserId,
  onResolve,
}: {
  dispute: Dispute;
  busy: boolean;
  myUserId: string;
  onResolve: (id: string, resolution: string, refundAmount?: number) => void;
}) {
  const [open, setOpen] = useState(dispute.status === "open");
  const [resolution, setResolution] = useState("");
  const [refundOffer, setRefundOffer] = useState("");
  const booking = dispute.booking;
  const raisedBy = dispute.raisedBy;
  const raiserName = raisedBy?.customerProfile
    ? `${raisedBy.customerProfile.firstName} ${raisedBy.customerProfile.lastName}`.trim()
    : raisedBy?.moverProfile?.businessName ?? raisedBy?.email ?? "User";

  const applyTemplate = (template: string) => {
    const refundLine = refundOffer.trim() ? ` A refund of $${refundOffer} has been issued.` : "";
    setResolution(`${template}${refundLine}`);
  };

  return (
    <div className={styles.card} style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,.1)", borderRadius: 14, overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ width: "100%", textAlign: "left", border: "none", background: "transparent", padding: "16px 18px", cursor: "pointer" }}
      >
        <div className={styles.cardHeading} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <div style={{ font: "700 15px 'Hanken Grotesk'" }}>
              Dispute · {booking ? `${formatAddress(booking.pickupAddress) ?? "Move"} → ${formatAddress(booking.destinationAddress) ?? "…"}` : dispute.bookingId.slice(0, 8)}
            </div>
            <div style={{ font: "500 13px 'Hanken Grotesk'", color: "#6B6B70", marginTop: 4 }}>
              Raised by {raiserName} · {new Date(dispute.createdAt).toLocaleString()}
            </div>
          </div>
          <Badge text={dispute.status} tone={dispute.status === "open" ? "warn" : "ok"} />
        </div>
      </button>

      {open && (
        <div style={{ padding: "0 18px 18px", borderTop: "1px solid rgba(0,0,0,.08)" }}>
          <div style={{ marginTop: 14, padding: 14, background: "#fff4df", borderRadius: 12, font: "500 14px 'Hanken Grotesk'", lineHeight: 1.5 }}>
            <b>Customer complaint:</b> {dispute.reason}
            {(dispute.evidenceUrls ?? []).length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                {dispute.evidenceUrls!.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer">
                    <img src={url} alt="Dispute evidence" style={{ width: 88, height: 88, objectFit: "cover", borderRadius: 10, border: "1px solid rgba(0,0,0,.12)" }} />
                  </a>
                ))}
              </div>
            )}
          </div>

          {booking && (
            <div style={{ marginTop: 16 }}>
              <div style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".08em", textTransform: "uppercase", color: "#8A8A90", marginBottom: 10 }}>
                Dispute room
              </div>
              <DisputeThreadPanel bookingId={booking.id} myUserId={myUserId} disputeId={dispute.id} showAdminRefund={dispute.status === "open"} />
            </div>
          )}

          {booking && (
            <div style={{ marginTop: 16 }}>
              <div style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".08em", textTransform: "uppercase", color: "#8A8A90", marginBottom: 10 }}>
                Linked booking
              </div>
              <BookingInsightsPanel booking={booking} />
            </div>
          )}

          {dispute.resolution && (
            <div style={{ marginTop: 14, padding: 14, background: "#e7f5ea", borderRadius: 12, font: "600 14px 'Hanken Grotesk'" }}>
              <b>Resolution:</b> {dispute.resolution}
              {dispute.refundAmount != null && dispute.refundAmount > 0 && (
                <div style={{ marginTop: 8, color: "#1f6b1f" }}>
                  Refund credited to customer wallet: ${Number(dispute.refundAmount).toFixed(2)}
                </div>
              )}
            </div>
          )}

          {dispute.status === "open" && (
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".08em", textTransform: "uppercase", color: "#8A8A90" }}>
                Resolution templates
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {[
                  "We reviewed the evidence and sided with the customer.",
                  "We reviewed the evidence and sided with the mover.",
                  "Partial compensation agreed after investigation.",
                  "No policy violation found — case closed.",
                ].map((t) => (
                  <button key={t} type="button" onClick={() => applyTemplate(t)} style={templateChip}>
                    {t.slice(0, 42)}…
                  </button>
                ))}
              </div>
              <TextInput label="Optional refund amount ($)" value={refundOffer} onChange={setRefundOffer} placeholder="50" />
              <TextArea label="Resolution message to customer" value={resolution} onChange={setResolution} placeholder="Explain your decision and next steps…" minHeight={120} />
              <button
                type="button"
                disabled={busy || !resolution.trim()}
                onClick={() => {
                  const amount = refundOffer.trim() ? Number(refundOffer) : undefined;
                  onResolve(dispute.id, resolution.trim(), amount && amount > 0 ? amount : undefined);
                }}
                style={{
                  height: 44,
                  borderRadius: 10,
                  border: "none",
                  background: "#0E0E10",
                  color: "#fff",
                  font: "800 14px 'Archivo'",
                  cursor: busy || !resolution.trim() ? "wait" : "pointer",
                  opacity: busy || !resolution.trim() ? 0.6 : 1,
                }}
              >
                {busy ? "Saving…" : "Mark dispute resolved"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AdminUserCard({
  user,
  busy,
  onVerify,
}: {
  user: User;
  busy: boolean;
  onVerify: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const isMover = user.roles.includes("mover");
  const isCustomer = user.roles.includes("customer");
  const name = isMover
    ? user.moverProfile?.businessName ?? "Mover"
    : `${user.customerProfile?.firstName ?? ""} ${user.customerProfile?.lastName ?? ""}`.trim() || "Customer";
  const needsVerify = isMover && (!user.isVerified || !user.moverProfile?.isVerified);

  return (
    <div className={styles.card} style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,.1)", borderRadius: 14, overflow: "hidden" }}>
      <div className={styles.userHeading} style={{ padding: "16px 18px", display: "flex", gap: 16, alignItems: "center" }}>
        <button type="button" onClick={() => setOpen((v) => !v)} style={{ flex: 1, textAlign: "left", border: "none", background: "transparent", cursor: "pointer", padding: 0 }}>
          <div style={{ font: "700 15px 'Hanken Grotesk'" }}>{name}</div>
          <div style={{ font: "500 13px 'Hanken Grotesk'", color: "#6B6B70", marginTop: 3 }}>{user.email}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            {user.roles.map((r) => (
              <Badge key={r} text={r} />
            ))}
            <Badge text={user.isVerified ? "verified" : "unverified"} tone={user.isVerified ? "ok" : "warn"} />
          </div>
        </button>
        {needsVerify && (
          <button type="button" disabled={busy} onClick={() => onVerify(user.id)} style={verifyBtn}>
            Verify driver
          </button>
        )}
      </div>

      {open && (
        <div style={{ padding: "0 18px 18px", borderTop: "1px solid rgba(0,0,0,.08)", background: "#fafaf8" }}>
          <div className={styles.metaGrid} style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <MetaRow label="User ID" value={user.id} mono />
            <MetaRow label="Active" value={user.isActive ? "Yes" : "No"} />
            <MetaRow label="Joined" value={new Date(user.createdAt).toLocaleDateString()} />
            <MetaRow label="Last updated" value={new Date(user.updatedAt).toLocaleDateString()} />
          </div>

          {isCustomer && user.customerProfile && (
            <ProfileBlock title="Customer profile">
              <MetaRow label="Phone" value={user.customerProfile.phone ?? "—"} />
              <MetaRow label="Language" value={user.customerProfile.language ?? "en"} />
              <MetaRow label="Address" value={formatCustomerAddress(user.customerProfile.address)} wide />
            </ProfileBlock>
          )}

          {isMover && user.moverProfile && (
            <ProfileBlock title="Mover profile">
              <MetaRow label="Business" value={user.moverProfile.businessName} />
              <MetaRow label="Phone" value={user.moverProfile.phone ?? "—"} />
              <MetaRow label="Bio" value={user.moverProfile.bio ?? "—"} wide />
              <MetaRow label="Service areas" value={user.moverProfile.serviceAreas?.join(", ") || "—"} wide />
              <MetaRow label="Verified mover" value={user.moverProfile.isVerified ? "Yes" : "No"} />
              {user.moverProfile.documents?.length ? (
                <div style={{ marginTop: 10 }}>
                  <div style={{ font: "700 11px 'Hanken Grotesk'", color: "#8A8A90", marginBottom: 8 }}>DOCUMENTS</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {user.moverProfile.documents.map((doc) => (
                      <a key={`${doc.type}-${doc.url}`} href={doc.url} target="_blank" rel="noreferrer" style={{ font: "600 12px 'Hanken Grotesk'", color: "#0E0E10" }}>
                        📄 {doc.type}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </ProfileBlock>
          )}
        </div>
      )}
    </div>
  );
}

export function AdminDashboardPanel({
  analytics,
  pendingMovers,
  users,
  bookings,
  disputes,
}: {
  analytics: import("@/lib/api/types").AdminAnalytics;
  pendingMovers: number;
  users: User[];
  bookings: Booking[];
  disputes: Dispute[];
}) {
  const conversion =
    analytics.marketplace.requests > 0
      ? ((analytics.marketplace.bookings / analytics.marketplace.requests) * 100).toFixed(1)
      : "0";
  const commissionRate =
    analytics.revenue.totalRevenue > 0
      ? ((analytics.revenue.totalCommission / analytics.revenue.totalRevenue) * 100).toFixed(1)
      : "0";
  const openDisputes = disputes.filter((d) => d.status === "open");

  return (
    <div className={styles.dashboard} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {pendingMovers > 0 && (
        <div style={{ padding: "16px 18px", borderRadius: 14, background: "#fff7df", border: "1.5px solid #e8c96a", font: "600 14px 'Hanken Grotesk'" }}>
          ⚠ {pendingMovers} driver{pendingMovers === 1 ? "" : "s"} waiting for verification.
        </div>
      )}
      {openDisputes.length > 0 && (
        <div style={{ padding: "16px 18px", borderRadius: 14, background: "rgba(168,68,42,.08)", border: "1.5px solid rgba(168,68,42,.25)", font: "600 14px 'Hanken Grotesk'", color: "#a8442a" }}>
          {openDisputes.length} open dispute{openDisputes.length === 1 ? "" : "s"} need admin review.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        {[
          { label: "Total users", value: analytics.users.total, sub: `${analytics.users.customers} customers · ${analytics.users.movers} movers` },
          { label: "Bookings", value: analytics.marketplace.bookings, sub: `${analytics.marketplace.completedBookings} completed` },
          { label: "Revenue", value: `$${analytics.revenue.totalRevenue.toFixed(0)}`, sub: `$${analytics.revenue.totalCommission.toFixed(0)} platform fees` },
          { label: "Avg rating", value: `${analytics.quality.averageRating.toFixed(1)}★`, sub: `${analytics.quality.totalReviews} reviews` },
          { label: "Request → booking", value: `${conversion}%`, sub: `${analytics.marketplace.quotes} quotes sent` },
          { label: "Effective commission", value: `${commissionRate}%`, sub: "Of gross revenue" },
        ].map((c) => (
          <div key={c.label} style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,.1)", borderRadius: 16, padding: "18px 20px" }}>
            <div style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".08em", textTransform: "uppercase", color: "#8A8A90", marginBottom: 8 }}>{c.label}</div>
            <div style={{ font: "800 28px 'Archivo'", letterSpacing: "-.02em" }}>{c.value}</div>
            <div style={{ font: "500 13px 'Hanken Grotesk'", color: "#6B6B70", marginTop: 6 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.recentGrid} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Panel title="Recent bookings" items={bookings.slice(0, 5).map((b) => `${formatAddress(b.pickupAddress) ?? "Move"} · $${Number(b.price).toFixed(0)} · ${b.status}`)} empty="No bookings" />
        <Panel title="Recent disputes" items={disputes.slice(0, 5).map((d) => `${d.reason.slice(0, 60)}… · ${d.status}`)} empty="No disputes" />
      </div>

      <Panel title="Platform health" items={[`${users.filter((u) => u.isActive).length} active users`, `${bookings.filter((b) => b.status === "in_progress").length} live jobs`, `${analytics.quality.openDisputes} open disputes`]} empty="" />
    </div>
  );
}

function Panel({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,.1)", borderRadius: 16, padding: "18px 20px" }}>
      <div style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".08em", textTransform: "uppercase", color: "#8A8A90", marginBottom: 12 }}>{title}</div>
      {items.length === 0 ? (
        <div style={{ font: "600 14px 'Hanken Grotesk'", color: "#8A8A90" }}>{empty}</div>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 18, font: "600 14px 'Hanken Grotesk'", color: "#3a3a40", lineHeight: 1.7 }}>
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProfileBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 16, padding: 14, background: "#fff", borderRadius: 12, border: "1px solid rgba(0,0,0,.08)" }}>
      <div style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".08em", textTransform: "uppercase", color: "#8A8A90", marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

function MetaRow({ label, value, mono, wide }: { label: string; value: string; mono?: boolean; wide?: boolean }) {
  return (
    <div style={{ gridColumn: wide ? "1 / -1" : undefined }}>
      <div style={{ font: "700 10px 'Hanken Grotesk'", letterSpacing: ".06em", textTransform: "uppercase", color: "#9a9aa0" }}>{label}</div>
      <div style={{ font: mono ? "600 12px ui-monospace, monospace" : "600 14px 'Hanken Grotesk'", marginTop: 4, wordBreak: "break-all" }}>{value}</div>
    </div>
  );
}

function Badge({ text, tone = "neutral" }: { text: string; tone?: "neutral" | "ok" | "warn" }) {
  const bg = tone === "ok" ? "#e7f5ea" : tone === "warn" ? "#fff4df" : "#f0f0ec";
  const color = tone === "ok" ? "#1f6b1f" : tone === "warn" ? "#8a5a00" : "#3a3a40";
  return (
    <span style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".04em", textTransform: "uppercase", background: bg, color, padding: "4px 8px", borderRadius: 999 }}>
      {text}
    </span>
  );
}

function formatAddress(value?: Record<string, unknown> | null): string | null {
  if (!value) return null;
  if (typeof value.street === "string") return value.street;
  if (typeof value.formatted === "string") return value.formatted;
  return null;
}

function formatCustomerAddress(value?: Record<string, unknown> | null) {
  if (!value || typeof value !== "object") return "—";
  const parts = ["street", "city", "province", "postalCode"].map((k) => value[k]).filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

const verifyBtn: React.CSSProperties = {
  height: 40,
  padding: "0 16px",
  borderRadius: 10,
  border: "none",
  background: "var(--accent)",
  font: "800 13px 'Archivo'",
  color: "#0E0E10",
  cursor: "pointer",
  flex: "none",
};

const templateChip: React.CSSProperties = {
  height: 34,
  padding: "0 12px",
  borderRadius: 999,
  border: "1.5px solid rgba(0,0,0,.12)",
  background: "#fff",
  font: "600 12px 'Hanken Grotesk'",
  cursor: "pointer",
};
