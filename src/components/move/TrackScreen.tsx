"use client";

import { useEffect, useState } from "react";
import RouteMap from "@/components/maps/RouteMap";
import { AppIcon } from "@/components/ui/Icons";
import { MoverAvatar } from "@/components/ui/AppUi";
import {
  DeliveryProofGallery,
  MessagePanel,
  moverDisplayName,
} from "@/components/move/JobPanels";
import { MoveSheet } from "@/components/move/MoveSheet";
import { BookingManageActions } from "@/components/booking/BookingManageActions";
import { useAuth } from "@/contexts/AuthContext";
import { useMoveFlow } from "@/contexts/MoveFlowContext";
import { useGeocodedPlace } from "@/hooks/useGeocodedPlace";
import { useRouteMetrics } from "@/hooks/useRouteMetrics";
import type { BookingTracking } from "@/lib/api";
import { isBookingJobPaid, isTrackableBooking } from "@/lib/bookingFlow";
import { toLatLng, placesFromBooking, haversineKm } from "@/lib/maps";
import { filterTimelineTrackingEvents, isPlausibleNearbyKm } from "@/lib/trackingDisplay";
import { MapPill, WizardShell } from "@/components/move/WizardChrome";

type StageDef = { title: string; pattern?: RegExp; estimateOffsetMin: number };

const STAGES: StageDef[] = [
  { title: "Booking confirmed", estimateOffsetMin: 0 },
  { title: "Heading to pickup", pattern: /head.*pickup|to pickup|en_route|on the way(?!.*drop)/i, estimateOffsetMin: 5 },
  { title: "Loading your items", pattern: /load|at pickup|arrived.*pickup/i, estimateOffsetMin: 20 },
  { title: "In transit", pattern: /transit|to drop|en route to dest|departed/i, estimateOffsetMin: 45 },
  {
    title: "Arrived at destination",
    pattern: /arriv(ed)? (at )?(destination|drop)|at destination|at drop-?off|drop.?off complete/i,
    estimateOffsetMin: 65,
  },
  { title: "Move complete", pattern: /complete|delivered|job.?done/i, estimateOffsetMin: 100 },
];

/** Hide nonsense ETAs (bad GPS / intercontinental coords). */
function formatEtaMinutes(minutes: number | null): string | null {
  if (minutes == null || !Number.isFinite(minutes)) return null;
  if (minutes > 240) return null;
  return String(minutes);
}

