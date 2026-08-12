"use client";

import { useEffect } from "react";
import RouteMap from "@/components/maps/RouteMap";
import { UserAvatar, StatusBadge } from "@/components/ui/AppUi";
import { useChat } from "@/hooks/useChat";
import { useRouteMetrics } from "@/hooks/useRouteMetrics";
import { messagesApi } from "@/lib/api";
import { ChatComposer } from "@/components/messaging/ChatComposer";
import { ChatMessageContent } from "@/components/messaging/ChatMessageContent";
import type { Message } from "@/lib/api/types";
import { formatDuration, placesFromBooking, type MapPlace } from "@/lib/maps";
import { isPlausibleNearbyKm } from "@/lib/trackingDisplay";
import type { Booking, BookingItem, MovingRequest } from "@/lib/api/types";
import { AppIcon } from "@/components/ui/Icons";

export function PartyProfileCard({
  name,
  imageUrl,
  roleLabel,
  subtitle,
  phone,
  meta,
  onMessage,
  messageDisabled,
  compact = false,
}: {
  name: string;
  imageUrl?: string | null;
  roleLabel: string;
  subtitle?: string | null;
  phone?: string | null;
  meta?: Array<{ label: string; value: string }>;
  onMessage?: () => void;
  messageDisabled?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        border: "1.5px solid rgba(0,0,0,.1)",
        borderRadius: compact ? 12 : 16,
        padding: compact ? 10 : 14,
      }}
    >
      <div style={{ display: "flex", gap: compact ? 10 : 13, alignItems: "flex-start" }}>
        <UserAvatar name={name} imageUrl={imageUrl} size={compact ? 36 : 56} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              font: compact ? "700 10px 'Hanken Grotesk'" : "700 11px 'Hanken Grotesk'",
              letterSpacing: ".08em",
              textTransform: "uppercase",
              color: "#8A8A90",
            }}
          >
            {roleLabel}
          </div>
          <b
            style={{
              font: compact ? "800 15px 'Archivo'" : "800 18px 'Archivo'",
              display: "block",
              marginTop: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {name}
          </b>
          {subtitle && (
            <div
              style={{
                font: compact ? "500 11px/1.35 'Hanken Grotesk'" : "600 13px 'Hanken Grotesk'",
                color: "#6B6B70",
                marginTop: 3,
                display: "-webkit-box",
                WebkitLineClamp: compact ? 1 : 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {subtitle}
            </div>
          )}
          {phone && !compact && <div style={{ font: "700 14px 'Hanken Grotesk'", marginTop: 6 }}>{phone}</div>}
        </div>
        {onMessage && (
          <button
            type="button"
            onClick={onMessage}
            disabled={messageDisabled}
            style={{
              width: compact ? 36 : 44,
              height: compact ? 36 : 44,
              borderRadius: compact ? 10 : 12,
              border: "1.5px solid rgba(0,0,0,.14)",
              background: "#fff",
              font: "700 16px 'Hanken Grotesk'",
              cursor: messageDisabled ? "not-allowed" : "pointer",
              opacity: messageDisabled ? 0.5 : 1,
              flex: "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label={`Message ${name}`}
          >
            <AppIcon name="mail" size={compact ? 16 : 18} />
          </button>
        )}
      </div>
      {meta && meta.length > 0 && !compact && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(0,0,0,.06)" }}>
          {meta.map((row) => (
            <div key={row.label}>
              <div style={{ font: "700 10px 'Hanken Grotesk'", letterSpacing: ".06em", textTransform: "uppercase", color: "#8A8A90" }}>{row.label}</div>
              <div style={{ font: "800 15px 'Archivo'", marginTop: 2 }}>{row.value}</div>
            </div>
          ))}
        </div>
      )}
      {meta && meta.length > 0 && compact && (
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          {meta.map((row) => (
            <span
              key={row.label}
              style={{
                padding: "4px 8px",
                borderRadius: 999,
                background: "rgba(0,0,0,.05)",
                font: "700 11px 'Hanken Grotesk'",
                color: "#3a3a40",
              }}
            >
              {row.label}: {row.value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function RouteStatsPanel({
  pickup,
  destination,
  driver,
  estimatedHours,
  dark = false,
  showDriver = true,
  driverLeg = "pickup",
}: {
  pickup?: MapPlace | null;
  destination?: MapPlace | null;
  driver?: MapPlace | null;
  estimatedHours?: number | null;
  dark?: boolean;
  showDriver?: boolean;
  /** Which stop the driver-distance row refers to. */
  driverLeg?: "pickup" | "dropoff";
}) {
  const { tripKm, tripMinutes, toPickupKm, toPickupMinutes, toDropoffKm, toDropoffMinutes, resolving } = useRouteMetrics(
    pickup,
    destination,
    driver,
  );
  const quoteMinutes = estimatedHours != null ? Math.round(estimatedHours * 60) : null;
  const driveMinutes = tripMinutes ?? quoteMinutes;

  const rawDriverKm = driverLeg === "dropoff" ? toDropoffKm : toPickupKm;
  const rawDriverMinutes = driverLeg === "dropoff" ? toDropoffMinutes : toPickupMinutes;
  const driverNearby = isPlausibleNearbyKm(rawDriverKm, tripKm);
  const driverKm = driverNearby ? rawDriverKm : null;
  const driverMinutes = driverNearby ? rawDriverMinutes : null;

  const shell: React.CSSProperties = dark
    ? { background: "#0E0E10", color: "#fff", borderRadius: 14, padding: "14px 16px" }
    : { background: "#fff", border: "1.5px solid rgba(0,0,0,.08)", borderRadius: 14, padding: "14px 16px" };

  const labelColor = dark ? "rgba(255,255,255,.55)" : "#8A8A90";
  const textColor = dark ? "#fff" : "#0E0E10";
  const subColor = dark ? "rgba(255,255,255,.7)" : "#6B6B70";
  const driverLabel = driverLeg === "dropoff" ? "Driver → drop-off" : "Driver → pickup";
  const etaLabel = driverLeg === "dropoff" ? "ETA to drop-off" : "ETA to pickup";

  return (
    <div style={shell}>
      <div style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".08em", textTransform: "uppercase", color: labelColor, marginBottom: 10 }}>
        Route overview
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
        <div style={{ font: "600 13px 'Hanken Grotesk'", color: subColor }}>
          <span style={{ color: "#1f6b1f", fontWeight: 800 }}>Pickup · </span>
          {pickup?.address || "Pickup location"}
        </div>
        <div style={{ font: "600 13px 'Hanken Grotesk'", color: subColor }}>
          <span style={{ color: "#a8442a", fontWeight: 800 }}>Drop-off · </span>
          {destination?.address || "Destination"}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <StatCell label="Trip distance" value={tripKm != null ? `${tripKm.toFixed(1)} km` : resolving ? "…" : "—"} labelColor={labelColor} valueColor={textColor} />
        <StatCell label="Est. drive time" value={formatDuration(driveMinutes) || (resolving ? "…" : "—")} labelColor={labelColor} valueColor={textColor} />
        {showDriver && (
          <>
            <StatCell
              label={driverLabel}
              value={
                driverKm != null
                  ? `${driverKm.toFixed(1)} km`
                  : showDriver
                    ? "Waiting for nearby GPS"
                    : "—"
              }
              labelColor={labelColor}
              valueColor={textColor}
            />
            <StatCell label={etaLabel} value={formatDuration(driverMinutes)} labelColor={labelColor} valueColor={textColor} />
          </>
        )}
      </div>
    </div>
  );
}

function StatCell({
  label,
  value,
  labelColor,
  valueColor,
}: {
  label: string;
  value: string;
  labelColor: string;
  valueColor: string;
}) {
  return (
    <div>
      <div style={{ font: "500 11px 'Hanken Grotesk'", color: labelColor }}>{label}</div>
      <div style={{ font: "800 16px 'Archivo'", color: valueColor, marginTop: 2 }}>{value}</div>
    </div>
  );
}

export function JobRouteMap({
  pickup,
  destination,
  driver,
  height = 320,
}: {
  pickup?: MapPlace | null;
  destination?: MapPlace | null;
  driver?: MapPlace | null;
  height?: number;
}) {
  const { pickup: pickupGeo, destination: destinationGeo } = useRouteMetrics(pickup ?? null, destination ?? null, driver ?? null);

  return (
    <div style={{ position: "relative", height, borderRadius: 14, overflow: "hidden", background: "#E7EAE3" }}>
      <RouteMap pickup={pickupGeo} destination={destinationGeo} driver={driver} showRoute />
    </div>
  );
}

export function DeliveryProofGallery({ photos }: { photos: BookingItem[] }) {
  if (!photos.length) {
    return (
      <div style={{ border: "1.5px dashed rgba(0,0,0,.14)", borderRadius: 14, padding: 16, background: "#FAFAF8" }}>
        <div style={{ font: "800 14px 'Archivo'", marginBottom: 6 }}>Delivery proof</div>
        <div style={{ font: "500 13px 'Hanken Grotesk'", color: "#6B6B70" }}>Waiting for your mover to upload completion photos.</div>
      </div>
    );
  }

  return (
    <div style={{ border: "1.5px solid rgba(0,0,0,.08)", borderRadius: 14, padding: 14, background: "#fff" }}>
      <div style={{ font: "800 14px 'Archivo'", marginBottom: 4 }}>Delivery proof</div>
      <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#6B6B70", marginBottom: 12 }}>Photos uploaded by your mover</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {photos.map((item) => (
          <div key={item.id} style={{ aspectRatio: "4/3", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(0,0,0,.08)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.photoUrl ?? undefined} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function VerifyDeliveryPanel({
  amount,
  photoCount,
  verified,
  onToggleVerified,
  onConfirm,
  busy,
  paid,
}: {
  amount: number;
  photoCount: number;
  verified: boolean;
  onToggleVerified: () => void;
  onConfirm: () => void;
  busy?: boolean;
  paid?: boolean;
}) {
  return (
    <div style={{ border: "1.5px solid rgba(0,0,0,.1)", borderRadius: 14, padding: 16, background: "#fff" }}>
      <div style={{ font: "800 15px 'Archivo'", marginBottom: 8 }}>Verify delivery & pay</div>
      <div style={{ font: "500 13px/1.45 'Hanken Grotesk'", color: "#6B6B70", marginBottom: 14 }}>
        Review the mover&apos;s proof photos. Once you confirm everything arrived safely, payment of <b>${amount.toFixed(0)}</b> is released.
      </div>
      {photoCount === 0 && (
        <div style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 10, background: "rgba(255,222,46,.2)", font: "600 12px 'Hanken Grotesk'" }}>
          No delivery photos yet — you can still verify if you received your items.
        </div>
      )}
      {paid ? (
        <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(31,107,31,.1)", color: "#1f6b1f", font: "700 14px 'Hanken Grotesk'" }}>
          Payment released · thank you!
        </div>
      ) : (
        <>
          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", marginBottom: 14 }}>
            <input type="checkbox" checked={verified} onChange={onToggleVerified} style={{ marginTop: 3, width: 18, height: 18 }} />
            <span style={{ font: "600 14px/1.4 'Hanken Grotesk'" }}>I confirm my items were delivered as agreed</span>
          </label>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!verified || busy}
            style={{
              width: "100%",
              height: 48,
              borderRadius: 12,
              border: "none",
              background: verified && !busy ? "var(--accent)" : "rgba(0,0,0,.1)",
              color: "#0E0E10",
              font: "800 15px 'Archivo'",
              cursor: verified && !busy ? "pointer" : "not-allowed",
            }}
          >
            {busy ? "Loading checkout…" : `Review invoice & pay $${amount.toFixed(0)}`}
          </button>
        </>
      )}
    </div>
  );
}

export function MessagePanel({
  bookingId,
  partnerName,
  myUserId,
  disabled = false,
  disabledHint = "Book first to unlock chat",
  compact = false,
  hideHeader = false,
  fillHeight = false,
}: {
  bookingId: string | null;
  partnerName: string;
  myUserId: string;
  disabled?: boolean;
  disabledHint?: string;
  compact?: boolean;
  hideHeader?: boolean;
  fillHeight?: boolean;
}) {
  const chat = useChat(bookingId);

  useEffect(() => {
    if (!bookingId || disabled) return;
    messagesApi.list(bookingId).then((msgs) => {
      chat.setInitialMessages(msgs);
      void messagesApi.markRead(bookingId);
    });
  }, [bookingId, disabled]);

  const onSent = (message: Message) => {
    const next = [...chat.messages.filter((m) => m.id !== message.id), message];
    chat.setInitialMessages(next);
  };

  return (
    <div
      style={{
        border: "1.5px solid rgba(0,0,0,.08)",
        borderRadius: 14,
        overflow: "hidden",
        background: "#fff",
        display: fillHeight ? "flex" : undefined,
        flexDirection: fillHeight ? "column" : undefined,
        flex: fillHeight ? 1 : undefined,
        minHeight: fillHeight ? 0 : undefined,
      }}
    >
      {!hideHeader && (
      <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(0,0,0,.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ font: "800 14px 'Archivo'" }}>Chat with {partnerName}</span>
        {disabled && <StatusBadge label="Locked" tone="waiting" />}
        {!disabled && bookingId && <StatusBadge label={chat.connected ? "Live" : "Connecting"} tone={chat.connected ? "success" : "waiting"} />}
      </div>
      )}
      <div style={{ minHeight: compact ? 80 : fillHeight ? 0 : 140, maxHeight: compact ? 160 : fillHeight ? undefined : 220, flex: fillHeight ? 1 : undefined, overflow: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        {disabled && <div style={{ font: "500 13px 'Hanken Grotesk'", color: "#6B6B70" }}>{disabledHint}</div>}
        {!disabled && chat.messages.length === 0 && (
          <div style={{ font: "500 13px 'Hanken Grotesk'", color: "#6B6B70" }}>Send a message to {partnerName}</div>
        )}
        {chat.messages.map((m, i) => (
          <div
            key={m.id ?? i}
            style={{
              alignSelf: m.senderId === myUserId ? "flex-end" : "flex-start",
              maxWidth: "80%",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div style={{ font: "700 11px 'Hanken Grotesk'", color: "#8A8A90", paddingLeft: m.senderId !== myUserId ? 4 : 0, paddingRight: m.senderId === myUserId ? 4 : 0, textAlign: m.senderId === myUserId ? "right" : "left" }}>
              {m.senderId === myUserId ? "You" : partnerName}
            </div>
            <div
              style={
                m.senderId !== myUserId
                  ? { background: "#F5F4EF", borderRadius: "14px 14px 14px 4px", padding: "10px 12px" }
                  : { background: "#0E0E10", color: "#fff", borderRadius: "14px 14px 4px 14px", padding: "10px 12px" }
              }
            >
              <ChatMessageContent message={m} dark={m.senderId === myUserId} />
            </div>
          </div>
        ))}
      </div>
      <ChatComposer
        bookingId={disabled ? null : bookingId}
        disabled={disabled}
        placeholder={disabled ? disabledHint : `Message ${partnerName}…`}
        onSent={onSent}
      />
    </div>
  );
}


export { customerDisplayName, moverDisplayName, partyDisplayName } from "@/lib/displayNames";

export function placesFromRequest(request: MovingRequest) {
  return {
    pickup: { address: request.pickupAddress },
    destination: { address: request.destinationAddress },
  };
}

export function placesFromBookingRecord(booking: Booking) {
  return placesFromBooking(booking);
}
