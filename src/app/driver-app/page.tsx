"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import { DriverWorkPanel } from "@/components/driver/DriverWorkPanel";
import { DriverOverviewPanel } from "@/components/driver/DriverOverviewPanel";
import {
  countHistoryBookings,
  countOpenDisputeBookings,
  DriverHistoryPanel,
  DriverWorkModeTabs,
} from "@/components/driver/DriverHistoryPanel";
import {
  DriverAlert,
  DriverDashboardShell,
  DriverJobListRow,
  DriverOpenJobCard,
  DriverPanel,
  type DriverTab,
} from "@/components/driver/DriverDashboardShell";
import { MoveSheet } from "@/components/move/MoveSheet";
import { customerDisplayName } from "@/components/move/JobPanels";
import { MoverPayDashboard } from "@/components/move/WalletPanels";
import { MessagesInbox } from "@/components/messaging/MessagesInbox";
import { EmptyState } from "@/components/ui/AppUi";
import { formatMovingRequestWhen } from "@/lib/requestSchedule";
import { EmptyStateIcon } from "@/components/ui/Icons";
import { BlockLoader } from "@/components/ui/MtoLoader";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/contexts/AuthContext";
import { moversApi, bookingsApi, messagesApi, type Booking, type MovingRequest, type Quote } from "@/lib/api";
import type { Conversation, MoverWallet, TrackingEvent } from "@/lib/api/types";
import type { MapPlace } from "@/lib/maps";
import type { Notification } from "@/lib/api/types";
import { resolveDriverNotificationAction } from "@/lib/notificationNav";
import responsive from "@/components/driver/DriverResponsive.module.css";
import sectionStyles from "@/components/driver/DriverSection.module.css";

async function withTrackingHydrated(bookings: Booking[]): Promise<Booking[]> {
  const active = bookings.filter((b) => b.status === "in_progress" || b.status === "confirmed");
  if (!active.length) return bookings;

  const timelines = await Promise.all(
    active.map(async (b) => {
      try {
        const events = await moversApi.getTracking(b.id);
        return [b.id, events] as const;
      } catch {
        return [b.id, b.trackingEvents ?? []] as const;
      }
    }),
  );
  const byId = new Map(timelines);

  return bookings.map((b) => {
    const events = byId.get(b.id);
    return events ? { ...b, trackingEvents: events } : b;
  });
}

function mergeTrackingEvent(bookings: Booking[], bookingId: string, event: TrackingEvent): Booking[] {
  return bookings.map((b) => {
    if (b.id !== bookingId) return b;
    const existing = b.trackingEvents ?? [];
    if (existing.some((e) => e.id === event.id)) return { ...b, trackingEvents: existing };
    return { ...b, trackingEvents: [...existing, event] };
  });
}

export default function DriverAppPage() {
  return (
    <AuthGuard roles={["mover"]}>
      <DriverAppContent />
    </AuthGuard>
  );
}