function baseTime(booking: { scheduledDate?: string | null; createdAt?: string | null }): Date {
  const raw = booking.scheduledDate ?? booking.createdAt;
  const d = raw ? new Date(raw) : new Date();
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export function TrackScreen({
  onRate,
  onHistory,
  onWallet,
  onNewMove,
}: {
  onRate: () => void;
  onHistory: () => void;
  onWallet?: () => void;
  onNewMove?: () => void;
}) {
  const { user } = useAuth();
  const flow = useMoveFlow();
  const booking = flow.activeBooking;

  const [sheet, setSheet] = useState<"chat" | "manage" | null>(null);
  const [tracking, setTracking] = useState<BookingTracking | null>(null);
  const paid = isBookingJobPaid(booking);
  const paymentMethod = booking?.paymentMethod ?? "cash_on_site";
  const isWalletPay = paymentMethod === "wallet";

  useEffect(() => {
    // Reset transient panels when switching to another booking.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSheet(null);
  }, [booking?.id]);

  useEffect(() => {
    if (!booking?.id) return;
    const load = async () => {
      const [trackData] = await Promise.all([flow.loadTracking(booking.id), flow.loadBooking(booking.id)]);
      if (trackData) setTracking(trackData);
    };
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [booking?.id]);

  const bookingPlaces = placesFromBooking(booking);
  const pickupPlace = useGeocodedPlace(bookingPlaces.pickup);
  const destinationPlace = useGeocodedPlace(bookingPlaces.destination);

  const moverLabel = tracking?.mover?.businessName ?? moverDisplayName(booking?.mover) ?? "Your mover";
  const moverAvatar = tracking?.mover?.avatarUrl ?? booking?.mover?.moverProfile?.avatarUrl;
  const moverPhone = tracking?.mover?.phone ?? booking?.mover?.moverProfile?.phone;
  const bookingStatus = tracking?.status ?? booking?.status ?? "confirmed";
  const events = filterTimelineTrackingEvents(tracking?.events ?? []);
  const isLive = bookingStatus === "in_progress";
  const isCompleted = bookingStatus === "completed";
  const proofPhotos = (booking?.items ?? []).filter((item) => item.photoUrl && item.name === "Delivery proof");

  const driverCoords =
    tracking?.currentLocation?.latitude != null && tracking?.currentLocation?.longitude != null
      ? { lat: Number(tracking.currentLocation.latitude), lng: Number(tracking.currentLocation.longitude) }
      : null;
  const tripKmApprox = haversineKm(pickupPlace, destinationPlace);
  const driverToPickupKm =
    driverCoords && toLatLng(pickupPlace) ? haversineKm({ address: "", ...driverCoords }, pickupPlace) : null;
  const driverNearby = isPlausibleNearbyKm(driverToPickupKm, tripKmApprox);
  const driverPlace =
    !isCompleted && driverCoords && driverNearby ? { address: moverLabel, lat: driverCoords.lat, lng: driverCoords.lng } : null;

  const { toPickupMinutes, toDropoffMinutes } = useRouteMetrics(pickupPlace, destinationPlace, driverPlace);
  const etaToPickup = formatEtaMinutes(toPickupMinutes);
  const etaToDropoff = formatEtaMinutes(toDropoffMinutes);

  let reachedIndex = 0;
  for (const ev of events) {
    for (let i = STAGES.length - 1; i >= 1; i--) {
      const pattern = STAGES[i].pattern;
      if (pattern && pattern.test(ev.status ?? "")) {
        reachedIndex = Math.max(reachedIndex, i);
        break;
      }
    }
  }
  if (isCompleted) reachedIndex = STAGES.length - 1;
  else if (isLive) reachedIndex = Math.max(reachedIndex, 1);
  const currentIndex = reachedIndex;
  const arrivedAtDestination = currentIndex >= 4;

  const eventTimeForStage = (index: number): string | null => {
    if (index === 0) return booking?.createdAt ?? null;
    for (let i = events.length - 1; i >= 0; i--) {
      const pattern = STAGES[index].pattern;
      if (pattern && pattern.test(events[i].status ?? "")) return events[i].createdAt;
    }
    return null;
  };

  const headline = isCompleted
    ? "Move complete"
    : arrivedAtDestination
      ? "Arrived at destination"
      : currentIndex >= 1 && currentIndex < 3 && etaToPickup != null
        ? `Arriving in ${etaToPickup} min`
        : currentIndex >= 3 && etaToDropoff != null
          ? `Arriving in ${etaToDropoff} min`
          : STAGES[currentIndex]?.title ?? "Tracking your move";

  const mapEtaLabel =
    !isCompleted && !arrivedAtDestination
      ? currentIndex < 3
        ? etaToPickup
        : etaToDropoff
      : null;

  if (!booking) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#F5F4EF" }}>
        <p style={{ font: "600 15px var(--font-hanken)", color: "#6B6B70" }}>Loading your move…</p>
      </div>
    );
  }

  const mapHasRoute = Boolean(toLatLng(pickupPlace) && toLatLng(destinationPlace));
  const amountLabel = `$${Number(booking.price).toFixed(0)}`;

  return (
    <WizardShell
      mobileSheetSize="standard"
      left={
        <div style={{ flex: 1, overflow: "auto", padding: "26px 28px 22px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              background: isLive ? "#0E0E10" : isCompleted ? "#1f6b1f" : "var(--accent)",
              color: isLive || isCompleted ? "#fff" : "#0E0E10",
              padding: "6px 12px",
              borderRadius: 999,
              font: "800 11px 'Hanken Grotesk'",
              letterSpacing: ".04em",
              marginBottom: 12,
            }}
          >
            ● {bookingStatus.toUpperCase().replace(/_/g, " ")}
          </div>
          <h2 style={{ margin: "0 0 18px", font: "800 26px 'Archivo'", letterSpacing: "-.02em" }}>{headline}</h2>

          <div className="track-mover-card" style={{ border: "1.5px solid rgba(0,0,0,.1)", borderRadius: 16, padding: 14, marginBottom: 22, display: "flex", alignItems: "center", gap: 12 }}>
            <MoverAvatar name={moverLabel} imageUrl={moverAvatar} size={48} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <b style={{ font: "800 15px 'Archivo'" }}>{moverLabel}</b>
              <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#6B6B70" }}>{moverPhone ?? "MoveThisOut mover"}</div>
            </div>
            {moverPhone && (
              <a
                href={`tel:${moverPhone}`}
                aria-label={`Call ${moverLabel}`}
                style={{ width: 40, height: 40, borderRadius: 10, border: "1.5px solid rgba(0,0,0,.14)", display: "flex", alignItems: "center", justifyContent: "center", color: "#0E0E10" }}
              >
                <AppIcon name="phone" size={17} />
              </a>
            )}
            <button
              type="button"
              onClick={() => setSheet("chat")}
              aria-label={`Message ${moverLabel}`}
              style={{ width: 40, height: 40, borderRadius: 10, border: "1.5px solid rgba(0,0,0,.14)", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <AppIcon name="mail" size={17} />
            </button>
          </div>

          <div style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".09em", textTransform: "uppercase", color: "#8A8A90", marginBottom: 14 }}>
            Job progress
          </div>
          {STAGES.map((stage, i) => {
            const state = i < currentIndex || (isCompleted && i === currentIndex) ? "done" : i === currentIndex ? "active" : "idle";
            const doneTime = eventTimeForStage(i);
            const estTime = new Date(baseTime(booking).getTime() + stage.estimateOffsetMin * 60000);
            const sub =
              state === "done" && doneTime
                ? new Date(doneTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
                : state === "active"
                  ? "Now"
                  : `Est. ${estTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
            return <StageRow key={stage.title} title={stage.title} sub={sub} state={state} last={i === STAGES.length - 1} />;
          })}

          {isCompleted && !paid && isWalletPay && (
            <div
              onClick={() => onWallet?.()}
              style={{ marginTop: 20, padding: "14px 16px", borderRadius: 12, background: "rgba(31,107,31,.08)", cursor: onWallet ? "pointer" : "default" }}
            >
              <div style={{ font: "700 14px 'Hanken Grotesk'", color: "#1f6b1f", marginBottom: 2 }}>Delivery complete</div>
              <div style={{ font: "600 13px 'Hanken Grotesk'", color: "#1f6b1f" }}>
                Pay {amountLabel} from your wallet →
              </div>
            </div>
          )}
          {isCompleted && !paid && !isWalletPay && (
            <div style={{ marginTop: 20, padding: "14px 16px", borderRadius: 12, background: "rgba(14,14,16,.06)" }}>
              <div style={{ font: "700 14px 'Hanken Grotesk'", marginBottom: 2 }}>Waiting for cash confirmation</div>
              <div style={{ font: "600 13px 'Hanken Grotesk'", color: "#6B6B70" }}>
                Pay {moverLabel} {amountLabel} in cash. Your mover will confirm receipt in their app.
              </div>
            </div>
          )}
          {isCompleted && paid && (
            <div
              onClick={onRate}
              style={{ marginTop: 20, padding: "14px 16px", borderRadius: 12, background: "rgba(31,107,31,.08)", cursor: "pointer" }}
            >
              <div style={{ font: "700 14px 'Hanken Grotesk'", color: "#1f6b1f", marginBottom: 2 }}>
                {isWalletPay ? "Wallet payment confirmed" : "Cash payment confirmed"}
              </div>
              <div style={{ font: "600 13px 'Hanken Grotesk'", color: "#1f6b1f" }}>Rate your mover →</div>
            </div>
          )}

          {proofPhotos.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <DeliveryProofGallery photos={proofPhotos} />
            </div>
          )}

          <button
            type="button"
            onClick={() => setSheet("manage")}
            style={{ marginTop: 20, height: 44, width: "100%", borderRadius: 12, border: "1.5px solid rgba(0,0,0,.14)", background: "#fff", font: "700 13px var(--font-hanken)", cursor: "pointer" }}
          >
            Manage move
          </button>

          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button
              type="button"
              onClick={onHistory}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 12,
                border: "1.5px solid rgba(0,0,0,.14)",
                background: "#fff",
                font: "700 13px var(--font-hanken)",
                cursor: "pointer",
              }}
            >
              ← History
            </button>
            {onNewMove ? (
              <button
                type="button"
                onClick={onNewMove}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 12,
                  border: "none",
                  background: "#0E0E10",
                  color: "#fff",
                  font: "700 13px var(--font-hanken)",
                  cursor: "pointer",
                }}
              >
                New move
              </button>
            ) : null}
          </div>
        </div>
      }
      right={
        <>
          {mapHasRoute ? (
            <RouteMap pickup={pickupPlace} destination={destinationPlace} driver={driverPlace} showRoute />
          ) : (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", font: "600 14px var(--font-hanken)", color: "#6B6B70" }}>
              Map loads when pickup &amp; dropoff are set
            </div>
          )}
          {mapEtaLabel != null ? (
            <MapPill position="top-left">Arriving in {mapEtaLabel} min</MapPill>
          ) : arrivedAtDestination && !isCompleted ? (
            <MapPill position="top-left">At destination</MapPill>
          ) : null}
          <div style={{ position: "absolute", bottom: 24, left: 24, background: "#fff", borderRadius: 14, padding: "12px 16px", font: "600 13px var(--font-hanken)", boxShadow: "0 10px 26px rgba(0,0,0,.14)", zIndex: 2 }}>
            {moverLabel} · <b style={{ font: "800 13px var(--font-archivo)" }}>{driverPlace ? "live GPS" : "waiting for GPS"}</b>
          </div>
        </>
      }
    >
      <style>{`
        @media(max-width:420px){
          .track-mover-card{padding:12px!important;gap:8px!important}
          .track-mover-card>div:nth-child(2){width:calc(100% - 152px)}
          .track-mover-card a,.track-mover-card button{width:36px!important;height:36px!important}
        }
      `}</style>
      <MoveSheet title="Messages" open={sheet === "chat"} onClose={() => setSheet(null)}>
        <MessagePanel bookingId={booking.id} partnerName={moverLabel} myUserId={user?.id ?? ""} fillHeight />
      </MoveSheet>

      <MoveSheet title="Manage move" open={sheet === "manage"} onClose={() => setSheet(null)}>
        <BookingManageActions
          bookingId={booking.id}
          status={bookingStatus}
          canDispute={isCompleted}
          onCancel={async (reason) => {
            await flow.cancelBooking(booking.id, reason);
            setSheet(null);
            onHistory();
          }}
          onDispute={async (reason) => {
            await flow.createDispute(booking.id, reason);
          }}
          onReschedule={async (date) => {
            await flow.rescheduleBooking(booking.id, date);
          }}
          onShare={(expiresInHours) => flow.shareBooking(booking.id, expiresInHours)}
          onDone={() => {
            setSheet(null);
            if (isTrackableBooking(booking)) return;
            onHistory();
          }}
        />
      </MoveSheet>
    </WizardShell>
  );
}

function StageRow({
  title,
  sub,
  state,
  last,
}: {
  title: string;
  sub: string;
  state: "done" | "active" | "idle";
  last: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: last ? 0 : 10 }}>
      <div style={{ width: 18, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: state === "done" ? "#1f6b1f" : state === "active" ? "var(--accent)" : "rgba(0,0,0,.15)",
            border: state === "active" ? "2px solid #0E0E10" : "none",
          }}
        />
        {!last && <div style={{ flex: 1, width: 2, background: state === "done" ? "#1f6b1f" : "rgba(0,0,0,.1)", marginTop: 4 }} />}
      </div>
      <div style={{ paddingBottom: last ? 0 : 8 }}>
        <div style={{ font: state === "idle" ? "600 14px 'Hanken Grotesk'" : "800 14px 'Archivo'", color: state === "idle" ? "#8A8A90" : "#0E0E10" }}>
          {title}
        </div>
        <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8A8A90" }}>{sub}</div>
      </div>
    </div>
  );
}
