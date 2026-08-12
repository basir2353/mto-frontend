import { redirect } from "next/navigation";
import { appUrls, sameAppOrigin } from "@/lib/theme/apps";

<<<<<<< HEAD
export default async function CustomerAppRedirect({
  searchParams,
=======
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChipToggle, TextArea } from "@/components/FormControls";
import { formatMoveDate } from "@/components/DatePicker";
import AuthGuard from "@/components/AuthGuard";
import { AppIcon, StarRating } from "@/components/ui/Icons";
import { PartyProfileCard, DeliveryProofGallery, moverDisplayName } from "@/components/move/JobPanels";
import { PlanScreen } from "@/components/move/PlanScreen";
import { DetailsScreen } from "@/components/move/DetailsScreen";
import { QuotesScreen } from "@/components/move/QuotesScreen";
import { BookScreen } from "@/components/move/BookScreen";
import { TrackScreen } from "@/components/move/TrackScreen";
import { WizardHeader, type WizardStepId } from "@/components/move/WizardChrome";
import { FormCtx, useForm, type FormState, type Photo, type WhenChoice } from "@/contexts/MoveFormContext";
import { InvoicePreviewCard } from "@/components/move/WalletPanels";
import { customerDisplayName } from "@/lib/displayNames";
import type { PaymentInvoice, Booking } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { MoveFlowProvider, useMoveFlow } from "@/contexts/MoveFlowContext";
import { customersApi, savedAddressesApi } from "@/lib/api";
import { isTrackableBooking, isBookingJobPaid } from "@/lib/bookingFlow";
import { isOpenRequest, resolveMoveScreen } from "@/lib/customerMoveNav";
import type { MovingRequest } from "@/lib/api";
import { computeMoveEstimate } from "@/lib/moveEstimate";
import { downloadInvoicePdf, shareInvoice } from "@/lib/invoiceDocument";
import type { MapPlace } from "@/lib/maps";
import { CustomerAppShell, type CustomerNavId } from "@/components/customer/CustomerAppShell";
import { resolveCustomerNotificationAction } from "@/lib/notificationNav";
import { PageLoader } from "@/components/ui/MtoLoader";
import type { Notification } from "@/lib/api/types";
import { BookingManageActions } from "@/components/booking/BookingManageActions";
import { BookingInsightsPanel } from "@/components/booking/BookingInsightsPanel";
import { BookingTimelinePanel } from "@/components/booking/BookingTimelinePanel";
import { MessagesInbox } from "@/components/messaging/MessagesInbox";
import type { MoveType } from "@/components/booking/MoveTimingTabs";
import { defaultTimeZone } from "@/components/booking/TimeZoneSelect";
import { formatMoveRoute } from "@/components/move/MovesSwitcher";

type Screen = "plan" | "details" | "quotes" | "book" | "track" | "messages" | "rate" | "history";
const WIZARD_SCREENS: Screen[] = ["plan", "details", "quotes", "book", "track"];
const RESUMABLE_SCREENS: Screen[] = ["plan", "details", "quotes", "track", "messages", "rate", "history"];
const LEGACY_SCREEN_MAP: Record<string, Screen> = {
  home: "plan",
  request: "details",
  published: "track",
  chat: "track",
  done: "track",
};

const SELECTED_QUOTE_KEY = "mto_selected_quote";
const SELECTED_REQUEST_KEY = "mto_selected_request";
const SCREEN_KEY = "mto_customer_screen";
const MOVE_DRAFT_KEY = "mto_customer_move_draft";

function screenFromPath(pathname: string): Screen {
  if (pathname === "/customer-app/messages") return "messages";
  if (pathname === "/customer-app/history") return "history";
  if (pathname.startsWith("/customer-app/requests/")) return "quotes";
  if (pathname.startsWith("/customer-app/bookings/")) return "track";
  return "plan";
}

function resourceIdFromPath(pathname: string, segment: "requests" | "bookings"): string | null {
  const match = pathname.match(new RegExp(`^/customer-app/${segment}/([^/]+)$`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

type MoveFormDraft = {
  pickup: string;
  pickupPlace: MapPlace;
  destination: string;
  destinationPlace: MapPlace;
  moveType: MoveType;
  whenChoice: WhenChoice;
  moveDate: string;
  timeWindow: string;
  timeZone: string;
  flexibleTime: boolean;
  vehicleFilter: string;
  selectedVehicleId: string | null;
  selectedVehicleName: string;
  estimatedLoad: string;
  moveDescription: string;
  photos: Photo[];
};

type MoveTabItem = {
  id: string;
  kind: "request" | "booking";
  label: string;
  badge: string;
};

function normalizeMoveDraft(raw: Record<string, unknown> | null): MoveFormDraft | null {
  if (!raw) return null;
  const legacyDescription =
    typeof raw.moveDescription === "string" && raw.moveDescription.trim()
      ? raw.moveDescription
      : [
          raw.loadType ? `Load: ${raw.loadType}` : "",
          Array.isArray(raw.handlingNotes) ? (raw.handlingNotes as string[]).join(", ") : "",
          Array.isArray(raw.items)
            ? (raw.items as Array<{ name: string; qty?: number }>).map((i) => `${i.name}x${i.qty ?? 1}`).join(", ")
            : "",
        ]
          .filter(Boolean)
          .join(" · ");

  return {
    pickup: String(raw.pickup ?? ""),
    pickupPlace: (raw.pickupPlace as MapPlace) ?? { address: String(raw.pickup ?? "") },
    destination: String(raw.destination ?? ""),
    destinationPlace: (raw.destinationPlace as MapPlace) ?? { address: String(raw.destination ?? "") },
    moveType: raw.moveType === "scheduled" ? "scheduled" : "now",
    whenChoice: raw.whenChoice === "tomorrow" ? "tomorrow" : raw.whenChoice === "custom" ? "custom" : "today",
    moveDate: String(raw.moveDate ?? ""),
    timeWindow: String(raw.timeWindow ?? "Morning"),
    timeZone: String(raw.timeZone ?? defaultTimeZone()),
    flexibleTime: Boolean(raw.flexibleTime),
    vehicleFilter: String(raw.vehicleFilter ?? ""),
    selectedVehicleId: typeof raw.selectedVehicleId === "string" ? raw.selectedVehicleId : null,
    selectedVehicleName: String(raw.selectedVehicleName ?? raw.vehicleFit ?? ""),
    estimatedLoad: String(raw.estimatedLoad ?? ""),
    moveDescription: legacyDescription,
    photos: Array.isArray(raw.photos) ? (raw.photos as Photo[]) : [],
  };
}

function estimateItemsFromForm(description: string, vehicleName: string, estimatedLoad: string) {
  const trimmed = description.trim();
  if (trimmed) return [{ name: trimmed.slice(0, 160), qty: 1 }];
  if (estimatedLoad) return [{ name: estimatedLoad, qty: 1 }];
  if (vehicleName) return [{ name: vehicleName, qty: 1 }];
  return [{ name: "Household move", qty: 1 }];
}

function hydrateFormFromRequest(
  request: MovingRequest,
  apply: {
    setPickup: (v: string) => void;
    setPickupPlace: (v: MapPlace) => void;
    setDestination: (v: string) => void;
    setDestinationPlace: (v: MapPlace) => void;
    setMoveDate: (v: string) => void;
    setMoveType: (v: MoveType) => void;
    setMoveDescription: (v: string) => void;
  },
) {
  apply.setPickup(request.pickupAddress);
  apply.setPickupPlace({ address: request.pickupAddress });
  apply.setDestination(request.destinationAddress);
  apply.setDestinationPlace({ address: request.destinationAddress });
  if (request.movingDate) {
    apply.setMoveDate(String(request.movingDate).slice(0, 10));
    apply.setMoveType("scheduled");
  }
  if (request.additionalNotes) {
    apply.setMoveDescription(request.additionalNotes);
  }
}

function loadMoveDraft(): MoveFormDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(MOVE_DRAFT_KEY);
    if (!raw) return null;
    return normalizeMoveDraft(JSON.parse(raw) as Record<string, unknown>);
  } catch {
    return null;
  }
}

function saveMoveDraft(draft: MoveFormDraft) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(MOVE_DRAFT_KEY, JSON.stringify(draft));
}

function clearMoveDraft() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(MOVE_DRAFT_KEY);
}

