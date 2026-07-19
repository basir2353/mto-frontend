"use client";

import { useEffect, useState } from "react";
import { bookingsApi, vehiclesApi } from "@/lib/api";
import type { Booking, BookingItem, VehicleType } from "@/lib/api/types";
import { BookingDisputeBanner } from "@/components/booking/BookingDisputeBanner";
import { DisputeThreadPanel } from "@/components/dispute/DisputeThreadPanel";
function formatAddr(value?: Record<string, unknown> | null, fallback?: string | null) {
  if (value && typeof value.street === "string") return value.street;
  if (value && typeof value.formatted === "string") return value.formatted;
  return fallback ?? "—";
}

function asCoord(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function BookingInsightsPanel({
  booking,
  myUserId,
}: {
  booking: Booking;
  myUserId?: string;
}) {
  const [items, setItems] = useState<BookingItem[]>(booking.items ?? []);
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat?: number; lng?: number } | null>(null);
  const [vehicle, setVehicle] = useState<VehicleType | null>(null);

  useEffect(() => {
    void bookingsApi.getItems(booking.id).then(setItems).catch(() => setItems(booking.items ?? []));
    void bookingsApi
      .getStatus(booking.id)
      .then((s) => setLiveStatus(s.status))
      .catch(() => setLiveStatus(booking.status));
    void bookingsApi
      .getLocation(booking.id)
      .then((loc) =>
        setCoords({
          lat: asCoord(loc.latitude),
          lng: asCoord(loc.longitude),
        }),
      )
      .catch(() => null);
    if (booking.vehicleTypeId) {
      void vehiclesApi.getType(booking.vehicleTypeId).then(setVehicle).catch(() => setVehicle(null));
    }
  }, [booking.id, booking.status, booking.items, booking.vehicleTypeId]);
  const breakdown =
    booking.pricingBreakdown && Object.keys(booking.pricingBreakdown).length
      ? Object.entries(booking.pricingBreakdown).filter(([, v]) => typeof v === "number" || typeof v === "string")
      : [];

  const moveItems = items.filter((i) => i.name !== "Delivery proof");
  const proofItems = items.filter((i) => i.name === "Delivery proof" && i.photoUrl);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <BookingDisputeBanner disputes={booking.disputes} />

      {(booking.disputes ?? []).length > 0 && myUserId && (
        <Section title="Dispute room">
          <DisputeThreadPanel bookingId={booking.id} myUserId={myUserId} compact />
        </Section>
      )}

      <Section title="Live snapshot">
        <Grid>
          <Cell label="Status" value={(liveStatus ?? booking.status).replace(/_/g, " ")} />
          <Cell label="Scheduled" value={new Date(booking.scheduledDate).toLocaleString()} />
          <Cell label="Quoted price" value={`$${Number(booking.price).toFixed(2)}`} />
          <Cell
            label="Estimated"
            value={booking.estimatedPrice != null ? `$${Number(booking.estimatedPrice).toFixed(2)}` : "—"}
          />
          <Cell label="Booking ID" value={booking.id.slice(0, 12) + "…"} mono />
          {booking.requestId && <Cell label="Request ID" value={booking.requestId.slice(0, 12) + "…"} mono />}
          {coords?.lat != null && coords.lng != null && (
            <Cell label="Last GPS" value={`${Number(coords.lat).toFixed(4)}, ${Number(coords.lng).toFixed(4)}`} wide />
          )}
          {booking.cancellationReason && <Cell label="Cancel reason" value={booking.cancellationReason} wide />}
        </Grid>
      </Section>

      {booking.mover && (
        <Section title="Assigned mover">
          <Grid>
            <Cell label="Business" value={booking.mover.moverProfile?.businessName ?? booking.mover.email ?? "—"} />
            <Cell label="Phone" value={booking.mover.moverProfile?.phone ?? "—"} />
            {booking.mover.moverProfile?.bio && <Cell label="About" value={booking.mover.moverProfile.bio} wide />}
          </Grid>
        </Section>
      )}

      {vehicle && (
        <Section title="Vehicle">
          <Grid>
            <Cell label="Type" value={vehicle.name} />
            <Cell label="Base rate" value={`$${Number(vehicle.basePrice).toFixed(0)} + $${Number(vehicle.pricePerKm).toFixed(2)}/km`} />
            {vehicle.maxWeightKg != null && <Cell label="Max load" value={`${vehicle.maxWeightKg} kg`} />}
            {vehicle.maxVolumeM3 != null && <Cell label="Max volume" value={`${vehicle.maxVolumeM3} m³`} />}
          </Grid>
        </Section>
      )}
      <Section title="Route">
        <Grid>
          <Cell label="Pickup" value={formatAddr(booking.pickupAddress, booking.request?.pickupAddress)} wide />
          <Cell label="Destination" value={formatAddr(booking.destinationAddress, booking.request?.destinationAddress)} wide />
        </Grid>
      </Section>

      {breakdown.length > 0 && (
        <Section title="Pricing breakdown">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {breakdown.map(([key, val]) => (
              <div key={key} style={{ display: "flex", justifyContent: "space-between", font: "600 14px 'Hanken Grotesk'" }}>
                <span style={{ color: "#6B6B70" }}>{key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}</span>
                <b>{typeof val === "number" ? `$${val.toFixed(2)}` : String(val)}</b>
              </div>
            ))}
          </div>
        </Section>
      )}

      {moveItems.length > 0 && (
        <Section title={`Items (${moveItems.length})`}>
          {moveItems.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                padding: "10px 12px",
                background: "#fafaf8",
                borderRadius: 10,
                marginBottom: 6,
                font: "600 14px 'Hanken Grotesk'",
              }}
            >
              <div>
                <span>{item.name}</span>
                {item.description && (
                  <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8A8A90", marginTop: 2 }}>{item.description}</div>
                )}
              </div>
              <span style={{ color: "#6B6B70", flex: "none", marginLeft: 12 }}>
                ×{item.quantity ?? 1}
                {item.weightKg != null && ` · ${item.weightKg}kg`}
              </span>
            </div>
          ))}
        </Section>
      )}
      {proofItems.length > 0 && (
        <Section title="Delivery proof">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {proofItems.map((p) =>
              p.photoUrl ? (
                <a key={p.id} href={p.photoUrl} target="_blank" rel="noreferrer">
                  <img src={p.photoUrl} alt="Proof" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10, border: "1px solid rgba(0,0,0,.1)" }} />
                </a>
              ) : null,
            )}
          </div>
        </Section>
      )}

      {(booking.payments ?? []).length > 0 && (
        <Section title="Payments">
          {(booking.payments ?? []).map((p) => (
            <div
              key={p.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 4,
                padding: "10px 12px",
                background: "#fafaf8",
                borderRadius: 10,
                marginBottom: 6,
                font: "600 13px 'Hanken Grotesk'",
              }}
            >
              <div>
                <b>{p.kind === "tip" ? "Tip" : "Job payment"}</b>
                <div style={{ color: "#6B6B70", fontSize: 12, marginTop: 2 }}>
                  {p.status} · {p.invoiceNumber ?? p.id.slice(0, 8)}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <b>${Number(p.amount).toFixed(2)}</b>
                {p.platformCommission > 0 && (
                  <div style={{ color: "#8a5a00", fontSize: 11 }}>Fee ${Number(p.platformCommission).toFixed(2)}</div>
                )}
              </div>
            </div>
          ))}
        </Section>
      )}

      {booking.notes && (
        <Section title="Notes">
          <p style={{ margin: 0, font: "500 14px 'Hanken Grotesk'", color: "#3a3a40", lineHeight: 1.5 }}>{booking.notes}</p>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: "1.5px solid rgba(0,0,0,.08)", borderRadius: 12, padding: "14px 16px", background: "#fff" }}>
      <div style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".08em", textTransform: "uppercase", color: "#8A8A90", marginBottom: 10 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>;
}

function Cell({ label, value, wide, mono }: { label: string; value: string; wide?: boolean; mono?: boolean }) {
  return (
    <div style={{ gridColumn: wide ? "1 / -1" : undefined }}>
      <div style={{ font: "700 10px 'Hanken Grotesk'", letterSpacing: ".06em", textTransform: "uppercase", color: "#9a9aa0" }}>{label}</div>
      <div style={{ font: mono ? "600 13px ui-monospace, monospace" : "600 14px 'Hanken Grotesk'", marginTop: 4 }}>{value}</div>
    </div>
  );
}