"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import RouteMap from "@/components/maps/RouteMap";
import DriverNavMap, { type DriverNavTelemetry } from "@/components/maps/DriverNavMap";
import { NegotiationPanel } from "@/components/NegotiationPanel";
import { BookingDisputeBanner } from "@/components/booking/BookingDisputeBanner";
import { DisputeThreadPanel } from "@/components/dispute/DisputeThreadPanel";
import {
  DriverListItem,
  DriverPanel,
  DriverPrimaryButton,
} from "@/components/driver/DriverDashboardShell";
import {
  DeliveryProofGallery,
  MessagePanel,
  PartyProfileCard,
  RouteStatsPanel,
  customerDisplayName,
  placesFromBookingRecord,
  placesFromRequest,
} from "@/components/move/JobPanels";
import { ActionTile, MoveSheet } from "@/components/move/MoveSheet";
import { DriverJobProgress, driverJobStageLabel } from "@/components/driver/DriverJobProgress";
import { driverStageAction, resolveDriverJobStage } from "@/lib/driverJobFlow";
import { EmptyState } from "@/components/ui/AppUi";
import { AppIcon, EmptyStateIcon } from "@/components/ui/Icons";
import { uploadsApi } from "@/lib/api";
import { useGeocodedPlace } from "@/hooks/useGeocodedPlace";
import type { Booking, MovingRequest, Quote } from "@/lib/api/types";
import { toLatLng, type MapPlace } from "@/lib/maps";
import { isPastPickupStage } from "@/lib/trackingDisplay";
import responsive from "./DriverResponsive.module.css";

type WorkItem =
  | { kind: "negotiation"; id: string; request: MovingRequest; quote: Quote }
  | { kind: "booking"; id: string; booking: Booking };

type DriverSheet = "chat" | "negotiate" | "proof" | "actions" | null;

function buildWorkItems(
  negotiationJobs: MovingRequest[],
  bookings: Booking[],
  myQuoteFor: (r: MovingRequest) => Quote | undefined,
  selectedId?: string | null,
): WorkItem[] {
  const bookedRequestIds = new Set(bookings.map((b) => b.requestId).filter(Boolean));
  const items: WorkItem[] = [];

  for (const booking of bookings) {
    if (booking.status === "confirmed" || booking.status === "in_progress") {
      items.push({ kind: "booking", id: booking.id, booking });
    } else if (booking.status === "cancelled" && selectedId && booking.id === selectedId) {
      items.push({ kind: "booking", id: booking.id, booking });
    }
  }

  for (const request of negotiationJobs) {
    if (bookedRequestIds.has(request.id)) continue;
    const quote = myQuoteFor(request);
    if (quote) items.push({ kind: "negotiation", id: request.id, request, quote });
  }

  const rank = (item: WorkItem) => {
    if (item.kind === "booking") {
      if (item.booking.status === "in_progress") return 0;
      if (item.booking.status === "confirmed") return 1;
      return 4;
    }
    return 2;
  };

  return items.sort((a, b) => rank(a) - rank(b));
}

