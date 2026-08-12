"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { formatMoveDate } from "@/components/DatePicker";
import { PlanScreen } from "@/components/move/PlanScreen";
import { DetailsScreen } from "@/components/move/DetailsScreen";
import { QuotesScreen } from "@/components/move/QuotesScreen";
import { BookScreen } from "@/components/move/BookScreen";
import { TrackScreen } from "@/components/move/TrackScreen";
import { BookingMapOverlayProvider, WizardHeader, type WizardStepId } from "@/components/move/WizardChrome";
import { MoveStatusBoxes, draftRouteLabel, type StatusBoxItem } from "@/components/move/MoveStatusBoxes";
import { formatMoveRoute } from "@/components/move/MovesSwitcher";
import { CustomerAppShell, type CustomerNavId } from "@/components/customer/CustomerAppShell";
import {
  FormCtx,
  type FormState,
  type Photo,
  type WhenChoice,
} from "@/contexts/MoveFormContext";
import { MoveFlowProvider, useMoveFlow } from "@/contexts/MoveFlowContext";
import { useAuth } from "@/contexts/AuthContext";
import { customerDisplayName } from "@/lib/displayNames";
import { computeMoveEstimate } from "@/lib/moveEstimate";
import type { MapPlace } from "@/lib/maps";
import type { MoveType } from "@/components/booking/MoveTimingTabs";
import { defaultTimeZone } from "@/components/booking/TimeZoneSelect";
import { PageLoader } from "@/components/ui/MtoLoader";

type Screen = WizardStepId | "messages" | "history";

function estimateItemsFromForm(description: string, vehicleName: string, estimatedLoad: string) {
  const trimmed = description.trim();
  if (trimmed) return [{ name: trimmed.slice(0, 160), qty: 1 }];
  const bits = [vehicleName, estimatedLoad].filter(Boolean).join(" · ");
  return [{ name: bits || "Household move", qty: 1 }];
}

function placeFromParams(
  address: string | null,
  lat: string | null,
  lng: string | null,
): MapPlace {
  const parsedLat = lat != null && lat !== "" ? Number(lat) : undefined;
  const parsedLng = lng != null && lng !== "" ? Number(lng) : undefined;
  return {
    address: address ?? "",
    ...(Number.isFinite(parsedLat) ? { lat: parsedLat } : {}),
    ...(Number.isFinite(parsedLng) ? { lng: parsedLng } : {}),
  };
}

export default function BookPage() {
  return (
    <Suspense fallback={<PageLoader label="Loading booking…" />}>
      <BookPageGate />
    </Suspense>
  );
}