function parseCoord(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export default function CustomerAppPage() {
  return (
    <Suspense fallback={<PageLoader label="Loading your move…" />}>
      <AuthGuard roles={["customer"]}>
        <MoveFlowProvider>
          <CustomerAppContent />
        </MoveFlowProvider>
      </AuthGuard>
    </Suspense>
  );
}

function CustomerAppContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const flow = useMoveFlow();
  const [screen, setScreenState] = useState<Screen>(() => screenFromPath(pathname));
  const setScreen = (s: Screen, resourceId?: string | null) => {
    setScreenState(s);
    if (typeof window !== "undefined") sessionStorage.setItem(SCREEN_KEY, s);
    const requestId = resourceId ?? selectedRequestId;
    const bookingId = resourceId ?? flow.activeBooking?.id;
    const nextPath =
      s === "plan" || s === "details"
        ? "/customer-app/new"
        : s === "quotes" || s === "book"
          ? requestId ? `/customer-app/requests/${encodeURIComponent(requestId)}` : "/customer-app/new"
          : s === "track" || s === "rate"
            ? bookingId ? `/customer-app/bookings/${encodeURIComponent(bookingId)}` : "/customer-app"
            : s === "messages"
              ? "/customer-app/messages"
              : s === "history"
                ? "/customer-app/history"
                : "/customer-app";
    if (pathname !== nextPath) router.push(nextPath, { scroll: false });
  };
  const [selectedMessagesBookingId, setSelectedMessagesBookingId] = useState<string | null>(null);
  const [historyFocusId, setHistoryFocusId] = useState<string | null>(null);
  const [selectedQuoteId, setSelectedQuoteIdState] = useState<string | null>(null);

  const setSelectedQuoteId = (id: string | null) => {
    setSelectedQuoteIdState(id);
    if (typeof window === "undefined") return;
    if (id) sessionStorage.setItem(SELECTED_QUOTE_KEY, id);
    else sessionStorage.removeItem(SELECTED_QUOTE_KEY);
  };

  const [selectedRequestId, setSelectedRequestIdState] = useState<string | null>(() =>
    resourceIdFromPath(pathname, "requests"),
  );

  const setSelectedRequestId = (id: string | null) => {
    setSelectedRequestIdState(id);
    if (typeof window === "undefined") return;
    if (id) sessionStorage.setItem(SELECTED_REQUEST_KEY, id);
    else sessionStorage.removeItem(SELECTED_REQUEST_KEY);
  };

  useEffect(() => {
    setScreenState(screenFromPath(pathname));
    const requestId = resourceIdFromPath(pathname, "requests");
    if (requestId) setSelectedRequestIdState(requestId);
  }, [pathname]);

  // Form fields: URL params only on first paint. sessionStorage draft restored in useEffect.

  const [pickup, setPickup] = useState(() => searchParams.get("pickup") ?? "");
  const [pickupPlace, setPickupPlace] = useState<MapPlace>(() => ({
    address: searchParams.get("pickup") ?? "",
    lat: parseCoord(searchParams.get("pickupLat")),
    lng: parseCoord(searchParams.get("pickupLng")),
  }));
  const [destination, setDestination] = useState(() => searchParams.get("destination") ?? "");
  const [destinationPlace, setDestinationPlace] = useState<MapPlace>(() => ({
    address: searchParams.get("destination") ?? "",
    lat: parseCoord(searchParams.get("destinationLat")),
    lng: parseCoord(searchParams.get("destinationLng")),
  }));
  const [moveDate, setMoveDate] = useState("");
  const [moveType, setMoveType] = useState<MoveType>("now");
  const [whenChoice, setWhenChoice] = useState<WhenChoice>("today");
  const [timeWindow, setTimeWindow] = useState("Morning");
  const [timeZone, setTimeZone] = useState("America/Toronto");
  const [flexibleTime, setFlexibleTime] = useState(false);
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedVehicleName, setSelectedVehicleName] = useState("");
  const [estimatedLoad, setEstimatedLoad] = useState("");
  const [moveDescription, setMoveDescription] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [stars, setStars] = useState(0);
  const [ratingTags, setRatingTags] = useState<string[]>([]);
  const [reviewText, setReviewText] = useState("");
  const [tip, setTip] = useState("$10");
  const [customTip, setCustomTip] = useState("");
  const [bootReady, setBootReady] = useState(false);
  const bootedRef = useRef(false);
  const draftRestoredRef = useRef(false);

  const [counterBusy, setCounterBusy] = useState(false);
  const [bookBusy, setBookBusy] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);

  const toggleRatingTag = (v: string) =>
    setRatingTags((n) => (n.includes(v) ? n.filter((x) => x !== v) : [...n, v]));
  const addPhoto = (photo: Photo) => setPhotos((p) => [...p, photo]);

  useEffect(() => {
    if (draftRestoredRef.current) return;
    draftRestoredRef.current = true;

    const savedScreen = sessionStorage.getItem(SCREEN_KEY);
    if (pathname === "/customer-app" && savedScreen) {
      if ((RESUMABLE_SCREENS as string[]).includes(savedScreen)) setScreenState(savedScreen as Screen);
      else if (savedScreen in LEGACY_SCREEN_MAP) setScreenState(LEGACY_SCREEN_MAP[savedScreen]);
    }
    const q = sessionStorage.getItem(SELECTED_QUOTE_KEY);
    if (q) setSelectedQuoteIdState(q);
    const r = sessionStorage.getItem(SELECTED_REQUEST_KEY);
    if (r) setSelectedRequestIdState(r);

    const stored = loadMoveDraft();
    if (!stored) {
      setTimeZone(defaultTimeZone());
      return;
    }
    if (!searchParams.get("pickup") && stored.pickup) setPickup(stored.pickup);
    if (!searchParams.get("pickup") && stored.pickupPlace) setPickupPlace(stored.pickupPlace);
    if (!searchParams.get("destination") && stored.destination) setDestination(stored.destination);
    if (!searchParams.get("destination") && stored.destinationPlace) {
      setDestinationPlace(stored.destinationPlace);
    }
    if (stored.moveDate) setMoveDate(stored.moveDate);
    if (stored.moveType) setMoveType(stored.moveType);
    if (stored.whenChoice) setWhenChoice(stored.whenChoice);
    if (stored.timeWindow) setTimeWindow(stored.timeWindow);
    setTimeZone(stored.timeZone || defaultTimeZone());
    if (stored.flexibleTime != null) setFlexibleTime(stored.flexibleTime);
    if (stored.vehicleFilter) setVehicleFilter(stored.vehicleFilter);
    if (stored.selectedVehicleId) setSelectedVehicleId(stored.selectedVehicleId);
    if (stored.selectedVehicleName) setSelectedVehicleName(stored.selectedVehicleName);
    if (stored.estimatedLoad) setEstimatedLoad(stored.estimatedLoad);
    if (stored.moveDescription) setMoveDescription(stored.moveDescription);
    if (stored.photos?.length) setPhotos(stored.photos);
  }, [searchParams, pathname]);

  useEffect(() => {
    saveMoveDraft({
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
    });
  }, [
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
  ]);

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;

    let cancelled = false;
    (async () => {
      const savedScreen =
        typeof window !== "undefined" ? sessionStorage.getItem(SCREEN_KEY) : null;

      const bookings = (await flow.loadBookings()) ?? [];
      if (["/customer-app/new", "/customer-app/messages", "/customer-app/history"].includes(pathname)) {
        setScreenState(screenFromPath(pathname));
        setBootReady(true);
        return;
      }

      const routeBookingId = resourceIdFromPath(pathname, "bookings");
      if (routeBookingId) {
        const booking = await flow.loadBooking(routeBookingId);
        if (cancelled) return;
        if (booking?.requestId) setSelectedRequestId(booking.requestId);
        if (booking?.quoteId) setSelectedQuoteId(booking.quoteId);
        if (booking?.request) {
          hydrateFormFromRequest(booking.request, {
            setPickup,
            setPickupPlace,
            setDestination,
            setDestinationPlace,
            setMoveDate,
            setMoveType,
            setMoveDescription,
          });
        }
        setScreenState("track");
        setBootReady(true);
        return;
      }

      const openRequestFirst = (await flow.restoreActiveRequest(selectedRequestId ?? undefined)) ?? null;
      if (openRequestFirst?.id && isOpenRequest(openRequestFirst)) {
        if (cancelled) return;
        setSelectedRequestId(openRequestFirst.id);
        hydrateFormFromRequest(openRequestFirst, {
          setPickup,
          setPickupPlace,
          setDestination,
          setDestinationPlace,
          setMoveDate,
          setMoveType,
          setMoveDescription,
        });
        setScreen("quotes", openRequestFirst.id);
        setBootReady(true);
        return;
      }
      const trackable = bookings.find((b) => isTrackableBooking(b) && b.status !== "completed");

      if (trackable) {
        const full = await flow.selectTrackableBooking(trackable.id);
        if (cancelled) return;
        if (full?.requestId) setSelectedRequestId(full.requestId);
        if (full?.quoteId) setSelectedQuoteId(full.quoteId);
        if (full?.request) {
          hydrateFormFromRequest(full.request, {
            setPickup,
            setPickupPlace,
            setDestination,
            setDestinationPlace,
            setMoveDate,
            setMoveType,
            setMoveDescription,
          });
        }
        setScreen(resolveMoveScreen({ trackableBooking: full ?? trackable, savedScreen }), full?.id ?? trackable.id);
        setBootReady(true);
        return;
      }

      const request = openRequestFirst ?? (await flow.restoreActiveRequest(selectedRequestId ?? undefined));
      if (cancelled) {
        setBootReady(true);
        return;
      }

      if (request?.id) {
        setSelectedRequestId(request.id);
        hydrateFormFromRequest(request, {
          setPickup,
          setPickupPlace,
          setDestination,
          setDestinationPlace,
          setMoveDate,
          setMoveType,
          setMoveDescription,
        });

        if (isOpenRequest(request)) {
          setScreen("quotes", request.id);
        } else if (!savedScreen || savedScreen === "plan") {
          setScreen("plan");
        }
        setBootReady(true);
        return;
      }

      if (!cancelled) setBootReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!bootReady || !user || pickup.trim()) return;
    let cancelled = false;
    savedAddressesApi
      .getDefault()
      .then((addr) => {
        if (cancelled || pickup.trim()) return;
        const line = [addr.street, addr.city, addr.province, addr.postalCode].filter(Boolean).join(", ");
        setPickup(line);
        setPickupPlace({
          address: line,
          lat: addr.latitude ?? undefined,
          lng: addr.longitude ?? undefined,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?.id, bootReady, pickup]);

  const goMyMove = async () => {
    const list = (await flow.loadBookings()) ?? [];
    const requestFirst = flow.activeRequest ?? (await flow.restoreActiveRequest(selectedRequestId ?? undefined));
    if (requestFirst?.id && isOpenRequest(requestFirst)) {
      setSelectedRequestId(requestFirst.id);
      hydrateFormFromRequest(requestFirst, {
        setPickup,
        setPickupPlace,
        setDestination,
        setDestinationPlace,
        setMoveDate,
        setMoveType,
        setMoveDescription,
      });
      setScreen("quotes", requestFirst.id);
      return;
    }
    const trackable = list.find((b) => isTrackableBooking(b) && b.status !== "completed");
    if (trackable) {
      const full = await flow.selectTrackableBooking(trackable.id);
      if (full?.requestId) setSelectedRequestId(full.requestId);
      if (full?.quoteId) setSelectedQuoteId(full.quoteId);
      if (full?.request) {
        hydrateFormFromRequest(full.request, {
          setPickup,
          setPickupPlace,
          setDestination,
          setDestinationPlace,
          setMoveDate,
          setMoveType,
          setMoveDescription,
        });
      }
      setScreen("track", full?.id ?? trackable.id);
      return;
    }

    flow.setActiveBooking(null);
    const request = requestFirst ?? flow.activeRequest ?? (await flow.restoreActiveRequest(selectedRequestId ?? undefined));
    if (request?.id) {
      setSelectedRequestId(request.id);
      hydrateFormFromRequest(request, {
        setPickup,
        setPickupPlace,
        setDestination,
        setDestinationPlace,
        setMoveDate,
        setMoveType,
        setMoveDescription,
      });
      if (isOpenRequest(request)) {
        setScreen("quotes");
        return;
      }
    }

    setScreen("plan");
  };

  const goMessages = (bookingId?: string) => {
    if (bookingId) setSelectedMessagesBookingId(bookingId);
    else if (flow.activeBooking?.id) setSelectedMessagesBookingId(flow.activeBooking.id);
    setScreen("messages");
  };

  const form: FormState = {
    pickup, setPickup, pickupPlace, setPickupPlace, destination, setDestination, destinationPlace, setDestinationPlace,
    moveType, setMoveType, whenChoice, setWhenChoice, moveDate, setMoveDate, timeWindow, setTimeWindow, timeZone, setTimeZone, flexibleTime, setFlexibleTime,
    vehicleFilter, setVehicleFilter,
    selectedVehicleId, setSelectedVehicleId, selectedVehicleName, setSelectedVehicleName,
    estimatedLoad, setEstimatedLoad,
    moveDescription, setMoveDescription, photos, addPhoto,
    stars, setStars, ratingTags, toggleRatingTag, reviewText, setReviewText, tip, setTip, customTip, setCustomTip,
  };

  const resetMoveForm = () => {
    setPickup("");
    setPickupPlace({ address: "" });
    setDestination("");
    setDestinationPlace({ address: "" });
    setMoveType("now");
    setWhenChoice("today");
    setMoveDate("");
    setTimeWindow("Morning");
    setTimeZone(defaultTimeZone());
    setFlexibleTime(false);
    setVehicleFilter("");
    setSelectedVehicleId(null);
    setSelectedVehicleName("");
    setEstimatedLoad("");
    setMoveDescription("");
    setPhotos([]);
    clearMoveDraft();
  };

  const startNewMove = () => {
    resetMoveForm();
    setScreen("plan");
  };

  const cancelAndStartNewMove = async () => {
    const requestId = flow.activeRequest?.id;
    if (requestId) {
      const cancelled = await flow.cancelRequest(requestId);
      if (!cancelled) return;
    }
    setSelectedRequestId(null);
    setSelectedQuoteId(null);
    startNewMove();
  };

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
      `Description: ${moveDescription.trim()}`,
      photos.length ? `Photos: ${photos.map((p) => p.url).join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const publishDate =
      moveType === "now"
        ? new Date().toISOString().slice(0, 10)
        : moveDate;

    const publishItems = estimateItemsFromForm(moveDescription, selectedVehicleName, estimatedLoad);
    const { estimatedPrice, distanceKm } = await computeMoveEstimate(pickupPlace, destinationPlace, publishItems);
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
      setSelectedRequestId(req.id);
      clearMoveDraft();
      setScreen("quotes", req.id);
    }
  };

  const quotesForRequest = flow.quotesFromRequest(flow.activeRequest).filter(
    (q) => q.status === "pending" || q.status === "countered",
  );
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
        setScreen("track", result.id);
      } else {
        setBookError(flow.error ?? "Could not confirm booking. Please try again.");
      }
    } finally {
      setBookBusy(false);
    }
  };

  const go = (s: Screen) => () => setScreen(s);

  const openFromNotification = async (n: Notification) => {
    const action = resolveCustomerNotificationAction(n);
    switch (action.kind) {
      case "messages":
        goMessages(action.bookingId);
        break;
      case "wallet":
        setScreen("history");
        if (action.bookingId) void flow.loadBooking(action.bookingId);
        break;
      case "history":
        if (action.bookingId) setHistoryFocusId(action.bookingId);
        setScreen("history");
        if (action.bookingId) void flow.loadBooking(action.bookingId);
        break;
      case "support":
        window.location.href = "/customer-app/support";
        break;
      case "track": {
        if (action.requestId) setSelectedRequestId(action.requestId);
        if (action.quoteId) setSelectedQuoteId(action.quoteId);

        if (action.bookingId) {
          const booking = await flow.loadBooking(action.bookingId);
          if (booking && !isTrackableBooking(booking)) {
            setHistoryFocusId(booking.id);
            setScreen("history");
            return;
          }
          setScreen("track");
          return;
        }

        if (action.requestId) {
          flow.setActiveBooking(null);
          await flow.selectRequest(action.requestId);
          setScreen("quotes", action.requestId);
          return;
        }

        await goMyMove();
        break;
      }
      default:
        setScreen("plan");
        break;
    }
  };

  const displayName = customerDisplayName(user);
  const isWizardScreen = (WIZARD_SCREENS as Screen[]).includes(screen);
  const isMyMoveScreen = screen === "quotes" || screen === "book" || screen === "track";
  const moveTabs = useMemo<MoveTabItem[]>(() => {
    const bookingTabs = flow.trackableBookings.filter((b) => b.status !== "completed").map((b) => {
      const pickup =
        (b.pickupAddress as { street?: string } | undefined)?.street ??
        b.request?.pickupAddress;
      const destination =
        (b.destinationAddress as { street?: string } | undefined)?.street ??
        b.request?.destinationAddress;
      return {
        id: b.id,
        kind: "booking" as const,
        label: formatMoveRoute(pickup, destination, 36),
        badge: b.status === "in_progress" ? "Live" : "Track",
      };
    });
    const requestTabs = flow.openRequests.map((r) => {
      const quotes = (r.quotes ?? []).filter((q) => q.status === "pending" || q.status === "countered").length;
      return {
        id: r.id,
        kind: "request" as const,
        label: formatMoveRoute(r.pickupAddress, r.destinationAddress, 36),
        badge: quotes > 0 ? `${quotes} quote${quotes === 1 ? "" : "s"}` : "Finding",
      };
    });
    return [...bookingTabs, ...requestTabs];
  }, [flow.trackableBookings, flow.openRequests]);

  const activeMoveTabKey =
    screen === "track" ? (flow.activeBooking ? `booking:${flow.activeBooking.id}` : null) : flow.activeRequest ? `request:${flow.activeRequest.id}` : null;

  const handleSelectMoveTab = async (tab: MoveTabItem) => {
    if (tab.kind === "booking") {
      const full = await flow.selectTrackableBooking(tab.id);
      if (full?.requestId) setSelectedRequestId(full.requestId);
      if (full?.quoteId) setSelectedQuoteId(full.quoteId);
      setScreen("track", full?.id ?? tab.id);
      return;
    }
    flow.setActiveBooking(null);
    const request = await flow.selectRequest(tab.id);
    if (request?.id) {
      setSelectedRequestId(request.id);
      setScreen("quotes", request.id);
    }
  };
  const activeNav: CustomerNavId =
    screen === "messages"
      ? "messages"
      : screen === "history"
        ? "history"
        : "move";

  const handleSidebarNav = (nav: CustomerNavId) => {
    if (nav === "new") {
      startNewMove();
      return;
    }
    if (nav === "move") {
      void goMyMove();
      return;
    }
    if (nav === "messages") {
      goMessages();
      return;
    }
    if (nav === "history") {
      setScreen("history");
    }
  };

  return (
    <FormCtx.Provider value={form}>
      <CustomerAppShell activeNav={activeNav} onNav={handleSidebarNav} displayName={displayName} onOpenNotification={openFromNotification}>
        <div className="customer-page-stage" style={{ background: "#e4e2db", minHeight: "100%" }}>
        {flow.error && screen !== "details" && screen !== "book" && (
          <div style={{ margin: "8px 10px 0", padding: "12px 20px", borderRadius: 10, background: "#fff0f0", color: "#b00020", font: "600 14px 'Hanken Grotesk'" }}>
            {flow.error}
          </div>
        )}
        <style>{`
          @keyframes ping{0%{transform:scale(.9);opacity:.7}70%,100%{transform:scale(2.4);opacity:0}}
          @keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
          .customer-page-stage{height:100%;display:flex;flex-direction:column;min-width:0}
          @media(max-width:900px){
            .customer-page-stage{min-height:0!important;flex:1;position:relative}
            .wizard-form-pane>div[style*="overflow: auto"]{padding:24px 20px 14px!important}
            .wizard-form-pane>div[style*="border-top"]{padding:12px 20px 16px!important}
            .customer-move-tabs{
              position:absolute;z-index:35;top:64px;left:10px;right:10px;height:42px!important;
              padding:0!important;background:transparent!important;border:0!important;pointer-events:none
            }
            .customer-move-tabs>div,.customer-move-tabs>button{pointer-events:auto}
            .customer-move-tabs>div{scrollbar-width:none}
            .customer-move-tabs>div::-webkit-scrollbar{display:none}
            .customer-move-tabs button{box-shadow:0 5px 16px rgba(0,0,0,.15)}
            .customer-page-stage:has(.customer-move-tabs) .wizard-map-pane>div[style*="top: 24px"]{top:114px!important}
            .customer-wallet-wrap,.customer-rating-wrap{width:100%!important;padding:28px 20px 36px!important}
            .customer-history-inner{padding:28px 20px 40px!important}
          }
          @media(max-width:560px){
            .wizard-form-pane>div[style*="overflow: auto"]{padding:24px 16px 12px!important}
            .wizard-form-pane>div[style*="border-top"]{padding:10px 16px 14px!important}
            .wizard-form-pane h1{font-size:28px!important}
            .wizard-form-pane h2{font-size:23px!important}
            .customer-wallet-wrap,.customer-rating-wrap{padding:24px 14px 32px!important}
            .customer-wallet-wrap h1,.customer-history-inner h1{font-size:29px!important}
            .customer-rating-wrap h1{font-size:25px!important}
            .customer-rating-wrap>div[style*="display: flex"][style*="gap: 10px"]{flex-wrap:wrap}
            .customer-rating-wrap>div[style*="display: flex"][style*="gap: 10px"]>div{min-width:calc(50% - 5px)}
            .customer-history-inner{padding:24px 14px 36px!important}
            .customer-history-header{align-items:center!important;gap:12px}
            .customer-history-header>div{padding:0 13px!important}
            .customer-history-card-row{padding:15px!important;gap:11px!important;align-items:flex-start!important}
            .customer-history-card-row>div:first-child{width:42px!important;height:42px!important;flex:none}
            .customer-history-card-row>b{font-size:17px!important}
            .customer-history-detail{padding:15px!important}
            .customer-history-route-grid{grid-template-columns:1fr!important;gap:12px!important}
          }
        `}</style>
        <div
          style={{
            width: "100%",
            height: "100%",
            margin: 0,
            background: "#F5F4EF",
            borderRadius: 0,
            overflow: "hidden",
            boxShadow: "none",
            display: "flex",
            flexDirection: "column",
            color: "#0E0E10",
            position: "relative",
          }}
        >
          {isWizardScreen ? (
            <WizardHeader
              stepId={screen as WizardStepId}
              displayName={displayName}
              onLogoClick={() => void goMyMove()}
              onOpenNotification={openFromNotification}
            />
          ) : null}

          {isMyMoveScreen && moveTabs.length > 1 && (
            <div
              className="customer-move-tabs"
              style={{
                height: 54,
                flex: "none",
                background: "#fff",
                borderBottom: "1px solid rgba(0,0,0,.08)",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "0 14px",
              }}
            >
              <div style={{ display: "flex", gap: 8, overflowX: "auto", flex: 1, minWidth: 0 }}>
                {moveTabs.map((tab) => {
                  const key = `${tab.kind}:${tab.id}`;
                  const active = key === activeMoveTabKey;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => void handleSelectMoveTab(tab)}
                      style={{
                        height: 36,
                        borderRadius: 999,
                        border: active ? "none" : "1px solid rgba(0,0,0,.14)",
                        background: active ? "#0E0E10" : "#fff",
                        color: active ? "#fff" : "#0E0E10",
                        padding: "0 12px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        flex: "none",
                      }}
                    >
                      <span style={{ font: active ? "700 12px 'Archivo'" : "600 12px 'Hanken Grotesk'" }}>{tab.label}</span>
                      <span
                        style={{
                          font: "700 10px 'Hanken Grotesk'",
                          letterSpacing: ".04em",
                          textTransform: "uppercase",
                          padding: "2px 7px",
                          borderRadius: 999,
                          background: active ? "rgba(255,255,255,.16)" : "#eceae2",
                          color: active ? "rgba(255,255,255,.85)" : "#6B6B70",
                        }}
                      >
                        {tab.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={startNewMove}
                style={{
                  height: 34,
                  padding: "0 12px",
                  borderRadius: 999,
                  border: "1.5px solid rgba(0,0,0,.12)",
                  background: "var(--accent)",
                  font: "800 12px 'Archivo'",
                  color: "#0E0E10",
                  cursor: "pointer",
                  flex: "none",
                }}
              >
                + New
              </button>
            </div>
          )}

          <div key={screen} className="app-screen-motion">
            {screen === "plan" && <PlanScreen onNext={() => setScreen("details")} />}
            {screen === "details" && (
              <DetailsScreen onNext={handlePublish} onBack={() => setScreen("plan")} publishing={flow.loading} error={flow.error} />
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
            {screen === "book" && (
              bookQuote ? (
                <BookScreen quote={bookQuote} onBack={() => setScreen("quotes")} onConfirm={handleConfirmBooking} busy={bookBusy} error={bookError} />
              ) : (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#F5F4EF" }}>
                  <p style={{ font: "600 15px 'Hanken Grotesk'", color: "#6B6B70" }}>Loading your quote…</p>
                </div>
              )
            )}
            {screen === "messages" && user?.id && (
              <MessagesInbox
                myUserId={user.id}
                selectedBookingId={selectedMessagesBookingId}
                onSelectBooking={setSelectedMessagesBookingId}
              />
            )}
            {screen === "track" && <TrackScreen onRate={go("rate")} onHistory={go("history")} onWallet={go("history")} />}
            {screen === "rate" && <RatingScreen onWallet={go("history")} onHistory={go("history")} />}
            {screen === "history" && (
              <HistoryScreen
                onStartRequest={startNewMove}
                focusBookingId={historyFocusId}
                onFocusConsumed={() => setHistoryFocusId(null)}
              />
            )}
          </div>
        </div>
        </div>
      </CustomerAppShell>
    </FormCtx.Provider>
  );
}

/* ============ RATING ============ */

function RatingScreen({ onWallet, onHistory }: { onWallet: () => void; onHistory: () => void }) {
  const f = useForm();
  const flow = useMoveFlow();
  const booking = flow.activeBooking;
  const bookingId = booking?.id;
  const moverLabel = booking?.mover?.moverProfile?.businessName ?? "your mover";
  const pickupLabel = (booking?.pickupAddress as { street?: string } | undefined)?.street ?? booking?.request?.pickupAddress ?? "your pickup";
  const dateLabel = booking?.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : "";
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!bookingId || submitting) {
      onHistory();
      return;
    }
    setSubmitting(true);
    try {
      await flow.submitReview(bookingId, f.stars, f.reviewText);
      const tipAmount = f.tip === "Custom" ? Number(f.customTip) : Number(f.tip.replace("$", ""));
      if (tipAmount > 0) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("mto_pending_tip", String(tipAmount));
        }
        await flow.loadBooking(bookingId);
        onWallet();
        return;
      }
      await flow.loadBookings();
      onHistory();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ flex: 1, overflow: "auto", minHeight: 0, display: "flex", justifyContent: "center", alignItems: "flex-start", background: "#F5F4EF" }}>
      <div className="customer-rating-wrap" style={{ width: 560, maxWidth: "100%", padding: "44px 40px", textAlign: "center" }}>
        <div style={{ width: 74, height: 74, borderRadius: "50%", background: "linear-gradient(135deg,#dfe0d6,#c9cabf)", margin: "0 auto 16px" }} />
        <h1 style={{ margin: "0 0 4px", font: "900 30px 'Archivo'", letterSpacing: "-.025em" }}>How was {moverLabel}?</h1>
        <p style={{ margin: "0 0 22px", font: "500 14px 'Hanken Grotesk'", color: "#6B6B70" }}>
          Your move from {pickupLabel}{dateLabel ? ` · ${dateLabel}` : ""}
        </p>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 26 }}>
          <StarRating value={f.stars} onChange={f.setStars} size={40} gap={10} />
        </div>
        <div style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".09em", textTransform: "uppercase", color: "#8A8A90", marginBottom: 10 }}>
          What went well?
        </div>
        <div style={{ marginBottom: 26, display: "flex", justifyContent: "center" }}>
          <ChipToggle options={["On time", "Careful with items", "Friendly", "Fast"]} selected={f.ratingTags} onSelect={f.toggleRatingTag} multi />
        </div>
        <TextArea value={f.reviewText} onChange={f.setReviewText} placeholder="Tell us about your move…" />
        <div style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".09em", textTransform: "uppercase", color: "#8A8A90", margin: "24px 0 10px", textAlign: "left" }}>
          Add a tip?
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 26 }}>
          {["$5", "$10", "$20", "Custom"].map((t) => (
            <div
              key={t}
              onClick={() => f.setTip(t)}
              style={{
                flex: 1,
                height: 52,
                borderRadius: 12,
                background: f.tip === t ? "var(--accent)" : undefined,
                border: f.tip === t ? undefined : "1.5px solid rgba(0,0,0,.14)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                font: f.tip === t ? "800 15px 'Archivo'" : "700 15px 'Hanken Grotesk'",
                color: f.tip === t ? "#0E0E10" : undefined,
                cursor: "pointer",
              }}
            >
              {t}
            </div>
          ))}
        </div>
        {f.tip === "Custom" && (
          <input
            value={f.customTip}
            onChange={(e) => f.setCustomTip(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="Enter amount"
            style={{ width: "100%", height: 52, marginTop: -16, marginBottom: 26, border: "1.5px solid rgba(0,0,0,.14)", borderRadius: 12, padding: "0 15px", font: "600 15px 'Hanken Grotesk'", outline: "none" }}
          />
        )}
        <div
          onClick={() => void submit()}
          style={{
            height: 56,
            borderRadius: 12,
            background: "#0E0E10",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            font: "800 16px 'Archivo'",
            cursor: submitting ? "wait" : "pointer",
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? "Submitting..." : "Submit review"}
        </div>
      </div>
    </div>
  );
}

/* ============ HISTORY ============ */

function humanizeKey(key: string): string {
  const spaced = key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function HistoryBookingDetail({ booking }: { booking: Booking }) {
  const flow = useMoveFlow();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<PaymentInvoice | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const pickup =
    (booking.pickupAddress as { street?: string } | undefined)?.street ??
    booking.request?.pickupAddress ??
    "Pickup";
  const destination =
    (booking.destinationAddress as { street?: string } | undefined)?.street ??
    booking.request?.destinationAddress ??
    "Destination";
  const moverName = booking.mover?.moverProfile?.businessName ?? moverDisplayName(booking.mover) ?? "Mover";
  const moveItems = (booking.items ?? []).filter((item) => item.name !== "Delivery proof");
  const proofPhotos = (booking.items ?? []).filter((item) => item.photoUrl && item.name === "Delivery proof");
  const breakdown =
    booking.pricingBreakdown && Object.keys(booking.pricingBreakdown).length
      ? Object.entries(booking.pricingBreakdown).filter(([, v]) => typeof v === "number" || typeof v === "string")
      : [];
  const paid = isBookingJobPaid(booking);
  const canRebook = booking.status === "completed" || booking.status === "cancelled";

  const handleRebook = async () => {
    setActionBusy(true);
    setActionMsg(null);
    try {
      await flow.rebook(booking.id);
      setActionMsg("Move rebooked - check Track for the new booking.");
    } catch (e) {
      setActionMsg(e instanceof Error ? e.message : "Rebook failed");
    } finally {
      setActionBusy(false);
    }
  };

  const handleDuplicate = async () => {
    setActionBusy(true);
    setActionMsg(null);
    try {
      await flow.duplicateBooking(booking.id);
      setActionMsg("Draft duplicate created - open Track to continue.");
    } catch (e) {
      setActionMsg(e instanceof Error ? e.message : "Duplicate failed");
    } finally {
      setActionBusy(false);
    }
  };

  useEffect(() => {
    if (!booking.id || !paid) return;
    // Reflect the request state while loading the paid invoice.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInvoiceLoading(true);
    customersApi
      .getInvoice(booking.id, "job")
      .then(setInvoice)
      .catch(() => setInvoice(null))
      .finally(() => setInvoiceLoading(false));
  }, [booking.id, paid]);

  return (
    <div className="customer-history-detail" style={{ marginTop: 14, padding: "18px 20px 20px", borderTop: "1px solid rgba(0,0,0,.08)", background: "#fafaf8", borderRadius: "0 0 16px 16px" }}>
      <div className="customer-history-route-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
        <div>
          <div style={{ font: "700 10px 'Hanken Grotesk'", letterSpacing: ".09em", textTransform: "uppercase", color: "#8A8A90", marginBottom: 6 }}>Pickup</div>
          <div style={{ font: "600 14px 'Hanken Grotesk'" }}>{pickup}</div>
        </div>
        <div>
          <div style={{ font: "700 10px 'Hanken Grotesk'", letterSpacing: ".09em", textTransform: "uppercase", color: "#8A8A90", marginBottom: 6 }}>Destination</div>
          <div style={{ font: "600 14px 'Hanken Grotesk'" }}>{destination}</div>
        </div>
      </div>

      <PartyProfileCard
        name={moverName}
        imageUrl={booking.mover?.moverProfile?.avatarUrl}
        roleLabel="Mover"
        phone={booking.mover?.moverProfile?.phone}
        meta={[
          { label: "Move date", value: new Date(booking.scheduledDate).toLocaleDateString() },
          { label: "Total", value: `$${Number(booking.price).toFixed(2)}` },
          { label: "Payment", value: booking.paymentMethod === "wallet" ? "Wallet" : "Cash on site" },
        ]}
      />

      {moveItems.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".09em", textTransform: "uppercase", color: "#8A8A90", marginBottom: 10 }}>Items moved</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {moveItems.map((item) => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", font: "600 14px 'Hanken Grotesk'", padding: "10px 12px", background: "#fff", borderRadius: 10, border: "1px solid rgba(0,0,0,.08)" }}>
                <span>{item.name}</span>
                <span style={{ color: "#6B6B70" }}>x{item.quantity ?? 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {booking.notes && (
        <div style={{ marginTop: 16 }}>
          <div style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".09em", textTransform: "uppercase", color: "#8A8A90", marginBottom: 8 }}>Notes</div>
          <p style={{ margin: 0, font: "500 14px/1.45 'Hanken Grotesk'", color: "#6B6B70" }}>{booking.notes}</p>
        </div>
      )}

      {breakdown.length > 0 && (
        <div style={{ marginTop: 16, padding: 16, background: "#fff", borderRadius: 12, border: "1px solid rgba(0,0,0,.08)" }}>
          <div style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".09em", textTransform: "uppercase", color: "#8A8A90", marginBottom: 10 }}>Cost breakdown</div>
          {breakdown.map(([label, val]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", font: "500 14px 'Hanken Grotesk'", marginBottom: 6 }}>
              {humanizeKey(label)}
              <span>{typeof val === "number" ? `$${val.toFixed(2)}` : String(val)}</span>
            </div>
          ))}
        </div>
      )}

      {proofPhotos.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <DeliveryProofGallery photos={proofPhotos} />
        </div>
      )}

      {booking.review && (
        <div style={{ marginTop: 16, padding: 16, background: "#fff", borderRadius: 12, border: "1px solid rgba(0,0,0,.08)" }}>
          <div style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".09em", textTransform: "uppercase", color: "#8A8A90", marginBottom: 8 }}>Your review</div>
          <div style={{ marginBottom: 6 }}>
            <StarRating value={booking.review.rating} size={22} gap={4} />
          </div>
          {booking.review.comment && <p style={{ margin: 0, font: "500 14px 'Hanken Grotesk'", color: "#6B6B70" }}>{booking.review.comment}</p>}
        </div>
      )}

      {(booking.payments ?? []).length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".09em", textTransform: "uppercase", color: "#8A8A90", marginBottom: 10 }}>Payments</div>
          {(booking.payments ?? []).map((p) => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", font: "600 14px 'Hanken Grotesk'", padding: "10px 12px", background: "#fff", borderRadius: 10, border: "1px solid rgba(0,0,0,.08)", marginBottom: 8 }}>
              <span>
                {p.kind === "tip" ? "Tip" : "Job payment"} · {p.method === "cash_on_site" || p.transactionRef?.startsWith("CASH") ? "cash on site" : p.status}
              </span>
              <b>${Number(p.amount).toFixed(2)}</b>
            </div>
          ))}
        </div>
      )}

      {paid && invoice && !invoiceLoading && (
        <div style={{ marginTop: 16 }}>
          <InvoicePreviewCard
            invoice={invoice}
            onDownload={() => downloadInvoicePdf(invoice)}
            onShare={() => void shareInvoice(invoice)}
          />
        </div>
      )}

      {canRebook && (
        <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <button
            type="button"
            disabled={actionBusy}
            onClick={() => void handleRebook()}
            style={{ height: 40, padding: "0 16px", borderRadius: 10, border: "none", background: "var(--accent)", font: "800 13px 'Archivo'", cursor: actionBusy ? "wait" : "pointer" }}
          >
            {actionBusy ? "Working..." : "Book again with same mover"}
          </button>
          <button
            type="button"
            disabled={actionBusy}
            onClick={() => void handleDuplicate()}
            style={{ height: 40, padding: "0 16px", borderRadius: 10, border: "1.5px solid rgba(0,0,0,.14)", background: "#fff", font: "700 13px 'Hanken Grotesk'", cursor: actionBusy ? "wait" : "pointer" }}
          >
            Duplicate as draft
          </button>
          {actionMsg && (
            <span style={{ font: "600 13px 'Hanken Grotesk'", color: actionMsg.includes("failed") ? "#a8442a" : "#1f6b1f" }}>{actionMsg}</span>
          )}
        </div>
      )}

      <BookingInsightsPanel booking={booking} myUserId={user?.id} />
      {booking.id && <BookingTimelinePanel bookingId={booking.id} compact />}

      <BookingManageActions
        bookingId={booking.id}
        status={booking.status}
        canCancel={false}
        canReschedule={false}
        canShare={false}
        canDispute
        onCancel={() => Promise.resolve()}
        onDispute={async (reason) => {
          await flow.createDispute(booking.id, reason);
        }}
        onReschedule={() => Promise.resolve()}
        onShare={() => Promise.resolve(null)}
      />
    </div>
  );
}

function HistoryScreen({
  onStartRequest,
  focusBookingId,
  onFocusConsumed,
>>>>>>> ac960226d218fcf032389f207fde44cc1d48f28f
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") qs.set(key, value);
    else if (Array.isArray(value) && value[0]) qs.set(key, value[0]);
  }
  const query = qs.toString();

  // Live: no separate customer web — keep users on marketing (preserve quote params).
  if (sameAppOrigin(appUrls.customerApp, appUrls.marketing)) {
    redirect(`/${query ? `?${query}` : ""}`);
  }

  redirect(`${appUrls.customerApp}${query ? `?${query}` : ""}`);
}