export function DriverWorkPanel({
  negotiationJobs,
  bookings,
  selectedId,
  onSelect,
  myQuoteFor,
  negotiationBusyId,
  onSendCounter,
  onAcceptCounter,
  busyId,
  onStart,
  onAdvanceStage,
  onCancel,
  onUploadProof,
  onConfirmCash,
  driverPlace,
  driverTelemetry = null,
  myUserId,
}: {
  negotiationJobs: MovingRequest[];
  bookings: Booking[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  myQuoteFor: (r: MovingRequest) => Quote | undefined;
  negotiationBusyId: string | null;
  onSendCounter: (quote: Quote, price: number, notes?: string) => Promise<boolean>;
  onAcceptCounter: (quote: Quote) => Promise<void>;
  busyId: string | null;
  onStart: (id: string) => Promise<void>;
  onAdvanceStage: (bookingId: string, action: { trackingStatus: string; note: string }) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
  onUploadProof: (bookingId: string, photoUrl: string) => Promise<void>;
  onConfirmCash?: (bookingId: string) => Promise<void>;
  driverPlace: MapPlace | null;
  driverTelemetry?: DriverNavTelemetry | null;
  myUserId: string;
}) {
  const items = buildWorkItems(negotiationJobs, bookings, myQuoteFor, selectedId);
  const active = items.find((i) => i.id === selectedId) ?? items[0] ?? null;
  const [sheet, setSheet] = useState<DriverSheet>(null);
  const proofInputRef = useRef<HTMLInputElement>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [mobileSheetHeight, setMobileSheetHeight] = useState(30);
  const sheetDragStart = useRef({ y: 0, height: 30 });
  const sheetDragging = useRef(false);
  const workLayoutRef = useRef<HTMLDivElement | null>(null);
  const [isSheetDragging, setIsSheetDragging] = useState(false);
  const [navFullscreen, setNavFullscreen] = useState(false);
  const [navSuppressed, setNavSuppressed] = useState(false);
  const [fullMapOpen, setFullMapOpen] = useState(false);
  const [compactProgress, setCompactProgress] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 820px)");
    const sync = () => setCompactProgress(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const booking = active?.kind === "booking" ? active.booking : null;
  const negotiation = active?.kind === "negotiation" ? active : null;
  const customer = booking?.customer ?? negotiation?.request.customer;
  const customerName = customerDisplayName(customer);
  const places = booking
    ? placesFromBookingRecord(booking)
    : negotiation
      ? placesFromRequest(negotiation.request)
      : { pickup: null, destination: null };
  const pickupPlace = useGeocodedPlace(places.pickup);
  const destinationPlace = useGeocodedPlace(places.destination);
  const hasMapAddresses = Boolean(places.pickup?.address?.trim() && places.destination?.address?.trim());
  const proofPhotos = (booking?.items ?? []).filter((item) => item.photoUrl && item.name === "Delivery proof");
  const canMessage = booking && (booking.status === "confirmed" || booking.status === "in_progress");
  const liveDriverPlace =
    booking?.status === "in_progress" && driverPlace && toLatLng(driverPlace) ? driverPlace : null;
  const driverLeg = booking && isPastPickupStage(booking.trackingEvents ?? []) ? "dropoff" : "pickup";
  const currentStop = driverLeg === "dropoff" ? destinationPlace : pickupPlace;
  const isLiveNav = booking?.status === "in_progress" && hasMapAddresses;
  const showLiveNav = (isLiveNav && !navSuppressed) || fullMapOpen;
  const liveStage = booking ? resolveDriverJobStage(booking) : null;
  const liveAction = liveStage ? driverStageAction(liveStage) : null;
  const livePrimaryLabel =
    liveAction?.label ??
    (liveStage === "proof_required" || liveStage === "arrived_dropoff"
      ? "Upload delivery proof"
      : liveStage === "ready_to_complete"
        ? "Complete job"
        : undefined);

  const runLivePrimaryAction = () => {
    if (!booking) return;
    if (liveAction) {
      void onAdvanceStage(booking.id, liveAction);
      return;
    }
    if (liveStage === "proof_required" || liveStage === "arrived_dropoff") {
      setSheet("proof");
    }
  };

  useEffect(() => {
    if (!isLiveNav) {
      setNavFullscreen(false);
      setNavSuppressed(false);
      return;
    }
    const mobile = typeof window !== "undefined" && window.matchMedia("(max-width: 820px)").matches;
    if (mobile) setNavFullscreen(true);
  }, [isLiveNav, booking?.id]);

  useEffect(() => {
    setNavSuppressed(false);
    setFullMapOpen(false);
  }, [booking?.id]);

  const openFullMap = () => {
    setMobileSheetHeight(24);
    setNavFullscreen(true);
    if (isLiveNav) {
      setNavSuppressed(false);
    } else if (hasMapAddresses) {
      setFullMapOpen(true);
    }
  };

  const closeFullMap = () => {
    setNavSuppressed(true);
    setFullMapOpen(false);
  };

  const openNavigation = () => {
    const coords = toLatLng(currentStop);
    const destination = coords ? `${coords.lat},${coords.lng}` : currentStop?.address;
    if (!destination) return;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const applySheetHeight = (heightVh: number) => {
    const clamped = Math.min(72, Math.max(24, heightVh));
    const node = workLayoutRef.current;
    if (node) node.style.setProperty("--driver-sheet-height", `${clamped}%`);
    return clamped;
  };

  const snapSheetHeight = (heightVh: number) => {
    if (heightVh < 34) return 26;
    if (heightVh < 52) return 42;
    return 64;
  };

  const startSheetDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const pane = event.currentTarget.parentElement;
    const measured =
      pane && typeof window !== "undefined"
        ? Math.round((pane.getBoundingClientRect().height / window.innerHeight) * 100)
        : mobileSheetHeight;
    sheetDragStart.current = { y: event.clientY, height: Math.max(measured, 24) };
    sheetDragging.current = true;
    setIsSheetDragging(true);
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const resizeSheet = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!sheetDragging.current || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    event.preventDefault();
    event.stopPropagation();
    const deltaVh = ((sheetDragStart.current.y - event.clientY) / window.innerHeight) * 100;
    applySheetHeight(sheetDragStart.current.height + deltaVh);
  };

  const endSheetDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!sheetDragging.current) return;
    event.preventDefault();
    event.stopPropagation();
    sheetDragging.current = false;
    setIsSheetDragging(false);
    document.body.style.overflow = "";
    document.body.style.touchAction = "";
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const pane = event.currentTarget.parentElement;
    const measured =
      pane && typeof window !== "undefined"
        ? Math.round((pane.getBoundingClientRect().height / window.innerHeight) * 100)
        : mobileSheetHeight;
    const snapped = snapSheetHeight(measured);
    applySheetHeight(snapped);
    setMobileSheetHeight(snapped);
  };

  const toggleSheet = () => {
    setMobileSheetHeight((height) => {
      const next = height > 42 ? 26 : 58;
      applySheetHeight(next);
      return next;
    });
  };

  const handleProofFile = async (file: File) => {
    if (!booking || booking.status !== "in_progress") return;
    setUploadingProof(true);
    try {
      const uploaded = await uploadsApi.upload(file);
      await onUploadProof(booking.id, uploaded.url);
    } finally {
      setUploadingProof(false);
    }
  };

  if (!items.length) {
    return (
      <DriverPanel>
        <EmptyState
          icon={<EmptyStateIcon name="package" />}
          title="No active work"
          description="Send quotes on open jobs — negotiations and booked moves show up here in one place."
        />
      </DriverPanel>
    );
  }

  return (
    <div
      ref={workLayoutRef}
      className={`${responsive.workLayout} ${isSheetDragging ? responsive.workLayoutDragging : ""}`}
      style={{ "--driver-sheet-height": `${mobileSheetHeight}%` } as CSSProperties}
    >
      <div className={responsive.workList}>
        <div style={{ padding: "16px 16px 10px" }}>
          <div style={{ font: "800 17px 'Archivo'" }}>My jobs</div>
          <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#6B6B70", marginTop: 4 }}>
            {items.length} active · talks & moves together
          </div>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: "0 10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
          {items.map((item) => {
            const isNeg = item.kind === "negotiation";
            const title = isNeg ? customerDisplayName(item.request.customer) : customerDisplayName(item.booking.customer);
            const subtitle = isNeg
              ? `${item.request.pickupAddress} → ${item.request.destinationAddress}`
              : item.booking.status === "in_progress" || item.booking.status === "confirmed"
                ? driverJobStageLabel(item.booking) ?? item.booking.status.replace(/_/g, " ")
                : item.booking.status.replace(/_/g, " ");
            return (
              <DriverListItem
                key={item.id}
                selected={item.id === active?.id}
                onClick={() => onSelect(item.id)}
                title={title}
                subtitle={subtitle}
                price={isNeg ? `$${Number(item.quote.price).toFixed(0)}` : `$${Number(item.booking.price).toFixed(0)}`}
                avatarName={title}
                avatarUrl={isNeg ? item.request.customer?.customerProfile?.avatarUrl : item.booking.customer?.customerProfile?.avatarUrl}
                badge={
                  compactProgress
                    ? undefined
                    : isNeg
                      ? "Talk"
                      : item.booking.status === "in_progress"
                        ? driverJobStageLabel(item.booking) ?? "Live"
                        : item.booking.status === "confirmed"
                          ? "Ready"
                          : undefined
                }
              />
            );
          })}
        </div>
      </div>

      <div className={responsive.workDetails}>
        <button
          type="button"
          className={responsive.workSheetHandle}
          aria-label="Drag to resize job details"
          onPointerDown={startSheetDrag}
          onPointerMove={resizeSheet}
          onPointerUp={endSheetDrag}
          onPointerCancel={endSheetDrag}
          onLostPointerCapture={() => {
            sheetDragging.current = false;
            setIsSheetDragging(false);
            document.body.style.overflow = "";
            document.body.style.touchAction = "";
          }}
          onDoubleClick={toggleSheet}
        >
          <span />
        </button>
        <div className={responsive.workDetailsBody}>
          {active && (
          <>
            <PartyProfileCard
              name={customerName}
              imageUrl={customer?.customerProfile?.avatarUrl}
              roleLabel="Customer"
              compact={compactProgress}
              subtitle={
                negotiation
                  ? `Negotiating · ${new Date(negotiation.request.movingDate).toLocaleDateString()}`
                  : booking?.request
                    ? `${booking.request.pickupAddress} → ${booking.request.destinationAddress}`
                    : undefined
              }
              phone={compactProgress ? null : customer?.customerProfile?.phone}
              onMessage={() => setSheet("chat")}
              meta={
                compactProgress
                  ? [
                      {
                        label: "Pay",
                        value: `$${Number(negotiation?.quote.price ?? booking?.price ?? 0).toFixed(0)}`,
                      },
                      {
                        label: "Status",
                        value: negotiation
                          ? "Talk"
                          : booking
                            ? driverJobStageLabel(booking) ?? booking.status.replace(/_/g, " ")
                            : "—",
                      },
                    ]
                  : [
                      {
                        label: negotiation ? "Your offer" : "Job price",
                        value: `$${Number(negotiation?.quote.price ?? booking?.price ?? 0).toFixed(0)}`,
                      },
                      {
                        label: "Status",
                        value: negotiation
                          ? "Price talk"
                          : booking
                            ? driverJobStageLabel(booking) ?? booking.status.replace(/_/g, " ")
                            : "—",
                      },
                    ]
              }
            />

            {booking &&
              (booking.status === "confirmed" ||
                booking.status === "in_progress" ||
                (booking.status === "completed" &&
                  (booking.paymentMethod ?? "cash_on_site") === "cash_on_site" &&
                  !booking.payments?.some((p) => p.status === "completed" && Math.abs(Number(p.amount) - Number(booking.price)) < 1))) && (
              <div className={responsive.workProgress} style={{ marginTop: compactProgress ? 10 : 14 }}>
                <DriverJobProgress
                  booking={booking}
                  busy={busyId === booking.id}
                  proofCount={proofPhotos.length}
                  compact={compactProgress}
                  currentStopLabel={driverLeg === "dropoff" ? "Drop-off" : "Pickup"}
                  currentStopAddress={currentStop?.address}
                  onNavigate={currentStop?.address ? openNavigation : undefined}
                  onStart={() => void onStart(booking.id)}
                  onAdvance={(action) => void onAdvanceStage(booking.id, action)}
                  onOpenProof={() => setSheet("proof")}
                  onConfirmCash={onConfirmCash ? () => onConfirmCash(booking.id) : undefined}
                />
              </div>
            )}

            {booking && hasMapAddresses && !compactProgress && (
              <div className={responsive.workRouteStats} style={{ marginTop: 12 }}>
                <RouteStatsPanel
                  pickup={pickupPlace}
                  destination={destinationPlace}
                  driver={liveDriverPlace}
                  estimatedHours={booking.quote?.estimatedHours}
                  showDriver={booking.status === "in_progress"}
                  driverLeg={driverLeg}
                />
              </div>
            )}

            <div
              className={responsive.workQuickActions}
              style={{
                display: "grid",
                gridTemplateColumns: hasMapAddresses
                  ? booking?.status === "in_progress"
                    ? "repeat(4, 1fr)"
                    : "repeat(3, 1fr)"
                  : booking?.status === "in_progress"
                    ? "repeat(3, 1fr)"
                    : "repeat(2, 1fr)",
                gap: 8,
                marginTop: compactProgress ? 10 : 14,
              }}
            >
              {hasMapAddresses && (
                <ActionTile icon={<AppIcon name="map" size={16} />} label="Map" onClick={openFullMap} accent compact={compactProgress} />
              )}
              <ActionTile icon={<AppIcon name="messages" size={16} />} label="Chat" onClick={() => setSheet("chat")} compact={compactProgress} />
              {negotiation ? (
                <ActionTile icon={<AppIcon name="negotiate" size={16} />} label="Talk" onClick={() => setSheet("negotiate")} accent={!hasMapAddresses} compact={compactProgress} />
              ) : (
                <ActionTile icon={<AppIcon name="list" size={16} />} label="More" onClick={() => setSheet("actions")} accent={!hasMapAddresses && booking?.status === "in_progress"} compact={compactProgress} />
              )}
              {booking?.status === "in_progress" && (
                <ActionTile icon={<AppIcon name="camera" size={16} />} label="Proof" onClick={() => setSheet("proof")} badge={proofPhotos.length ? String(proofPhotos.length) : undefined} compact={compactProgress} />
              )}
            </div>
          </>
          )}
        </div>
      </div>

      <div className={responsive.workMap}>
        {hasMapAddresses ? (
          showLiveNav ? (
            <DriverNavMap
              pickup={pickupPlace}
              destination={destinationPlace}
              driver={liveDriverPlace ?? driverPlace}
              navigateTo={driverLeg === "dropoff" ? "dropoff" : "pickup"}
              telemetry={driverTelemetry}
              stopLabel={currentStop?.address}
              fullscreen={navFullscreen}
              onOpenExternalNav={openNavigation}
              onToggleFullscreen={() => setNavFullscreen((v) => !v)}
              onOpenDetails={() => setSheet("actions")}
              onMessage={() => setSheet("chat")}
              onClose={closeFullMap}
              primaryActionLabel={isLiveNav ? livePrimaryLabel : undefined}
              onPrimaryAction={isLiveNav && livePrimaryLabel ? runLivePrimaryAction : undefined}
              primaryActionBusy={busyId === booking?.id || uploadingProof}
            />
          ) : (
            <RouteMap
              pickup={pickupPlace}
              destination={destinationPlace}
              driver={liveDriverPlace}
              showRoute
              fallbackLabel="Loading map…"
            />
          )
        ) : (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", font: "600 13px 'Hanken Grotesk'", color: "#6B6B70" }}>
            Add pickup & drop-off to see the route
          </div>
        )}
        {!showLiveNav && hasMapAddresses && (
          <div
            className={responsive.workMapPill}
            style={{
              position: "absolute",
              bottom: 16,
              left: 12,
              display: "flex",
              gap: 8,
              zIndex: 2,
            }}
          >
            <button
              type="button"
              onClick={openFullMap}
              style={{
                border: 0,
                borderRadius: 999,
                padding: "8px 12px",
                background: "#0E0E10",
                color: "var(--accent)",
                font: "800 11px 'Archivo'",
                cursor: "pointer",
              }}
            >
              {isLiveNav ? "Open full map" : "Full map"}
            </button>
          </div>
        )}
      </div>

      <MoveSheet title="Messages" open={sheet === "chat"} onClose={() => setSheet(null)}>
        <MessagePanel
          bookingId={canMessage ? booking?.id ?? null : null}
          partnerName={customerName}
          myUserId={myUserId}
          disabled={!canMessage && !negotiation}
          disabledHint={negotiation ? "Messaging unlocks after the customer books your price." : "Start the job to unlock chat."}
          fillHeight
        />
      </MoveSheet>

      {negotiation && (
        <MoveSheet title="Negotiate price" open={sheet === "negotiate"} onClose={() => setSheet(null)} width={520}>
          <RouteStatsPanel pickup={pickupPlace} destination={destinationPlace} driver={driverPlace} estimatedHours={negotiation.quote.estimatedHours} />
          <div style={{ marginTop: 14 }}>
            <NegotiationPanel
              role="mover"
              partnerLabel={customerName}
              quote={negotiation.quote}
              estimatedPrice={negotiation.request.estimatedPrice != null ? Number(negotiation.request.estimatedPrice) : null}
              embedded
              busy={negotiationBusyId === negotiation.quote.id}
              onSendCounter={(price, notes) => onSendCounter(negotiation.quote, price, notes)}
              onAccept={() => onAcceptCounter(negotiation.quote)}
            />
          </div>
        </MoveSheet>
      )}

      {booking && (
        <>
          <MoveSheet title="Delivery proof" open={sheet === "proof"} onClose={() => setSheet(null)}>
            <DeliveryProofGallery photos={proofPhotos} />
            {booking.status === "in_progress" && (
              <div style={{ marginTop: 14 }}>
                <DriverPrimaryButton variant="ghost" disabled={uploadingProof || busyId === booking.id} onClick={() => proofInputRef.current?.click()}>
                  {uploadingProof ? "Uploading…" : "+ Add photo"}
                </DriverPrimaryButton>
                <input ref={proofInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const file = e.target.files?.[0]; if (file) void handleProofFile(file); e.target.value = ""; }} />
              </div>
            )}
          </MoveSheet>

          <MoveSheet title="Job actions" open={sheet === "actions"} onClose={() => setSheet(null)}>
            <RouteStatsPanel
              pickup={pickupPlace}
              destination={destinationPlace}
              driver={liveDriverPlace}
              estimatedHours={booking.quote?.estimatedHours}
              showDriver={booking.status === "in_progress"}
              driverLeg={driverLeg}
            />
            {(booking.disputes ?? []).length > 0 && (
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                <BookingDisputeBanner disputes={booking.disputes} />
                <DisputeThreadPanel bookingId={booking.id} myUserId={myUserId} compact />
              </div>
            )}
            {(booking.status === "confirmed" || booking.status === "in_progress") && (
              <div style={{ marginTop: 16 }}>
                <DriverPrimaryButton variant="ghost" fullWidth disabled={busyId === booking.id} onClick={() => void onCancel(booking.id)}>
                  Cancel booking
                </DriverPrimaryButton>
              </div>
            )}
          </MoveSheet>
        </>
      )}
    </div>
  );
}