function BookPageGate() {
  const searchParams = useSearchParams();
  const qs = searchParams.toString();
  const returnTo = `/book${qs ? `?${qs}` : ""}`;
  const authHref = `/auth?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <AuthGuard roles={["customer", "admin"]} redirectTo={authHref}>
      <MoveFlowProvider>
        <BookWizard />
      </MoveFlowProvider>
    </AuthGuard>
  );
}

function BookWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const flow = useMoveFlow();

  const initialPickup = searchParams.get("pickup") ?? "";
  const initialDestination = searchParams.get("destination") ?? "";

  const [screen, setScreen] = useState<Screen>("plan");
  const [pickup, setPickup] = useState(initialPickup);
  const [pickupPlace, setPickupPlace] = useState<MapPlace>(() =>
    placeFromParams(initialPickup, searchParams.get("pickupLat"), searchParams.get("pickupLng")),
  );
  const [destination, setDestination] = useState(initialDestination);
  const [destinationPlace, setDestinationPlace] = useState<MapPlace>(() =>
    placeFromParams(
      initialDestination,
      searchParams.get("destinationLat"),
      searchParams.get("destinationLng"),
    ),
  );
  const [moveType, setMoveType] = useState<MoveType>("now");
  const [whenChoice, setWhenChoice] = useState<WhenChoice>("today");
  const [moveDate, setMoveDate] = useState("");
  const [timeWindow, setTimeWindow] = useState("9:00 AM");
  const [timeZone, setTimeZone] = useState(defaultTimeZone());
  const [flexibleTime, setFlexibleTime] = useState(false);
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedVehicleName, setSelectedVehicleName] = useState("");
  const [estimatedLoad, setEstimatedLoad] = useState("");
  const [helperCount, setHelperCount] = useState(1);
  const [moveDescription, setMoveDescription] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [stars, setStars] = useState(5);
  const [ratingTags, setRatingTags] = useState<string[]>([]);
  const [reviewText, setReviewText] = useState("");
  const [tip, setTip] = useState("");
  const [customTip, setCustomTip] = useState("");
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [counterBusy, setCounterBusy] = useState(false);
  const [bookBusy, setBookBusy] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);
  /** After publish/book, stop showing the Draft chip until a new move starts. */
  const [draftClosed, setDraftClosed] = useState(false);
  /** Draft chip only after user reached Details (step 2) and left without publishing. */
  const [reachedDetails, setReachedDetails] = useState(false);

  // Re-hydrate if user lands with query after auth redirect.
  useEffect(() => {
    const p = searchParams.get("pickup");
    const d = searchParams.get("destination");
    if (p && !pickup) {
      setPickup(p);
      setPickupPlace(placeFromParams(p, searchParams.get("pickupLat"), searchParams.get("pickupLng")));
    }
    if (d && !destination) {
      setDestination(d);
      setDestinationPlace(
        placeFromParams(d, searchParams.get("destinationLat"), searchParams.get("destinationLng")),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const formValue = useMemo<FormState>(
    () => ({
      pickup,
      setPickup,
      pickupPlace,
      setPickupPlace,
      destination,
      setDestination,
      destinationPlace,
      setDestinationPlace,
      moveType,
      setMoveType,
      whenChoice,
      setWhenChoice,
      moveDate,
      setMoveDate,
      timeWindow,
      setTimeWindow,
      timeZone,
      setTimeZone,
      flexibleTime,
      setFlexibleTime,
      vehicleFilter,
      setVehicleFilter,
      selectedVehicleId,
      setSelectedVehicleId,
      selectedVehicleName,
      setSelectedVehicleName,
      estimatedLoad,
      setEstimatedLoad,
      helperCount,
      setHelperCount,
      moveDescription,
      setMoveDescription,
      photos,
      addPhoto: (photo) => setPhotos((prev) => [...prev, photo]),
      stars,
      setStars,
      ratingTags,
      toggleRatingTag: (tag) =>
        setRatingTags((prev) =>
          prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
        ),
      reviewText,
      setReviewText,
      tip,
      setTip,
      customTip,
      setCustomTip,
    }),
    [
      pickup,
      pickupPlace,
      destination,
      destinationPlace,
      moveType,
      whenChoice,
      moveDate,
      timeWindow,
      timeZone,
      flexibleTime,
      vehicleFilter,
      selectedVehicleId,
      selectedVehicleName,
      estimatedLoad,
      moveDescription,
      photos,
      stars,
      ratingTags,
      reviewText,
      tip,
      customTip,
      helperCount,
    ],
  );

  const handlePublish = async () => {
    const scheduleLabel =
      moveType === "now"
        ? "Move Now"
        : `${formatMoveDate(moveDate) || "Scheduled"} · ${timeWindow} (${timeZone.replace(/_/g, " ")})`;
    const notes = [
      `Vehicle: ${selectedVehicleName || vehicleFilter}`,
      `Timing: ${scheduleLabel}`,
      flexibleTime ? "Flexible time: yes" : "Flexible time: no",
      estimatedLoad ? `Load: ${estimatedLoad}` : "",
      `Helpers: ${helperCount}`,
      `Description: ${moveDescription.trim()}`,
      photos.length ? `Photos: ${photos.map((p) => p.url).join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const publishDate =
      moveType === "now" ? new Date().toISOString().slice(0, 10) : moveDate;

    const publishItems = estimateItemsFromForm(
      moveDescription,
      selectedVehicleName,
      estimatedLoad,
    );
    const { estimatedPrice, distanceKm } = await computeMoveEstimate(
      pickupPlace,
      destinationPlace,
      publishItems,
    );
    const req = await flow.publishRequest({
      pickup,
      destination,
      moveDate: publishDate,
      items: publishItems,
      notes,
      estimatedPrice,
      distanceKm,
    });
    if (req) {
      setSelectedQuoteId(null);
      setDraftClosed(true);
      setReachedDetails(false);
      // Clear form so Plan is empty when they start another move.
      setPickup("");
      setPickupPlace({ address: "" });
      setDestination("");
      setDestinationPlace({ address: "" });
      setMoveType("now");
      setWhenChoice("today");
      setMoveDate("");
      setTimeWindow("9:00 AM");
      setFlexibleTime(false);
      setVehicleFilter("");
      setSelectedVehicleId(null);
      setSelectedVehicleName("");
      setEstimatedLoad("");
      setHelperCount(1);
      setMoveDescription("");
      setPhotos([]);
      setScreen("quotes");
    }
  };

  const quotesForRequest = flow
    .quotesFromRequest(flow.activeRequest)
    .filter((q) => q.status === "pending" || q.status === "countered");
  const bookQuote = quotesForRequest.find((q) => q.id === selectedQuoteId) ?? null;

  const sendCounter = async (price: number, notes?: string) => {
    const request = flow.activeRequest;
    if (!request?.id || !bookQuote) return false;
    setCounterBusy(true);
    try {
      return !!(await flow.sendCounteroffer(request.id, bookQuote.id, price, notes));
    } finally {
      setCounterBusy(false);
    }
  };

  const handleConfirmBooking = async (paymentMethod: "cash_on_site" | "wallet") => {
    const request = flow.activeRequest;
    if (!request?.id || !bookQuote) return;
    setBookBusy(true);
    setBookError(null);
    try {
      const result = await flow.acceptQuote(request.id, bookQuote.id, paymentMethod);
      if (result) {
        setDraftClosed(true);
        setScreen("track");
      } else setBookError(flow.error ?? "Could not confirm booking. Please try again.");
    } finally {
      setBookBusy(false);
    }
  };

  const startNewMove = () => {
    setPickup("");
    setPickupPlace({ address: "" });
    setDestination("");
    setDestinationPlace({ address: "" });
    setMoveType("now");
    setWhenChoice("today");
    setMoveDate("");
    setTimeWindow("9:00 AM");
    setFlexibleTime(false);
    setVehicleFilter("");
    setSelectedVehicleId(null);
    setSelectedVehicleName("");
    setEstimatedLoad("");
    setHelperCount(1);
    setMoveDescription("");
    setPhotos([]);
    setSelectedQuoteId(null);
    setBookError(null);
    setDraftClosed(false);
    setReachedDetails(false);
    setScreen("plan");
    router.replace("/book");
  };

  const cancelAndStartNewMove = async () => {
    const requestId = flow.activeRequest?.id;
    if (requestId) {
      const cancelled = await flow.cancelRequest(requestId);
      if (!cancelled) return;
    }
    setSelectedQuoteId(null);
    startNewMove();
  };

  const displayName = customerDisplayName(user) || "Customer";

  // Draft only if user reached Details (step 2) and hasn't published yet.
  const hasDraft =
    reachedDetails && !draftClosed && Boolean(pickup.trim() || destination.trim());

  const statusItems = useMemo(() => {
    const items: StatusBoxItem[] = [];

    for (const b of flow.trackableBookings) {
      // Done moves stay in Track/History — don't clutter map chips.
      if (b.status === "completed" || b.status === "cancelled" || b.status === "canceled") continue;
      const pickupLabel =
        (b.pickupAddress as { street?: string } | undefined)?.street ??
        b.request?.pickupAddress ??
        "Pickup";
      const destLabel =
        (b.destinationAddress as { street?: string } | undefined)?.street ??
        b.request?.destinationAddress ??
        "Destination";
      items.push({
        id: `booking-${b.id}`,
        kind: "active",
        title: formatMoveRoute(pickupLabel, destLabel, 36),
        subtitle: b.mover?.moverProfile?.businessName ?? "Mover booked",
        badge: b.status === "in_progress" ? "Live" : "Active",
        selected: screen === "track" && flow.activeBooking?.id === b.id,
        onClick: () => {
          setScreen("track");
          void flow.selectTrackableBooking(b.id);
        },
      });
    }

    for (const r of flow.openRequests) {
      if (["completed", "cancelled", "canceled", "closed", "expired"].includes(r.status)) continue;
      // Skip if already represented by a live booking for same request.
      if (
        flow.trackableBookings.some(
          (b) =>
            b.requestId === r.id &&
            b.status !== "completed" &&
            b.status !== "cancelled" &&
            b.status !== "canceled",
        )
      ) {
        continue;
      }
      const quotes = (r.quotes ?? []).filter((q) => q.status === "pending" || q.status === "countered");
      items.push({
        id: `request-${r.id}`,
        kind: "active",
        title: formatMoveRoute(r.pickupAddress, r.destinationAddress, 36),
        subtitle: quotes.length ? `${quotes.length} quote${quotes.length === 1 ? "" : "s"}` : "Finding movers",
        badge: quotes.length ? "Quotes" : "Active",
        selected:
          (screen === "quotes" || screen === "book") && flow.activeRequest?.id === r.id,
        onClick: () => {
          setScreen("quotes");
          void flow.selectRequest(r.id);
        },
      });
    }

    // Fallback: activeRequest not yet in openRequests list.
    if (
      flow.activeRequest &&
      !["completed", "cancelled", "canceled", "closed", "expired"].includes(flow.activeRequest.status) &&
      !items.some((i) => i.id === `request-${flow.activeRequest!.id}`) &&
      !flow.trackableBookings.some(
        (b) =>
          b.requestId === flow.activeRequest!.id &&
          b.status !== "completed" &&
          b.status !== "cancelled" &&
          b.status !== "canceled",
      )
    ) {
      const r = flow.activeRequest;
      const quotes = (r.quotes ?? []).filter((q) => q.status === "pending" || q.status === "countered");
      items.push({
        id: `request-${r.id}`,
        kind: "active",
        title: formatMoveRoute(r.pickupAddress, r.destinationAddress, 36),
        subtitle: quotes.length ? `${quotes.length} quote${quotes.length === 1 ? "" : "s"}` : "Finding movers",
        badge: quotes.length ? "Quotes" : "Active",
        selected: screen === "quotes" || screen === "book",
        onClick: () => setScreen("quotes"),
      });
    }

    // Draft last — carousel starts with Active/Quotes, not Draft.
    if (hasDraft) {
      items.push({
        id: "draft",
        kind: "draft",
        title: draftRouteLabel(pickup, destination),
        subtitle: selectedVehicleName || vehicleFilter || "Left on details",
        badge: "Draft",
        selected: screen === "plan" || screen === "details",
        onClick: () => setScreen("details"),
      });
    }

    return items;
  }, [
    hasDraft,
    pickup,
    destination,
    selectedVehicleName,
    vehicleFilter,
    screen,
    flow.trackableBookings,
    flow.openRequests,
    flow.activeBooking,
    flow.activeRequest,
    flow.selectTrackableBooking,
    flow.selectRequest,
  ]);

  const activeNav: CustomerNavId =
    screen === "messages" ? "messages" : screen === "history" ? "history" : screen === "plan" || screen === "details" ? "new" : "move";

  const handleSidebarNav = (nav: CustomerNavId) => {
    if (nav === "new") {
      startNewMove();
      return;
    }
    if (nav === "move") {
      if (flow.activeBooking) setScreen("track");
      else if (flow.activeRequest) setScreen("quotes");
      else setScreen("plan");
      return;
    }
    if (nav === "messages") {
      setScreen("messages");
      return;
    }
    if (nav === "history") {
      setScreen("history");
    }
  };

  // AuthGuard wraps this page; preserve quote params when redirecting to auth.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const qs = searchParams.toString();
    if (!qs) return;
    try {
      sessionStorage.setItem("mto_book_return_qs", qs);
    } catch {
      /* ignore */
    }
  }, [searchParams]);

  useEffect(() => {
    void (async () => {
      await flow.loadBookings();
      await flow.loadRequests();
      await flow.selectTrackableBooking();
      await flow.restoreActiveRequest();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <FormCtx.Provider value={formValue}>
      <CustomerAppShell activeNav={activeNav} onNav={handleSidebarNav} displayName={displayName}>
        <BookingMapOverlayProvider overlay={<MoveStatusBoxes items={statusItems} />}>
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            background: "#F5F4EF",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {(screen === "plan" ||
            screen === "details" ||
            screen === "quotes" ||
            screen === "book" ||
            screen === "track") && (
            <WizardHeader
              stepId={screen as WizardStepId}
              displayName={displayName}
              onLogoClick={() => router.push("/")}
            />
          )}

          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            {screen === "plan" && (
              <PlanScreen
                onNext={() => {
                  setReachedDetails(true);
                  setScreen("details");
                }}
              />
            )}
            {screen === "details" && (
              <DetailsScreen
                onNext={handlePublish}
                onBack={() => setScreen("plan")}
                publishing={flow.loading}
                error={flow.error}
              />
            )}
            {screen === "quotes" && (
              <QuotesScreen
                request={flow.activeRequest}
                quotes={quotesForRequest}
                selectedQuoteId={selectedQuoteId}
                onSelectQuote={setSelectedQuoteId}
                onBook={() => setScreen("book")}
                onSendCounter={sendCounter}
                counterBusy={counterBusy}
                myUserId={user?.id ?? ""}
                onCancelRequest={cancelAndStartNewMove}
                onStartNew={() => void cancelAndStartNewMove()}
              />
            )}
            {screen === "book" &&
              (bookQuote ? (
                <BookScreen
                  quote={bookQuote}
                  onBack={() => setScreen("quotes")}
                  onConfirm={handleConfirmBooking}
                  busy={bookBusy}
                  error={bookError}
                />
              ) : (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <p style={{ font: "600 15px var(--font-hanken)", color: "#6B6B70" }}>
                    Select a quote first.
                  </p>
                </div>
              ))}
            {screen === "track" && (
              <TrackScreen
                onRate={startNewMove}
                onHistory={() => setScreen("history")}
                onWallet={() => setScreen("history")}
                onNewMove={startNewMove}
              />
            )}
            {screen === "messages" && (
              <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 24 }}>
                <p style={{ font: "600 15px var(--font-hanken)", color: "#6B6B70" }}>
                  Open Messages from an active move, or continue booking.
                </p>
              </div>
            )}
            {screen === "history" && (
              <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 24 }}>
                <p style={{ font: "600 15px var(--font-hanken)", color: "#6B6B70" }}>
                  History opens from completed moves. Start a new move anytime.
                </p>
              </div>
            )}
          </div>
        </div>
        </BookingMapOverlayProvider>
      </CustomerAppShell>
    </FormCtx.Provider>
  );
}