function DriverAppContent() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [requests, setRequests] = useState<MovingRequest[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [negotiationBusyId, setNegotiationBusyId] = useState<string | null>(null);
  const [activeTab, setActiveTabState] = useState<DriverTab>("overview");
  const setActiveTab = (tab: DriverTab) => {
    setActiveTabState(tab);
    if (typeof window !== "undefined") sessionStorage.setItem("mto_driver_tab", tab);
  };
  const [wallet, setWallet] = useState<MoverWallet | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [workMode, setWorkMode] = useState<"active" | "history">("active");
  const [selectedMessagesBookingId, setSelectedMessagesBookingId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);
  const [isOnline, setIsOnline] = useState(false);
  const [presenceError, setPresenceError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastCoordsRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const [driverPlace, setDriverPlace] = useState<MapPlace | null>(null);
  const [driverTelemetry, setDriverTelemetry] = useState<{
    speedMps: number | null;
    heading: number | null;
    accuracy: number | null;
  } | null>(null);
  const prevActionableBookingsRef = useRef(0);

  useEffect(() => {
    const saved = sessionStorage.getItem("mto_driver_tab");
    if (saved === "negotiations" || saved === "bookings") setActiveTabState("work");
    else if (
      saved === "overview" ||
      saved === "messages" ||
      saved === "jobs" ||
      saved === "work" ||
      saved === "pay"
    ) {
      setActiveTabState(saved);
    }
  }, []);

  const sendPresence = useCallback(async (online: boolean, coords?: { latitude: number; longitude: number }) => {
    try {
      await moversApi.updatePresence({ isOnline: online, latitude: coords?.latitude, longitude: coords?.longitude });
      setPresenceError(null);
    } catch (e) {
      setPresenceError(e instanceof Error ? e.message : "Could not update online status");
    }
  }, []);

  const applyCoords = useCallback((
    latitude: number,
    longitude: number,
    extras?: { speedMps?: number | null; heading?: number | null; accuracy?: number | null },
  ) => {
    lastCoordsRef.current = { latitude, longitude };
    setDriverPlace({ address: "You", lat: latitude, lng: longitude });
    setDriverTelemetry({
      speedMps: extras?.speedMps ?? null,
      heading: extras?.heading ?? null,
      accuracy: extras?.accuracy ?? null,
    });
  }, []);

  const geoErrorMessage = (err: GeolocationPositionError) => {
    if (err.code === 1) return "Location permission denied - allow location in browser settings, then try again.";
    if (err.code === 2) return "Location unavailable - turn on device GPS and try again.";
    if (err.code === 3) return "Location timed out - move to an open area or try again.";
    return "Could not read your location";
  };

  const resolveDriverCoords = useCallback(
    (timeoutMs = 15000): Promise<{ latitude: number; longitude: number }> =>
      new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation is not available in this browser"));
          return;
        }
        if (lastCoordsRef.current) {
          resolve(lastCoordsRef.current);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = { latitude: position.coords.latitude, longitude: position.coords.longitude };
            applyCoords(coords.latitude, coords.longitude, {
              speedMps: position.coords.speed,
              heading: position.coords.heading,
              accuracy: position.coords.accuracy,
            });
            resolve(coords);
          },
          (err) => reject(new Error(geoErrorMessage(err))),
          { enableHighAccuracy: true, maximumAge: 5000, timeout: timeoutMs },
        );
      }),
    [applyCoords],
  );

  const stopWatching = useCallback(() => {
    if (watchIdRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation || watchIdRef.current != null) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        applyCoords(position.coords.latitude, position.coords.longitude, {
          speedMps: position.coords.speed,
          heading: position.coords.heading,
          accuracy: position.coords.accuracy,
        });
        setPresenceError(null);
      },
      (err) => setPresenceError(geoErrorMessage(err)),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 },
    );
  }, [applyCoords]);

  const goOffline = useCallback(async () => {
    stopWatching();
    setIsOnline(false);
    setDriverPlace(null);
    setDriverTelemetry(null);
    lastCoordsRef.current = null;
    await sendPresence(false);
  }, [sendPresence, stopWatching]);

  const goOnline = useCallback(async () => {
    if (!navigator.geolocation) {
      setPresenceError("Geolocation is not available in this browser");
      return false;
    }
    try {
      const coords = await resolveDriverCoords();
      startWatching();
      setIsOnline(true);
      await sendPresence(true, coords);
      setPresenceError(null);
      return true;
    } catch (e) {
      setPresenceError(e instanceof Error ? e.message : "Could not get your location");
      setIsOnline(false);
      return false;
    }
  }, [resolveDriverCoords, sendPresence, startWatching]);

  useEffect(() => {
    if (!isOnline) return;
    const pushLocation = () => {
      const coords = lastCoordsRef.current;
      if (coords) void sendPresence(true, coords);
    };
    pushLocation();
    const timer = setInterval(pushLocation, 30000);
    return () => clearInterval(timer);
  }, [isOnline, sendPresence]);

  useEffect(() => {
    return () => {
      stopWatching();
      void sendPresence(false);
    };
  }, [sendPresence, stopWatching]);

  const toggleOnline = async () => {
    if (isOnline) await goOffline();
    else await goOnline();
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reqs, bks] = await Promise.all([moversApi.availableRequests(), moversApi.listBookings()]);
      const hydrated = await withTrackingHydrated(bks);
      setRequests(reqs);
      setBookings(hydrated);
      const actionable = bks.filter((b) => b.status === "in_progress" || b.status === "confirmed");
      if (actionable.length > prevActionableBookingsRef.current && prevActionableBookingsRef.current > 0) {
        setActiveTab("work");
        setSelectedWorkId(actionable[0]?.id ?? null);
      }
      prevActionableBookingsRef.current = actionable.length;
      if (!selectedWorkId && bks.length) {
        setSelectedWorkId(bks.find((b) => b.status === "in_progress" || b.status === "confirmed")?.id ?? bks[0].id);
      }
      if (!selectedWorkId && reqs.length) {
        const negotiating = reqs.filter((r) => {
          const q = r.quotes?.find((quote) => quote.moverId === user?.id);
          return q && (q.status === "countered" || (q.counteroffers?.length ?? 0) > 0);
        });
        if (negotiating[0]) setSelectedWorkId(negotiating[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load driver data");
    } finally {
      setLoading(false);
    }
  }, [selectedWorkId, user?.id]);

  const refreshMessageUnread = useCallback(async () => {
    try {
      const list = await messagesApi.listConversations();
      setConversations(list);
      setMessageUnreadCount(list.reduce((sum, c) => sum + c.unreadCount, 0));
    } catch {
      setConversations([]);
      setMessageUnreadCount(0);
    }
  }, []);

  const refreshWallet = useCallback(async () => {
    setWalletLoading(true);
    try {
      setWallet(await moversApi.getWallet());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load wallet");
    } finally {
      setWalletLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 15000);
    return () => clearInterval(t);
  }, [refresh]);

  useEffect(() => {
    void refreshMessageUnread();
    const t = setInterval(() => void refreshMessageUnread(), 15000);
    return () => clearInterval(t);
  }, [refreshMessageUnread]);

  useEffect(() => {
    if (activeTab !== "pay" && activeTab !== "overview") return;
    void refreshWallet();
    const t = setInterval(() => void refreshWallet(), 20000);
    return () => clearInterval(t);
  }, [activeTab, refreshWallet]);

  const myQuoteFor = (request: MovingRequest) => request.quotes?.find((q) => q.moverId === user?.id);
  const negotiationJobs = requests.filter((r) => {
    const q = myQuoteFor(r);
    return q && (q.status === "countered" || (q.counteroffers?.length ?? 0) > 0);
  });
  const activeBookings = bookings.filter((b) => b.status === "in_progress" || b.status === "confirmed");
  const historyCount = countHistoryBookings(bookings);
  const openDisputeCount = countOpenDisputeBookings(bookings);
  const profile = user?.moverProfile;
  const verified = profile?.isVerified;

  const submitQuote = async (requestId: string, price: number, estimatedHours: number, notes?: string) => {
    setBusyId(requestId);
    setError(null);
    try {
      await moversApi.submitQuote(requestId, price, estimatedHours, notes);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit quote");
    } finally {
      setBusyId(null);
    }
  };

  const sendDriverCounter = async (quote: Quote, price: number, notes?: string) => {
    setNegotiationBusyId(quote.id);
    setError(null);
    try {
      await moversApi.counteroffer(quote.id, price, notes);
      await refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send counteroffer");
      return false;
    } finally {
      setNegotiationBusyId(null);
    }
  };

  const acceptCustomerCounter = async (quote: Quote) => {
    setNegotiationBusyId(quote.id);
    setError(null);
    try {
      await moversApi.respondCounteroffer(quote.id, true);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not accept counteroffer");
    } finally {
      setNegotiationBusyId(null);
    }
  };

  const acceptJob = async (bookingId: string) => {
    setBusyId(bookingId);
    setError(null);
    setPresenceError(null);
    try {
      const coords = await resolveDriverCoords(20000);
      if (!isOnline) {
        startWatching();
        setIsOnline(true);
        await sendPresence(true, coords);
      }
      setPresenceError(null);
      await moversApi.acceptBooking(bookingId);
      const started = await moversApi.addTracking(bookingId, {
        type: "status_update",
        status: "En route to pickup",
        note: "Mover started the job",
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      setBookings((prev) =>
        mergeTrackingEvent(
          prev.map((b) => (b.id === bookingId ? { ...b, status: "in_progress" } : b)),
          bookingId,
          started,
        ),
      );
      await refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not start job";
      if (/location|permission|gps|latitude|longitude/i.test(msg)) {
        setPresenceError(msg);
      } else {
        setError(msg);
      }
    } finally {
      setBusyId(null);
    }
  };

  const advanceJobStage = async (bookingId: string, action: { trackingStatus: string; note: string }) => {
    if (action.trackingStatus === "Delivered") {
      await completeJob(bookingId);
      return;
    }
    setBusyId(bookingId);
    setError(null);
    try {
      const coords = lastCoordsRef.current ?? (await resolveDriverCoords(12000).catch(() => null));
      const event = await moversApi.addTracking(bookingId, {
        type: "status_update",
        status: action.trackingStatus,
        note: action.note,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });
      // Update UI immediately so next step button / status change right away
      setBookings((prev) => mergeTrackingEvent(prev, bookingId, event));
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update job status");
    } finally {
      setBusyId(null);
    }
  };

  const confirmCashReceived = async (bookingId: string) => {
    setBusyId(bookingId);
    setError(null);
    try {
      await moversApi.confirmCash(bookingId);
      await refresh();
      await refreshWallet();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not confirm cash payment");
      throw e;
    } finally {
      setBusyId(null);
    }
  };

  const completeJob = async (bookingId: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    const proofCount = (booking?.items ?? []).filter((item) => item.photoUrl && item.name === "Delivery proof").length;
    if (!proofCount) {
      setError("Upload at least one delivery proof photo before marking completed.");
      setActiveTab("work");
      setSelectedWorkId(bookingId);
      return;
    }
    setBusyId(bookingId);
    try {
      const coords = lastCoordsRef.current;
      await moversApi.addTracking(bookingId, { type: "status_update", status: "Delivered", note: "Move completed", latitude: coords?.latitude, longitude: coords?.longitude });
      await moversApi.updateBookingStatus(bookingId, "completed", "Move delivered");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not complete booking");
    } finally {
      setBusyId(null);
    }
  };

  useEffect(() => {
    if (!error) return;
    toast.error("Couldn’t complete that", error);
  }, [error, toast]);

  useEffect(() => {
    if (!presenceError) return;
    toast.warn("Location needed", presenceError);
  }, [presenceError, toast]);

  const cancelJob = async (bookingId: string) => {
    const ok = await toast.confirm({
      title: "Cancel this booking?",
      message: "The customer will be notified right away.",
      confirmLabel: "Cancel booking",
      cancelLabel: "Keep job",
      tone: "danger",
    });
    if (!ok) return;
    setBusyId(bookingId);
    setError(null);
    try {
      await bookingsApi.cancel(bookingId, "Cancelled by driver");
      toast.success("Booking cancelled", "The customer has been notified.");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not cancel booking");
    } finally {
      setBusyId(null);
    }
  };

  const uploadDeliveryProof = async (bookingId: string, photoUrl: string) => {
    setBusyId(bookingId);
    try {
      await moversApi.uploadCompletionPhoto(bookingId, photoUrl);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not upload delivery proof");
    } finally {
      setBusyId(null);
    }
  };

  useEffect(() => {
    if (!isOnline) return;
    const live = bookings.filter((b) => b.status === "in_progress");
    if (!live.length) return;
    const ping = () => {
      const coords = lastCoordsRef.current;
      if (!coords) return;
      for (const booking of live) {
        void moversApi.addTracking(booking.id, { type: "location_update", status: "On the way", latitude: coords.latitude, longitude: coords.longitude });
      }
    };
    ping();
    const timer = setInterval(ping, 20000);
    return () => clearInterval(timer);
  }, [isOnline, bookings]);

  const alerts = (
    <>
      {!verified && (
        <div style={{ paddingTop: 14 }}>
          <DriverAlert variant="warn">Your profile is pending verification. Browse jobs now - quotes unlock after admin approval.</DriverAlert>
        </div>
      )}
      {presenceError && (
        <div style={{ paddingTop: 10 }}>
          <DriverAlert variant="error">{presenceError}</DriverAlert>
        </div>
      )}
      {error && (
        <div style={{ paddingTop: 10 }}>
          <DriverAlert variant="error">{error}</DriverAlert>
        </div>
      )}
    </>
  );

  const openFromNotification = async (n: Notification) => {
    const action = resolveDriverNotificationAction(n);
    switch (action.kind) {
      case "messages":
        if (action.bookingId) setSelectedMessagesBookingId(action.bookingId);
        setActiveTab("messages");
        break;
      case "pay":
        setActiveTab("pay");
        break;
      case "jobs":
        setActiveTab("jobs");
        void refresh();
        break;
      case "work": {
        let workId = action.workId ?? action.bookingId ?? action.requestId ?? null;
        if (!workId && action.quoteId) {
          const match = requests.find((r) => r.quotes?.some((q) => q.id === action.quoteId));
          workId = match?.id ?? null;
        }
        if (workId) setSelectedWorkId(workId);
        setActiveTab("work");
        void refresh();
        break;
      }
      default:
        setActiveTab("overview");
        break;
    }
  };

  return (
    <DriverDashboardShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      counts={{ messages: messageUnreadCount, jobs: requests.length, work: negotiationJobs.length + activeBookings.length }}
      businessName={profile?.businessName ?? user?.email ?? "Driver"}
      avatarUrl={profile?.avatarUrl}
      isOnline={isOnline}
      onToggleOnline={() => void toggleOnline()}
      onLogout={() => logout()}
      alerts={alerts}
      onOpenNotification={openFromNotification}
    >
      <div key={activeTab} className="app-screen-motion driver-app-motion">
      {activeTab === "overview" && (
        <DriverOverviewPanel
          businessName={profile?.businessName ?? user?.email ?? "Driver"}
          verified={!!verified}
          isOnline={isOnline}
          presenceError={presenceError}
          wallet={wallet}
          walletLoading={walletLoading}
          requests={requests}
          negotiationJobs={negotiationJobs}
          activeBookings={activeBookings}
          conversations={conversations}
          messageUnreadCount={messageUnreadCount}
          busyId={busyId}
          negotiationBusyId={negotiationBusyId}
          myQuoteFor={myQuoteFor}
          onGoOnline={() => void toggleOnline()}
          onGoJobs={() => setActiveTab("jobs")}
          onGoWork={() => setActiveTab("work")}
          onGoMessages={() => setActiveTab("messages")}
          onGoWallet={() => setActiveTab("pay")}
          onOpenBooking={(id) => {
            setSelectedWorkId(id);
            setActiveTab("work");
          }}
          onOpenNegotiation={(requestId) => {
            setSelectedWorkId(requestId);
            setActiveTab("work");
          }}
          onOpenConversation={(bookingId) => {
            setSelectedMessagesBookingId(bookingId);
            setActiveTab("messages");
          }}
          onStart={acceptJob}
          onAdvanceStage={advanceJobStage}
          onOpenProof={(bookingId) => {
            setSelectedWorkId(bookingId);
            setActiveTab("work");
          }}
          onAcceptCounter={acceptCustomerCounter}
          onConfirmCash={confirmCashReceived}
        />
      )}

      {activeTab === "messages" && user?.id && (
        <DriverPanel noPadding style={{ minHeight: 0, height: "100%", display: "flex", flexDirection: "column", background: "transparent", border: "none", flex: 1 }}>
          <MessagesInbox
            myUserId={user.id}
            selectedBookingId={selectedMessagesBookingId}
            onSelectBooking={setSelectedMessagesBookingId}
            variant="driver"
          />
        </DriverPanel>
      )}

      {activeTab === "jobs" && (
        <JobsPanel
          requests={requests}
          loading={loading}
          verified={!!verified}
          busyId={busyId}
          myQuoteFor={myQuoteFor}
          onSubmitQuote={submitQuote}
        />
      )}

      {activeTab === "work" && (
        <div className={responsive.workSection}>
          <DriverWorkModeTabs
            mode={workMode}
            onChange={setWorkMode}
            activeCount={negotiationJobs.length + activeBookings.length}
            historyCount={historyCount}
            disputeCount={openDisputeCount}
          />
          {workMode === "active" ? (
            <DriverWorkPanel
              negotiationJobs={negotiationJobs}
              bookings={bookings}
              selectedId={selectedWorkId}
              onSelect={setSelectedWorkId}
              myQuoteFor={myQuoteFor}
              negotiationBusyId={negotiationBusyId}
              onSendCounter={sendDriverCounter}
              onAcceptCounter={acceptCustomerCounter}
              busyId={busyId}
              onStart={acceptJob}
              onAdvanceStage={advanceJobStage}
              onCancel={cancelJob}
              onUploadProof={uploadDeliveryProof}
              onConfirmCash={confirmCashReceived}
              driverPlace={driverPlace}
              driverTelemetry={driverTelemetry}
              myUserId={user?.id ?? ""}
            />
          ) : (
            <DriverHistoryPanel
              bookings={bookings}
              selectedId={selectedHistoryId}
              onSelect={setSelectedHistoryId}
              myUserId={user?.id ?? ""}
            />
          )}
        </div>
      )}

      {activeTab === "pay" && <MoverPayDashboard wallet={wallet} loading={walletLoading} onRefresh={() => void refreshWallet()} embedded />}
      </div>
    </DriverDashboardShell>
  );
}

function JobsPanel({
  requests,
  loading,
  verified,
  busyId,
  myQuoteFor,
  onSubmitQuote,
}: {
  requests: MovingRequest[];
  loading: boolean;
  verified: boolean;
  busyId: string | null;
  myQuoteFor: (r: MovingRequest) => Quote | undefined;
  onSubmitQuote: (id: string, price: number, estimatedHours: number, notes?: string) => void;
}) {
  const quotedCount = requests.filter((request) => Boolean(myQuoteFor(request))).length;
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const selected = requests.find((request) => request.id === selectedJobId) ?? null;
  const selectedQuote = selected ? myQuoteFor(selected) : undefined;
  const selectedNegotiation =
    selectedQuote && (selectedQuote.status === "countered" || (selectedQuote.counteroffers?.length ?? 0) > 0);
  const selectedEstimate =
    selected?.estimatedPrice != null ? Math.round(Number(selected.estimatedPrice)) : null;

  return (
    <div className={sectionStyles.section}>
      <div className={sectionStyles.hero}>
        <div className={sectionStyles.heroContent}>
          <div className={sectionStyles.eyebrow}>Opportunity board</div>
          <h2 className={sectionStyles.title}>Find your next move</h2>
          <p className={sectionStyles.description}>
            Compare distance, timing and budget at a glance. Set your price when a job fits your shift.
          </p>
        </div>
        <div className={sectionStyles.heroStats}>
          <div className={sectionStyles.heroStat}>
            <div className={sectionStyles.heroStatValue}>{requests.length}</div>
            <div className={sectionStyles.heroStatLabel}>Open</div>
          </div>
          <div className={sectionStyles.heroStat}>
            <div className={sectionStyles.heroStatValue}>{quotedCount}</div>
            <div className={sectionStyles.heroStatLabel}>Quoted</div>
          </div>
          <div className={sectionStyles.heroStat}>
            <div className={sectionStyles.heroStatValue}>{verified ? "Ready" : "Pending"}</div>
            <div className={sectionStyles.heroStatLabel}>Profile</div>
          </div>
        </div>
      </div>

      <div className={sectionStyles.mobileBar} aria-label="Job filters">
        <span className={`${sectionStyles.mobileChip} ${sectionStyles.mobileChipAccent}`}>
          Open · {requests.length}
        </span>
        <span className={sectionStyles.mobileChip}>Quoted · {quotedCount}</span>
        <span className={sectionStyles.mobileChip}>{verified ? "Ready to quote" : "Verify pending"}</span>
      </div>

      {loading ? (
        <DriverPanel>
          <BlockLoader label="Loading open jobs…" minHeight={280} />
        </DriverPanel>
      ) : !requests.length ? (
        <DriverPanel>
          <EmptyState icon={<EmptyStateIcon name="search" />} title="No jobs right now" description="Go online and check back — new move requests appear here automatically." />
        </DriverPanel>
      ) : (
        <>
          <div className={sectionStyles.grid}>
            {requests.map((r) => {
              const myQuote = myQuoteFor(r);
              const inNegotiation = myQuote && (myQuote.status === "countered" || (myQuote.counteroffers?.length ?? 0) > 0);
              const estimate = r.estimatedPrice != null ? Math.round(Number(r.estimatedPrice)) : null;
              return (
                <DriverOpenJobCard
                  key={r.id}
                  customerName={customerDisplayName(r.customer)}
                  avatarUrl={r.customer?.customerProfile?.avatarUrl}
                  pickup={r.pickupAddress}
                  destination={r.destinationAddress}
                  itemCount={r.items?.length ?? 0}
                  moveDate={formatMovingRequestWhen(r)}
                  distanceKm={r.distanceKm != null ? Number(r.distanceKm) : null}
                  estimatedPrice={estimate}
                  defaultPrice={estimate || 0}
                  myQuotePrice={myQuote ? Number(myQuote.price) : null}
                  myQuoteHours={myQuote?.estimatedHours != null ? Number(myQuote.estimatedHours) : null}
                  myQuoteNotes={myQuote?.notes}
                  inNegotiation={!!inNegotiation}
                  verified={verified}
                  busy={busyId === r.id}
                  onQuote={(price, estimatedHours, notes) => onSubmitQuote(r.id, price, estimatedHours, notes)}
                />
              );
            })}
          </div>

          <div className={sectionStyles.list}>
            {requests.map((r) => {
              const myQuote = myQuoteFor(r);
              const inNegotiation = myQuote && (myQuote.status === "countered" || (myQuote.counteroffers?.length ?? 0) > 0);
              const estimate = r.estimatedPrice != null ? Math.round(Number(r.estimatedPrice)) : null;
              return (
                <DriverJobListRow
                  key={`row-${r.id}`}
                  customerName={customerDisplayName(r.customer)}
                  avatarUrl={r.customer?.customerProfile?.avatarUrl}
                  pickup={r.pickupAddress}
                  destination={r.destinationAddress}
                  itemCount={r.items?.length ?? 0}
                  moveDate={formatMovingRequestWhen(r)}
                  distanceKm={r.distanceKm != null ? Number(r.distanceKm) : null}
                  estimatedPrice={estimate}
                  myQuotePrice={myQuote ? Number(myQuote.price) : null}
                  inNegotiation={!!inNegotiation}
                  onOpen={() => setSelectedJobId(r.id)}
                />
              );
            })}
          </div>
        </>
      )}

      <MoveSheet
        title={selected ? `Quote · ${customerDisplayName(selected.customer)}` : "Quote job"}
        open={Boolean(selected)}
        onClose={() => setSelectedJobId(null)}
        width={460}
        half
        mobileModal
      >
        {selected && (
          <DriverOpenJobCard
            customerName={customerDisplayName(selected.customer)}
            avatarUrl={selected.customer?.customerProfile?.avatarUrl}
            pickup={selected.pickupAddress}
            destination={selected.destinationAddress}
            itemCount={selected.items?.length ?? 0}
            moveDate={formatMovingRequestWhen(selected)}
            distanceKm={selected.distanceKm != null ? Number(selected.distanceKm) : null}
            estimatedPrice={selectedEstimate}
            defaultPrice={selectedEstimate || 0}
            myQuotePrice={selectedQuote ? Number(selectedQuote.price) : null}
            myQuoteHours={selectedQuote?.estimatedHours != null ? Number(selectedQuote.estimatedHours) : null}
            myQuoteNotes={selectedQuote?.notes}
            inNegotiation={!!selectedNegotiation}
            verified={verified}
            busy={busyId === selected.id}
            embedded
            onQuote={(price, estimatedHours, notes) => {
              onSubmitQuote(selected.id, price, estimatedHours, notes);
              setSelectedJobId(null);
            }}
          />
        )}
      </MoveSheet>
    </div>
  );
}
