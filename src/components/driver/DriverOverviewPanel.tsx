"use client";

import { DriverJobProgress, driverJobStageLabel } from "@/components/driver/DriverJobProgress";
import { DriverPrimaryButton } from "@/components/driver/DriverDashboardShell";
import { placesFromBookingRecord } from "@/components/move/JobPanels";
import { UserAvatar } from "@/components/ui/AppUi";
import { AppIcon } from "@/components/ui/Icons";
import { customerDisplayName } from "@/lib/displayNames";
import { deliveryProofCount, resolveDriverJobStage } from "@/lib/driverJobFlow";
import { formatMovingRequestWhen } from "@/lib/requestSchedule";
import { quoteNegotiationMeta } from "@/lib/negotiation";
import { isPastPickupStage } from "@/lib/trackingDisplay";
import { toLatLng } from "@/lib/maps";
import type { Booking, Conversation, MoverWallet, MovingRequest, Quote } from "@/lib/api/types";
import styles from "./DriverOverviewPanel.module.css";

type AttentionItem = {
  id: string;
  title: string;
  sub: string;
  tone: "accent" | "warn" | "ok" | "neutral";
  onClick: () => void;
};

export function DriverOverviewPanel({
  businessName,
  verified,
  isOnline,
  presenceError,
  wallet,
  walletLoading,
  requests,
  negotiationJobs,
  activeBookings,
  conversations,
  messageUnreadCount,
  busyId,
  negotiationBusyId,
  myQuoteFor,
  onGoOnline,
  onGoJobs,
  onGoWork,
  onGoMessages,
  onGoWallet,
  onOpenBooking,
  onOpenNegotiation,
  onOpenConversation,
  onStart,
  onAdvanceStage,
  onOpenProof,
  onAcceptCounter,
  onConfirmCash,
}: {
  businessName: string;
  verified: boolean;
  isOnline: boolean;
  presenceError: string | null;
  wallet: MoverWallet | null;
  walletLoading: boolean;
  requests: MovingRequest[];
  negotiationJobs: MovingRequest[];
  activeBookings: Booking[];
  conversations: Conversation[];
  messageUnreadCount: number;
  busyId: string | null;
  negotiationBusyId: string | null;
  myQuoteFor: (r: MovingRequest) => Quote | undefined;
  onGoOnline: () => void;
  onGoJobs: () => void;
  onGoWork: () => void;
  onGoMessages: () => void;
  onGoWallet: () => void;
  onOpenBooking: (id: string) => void;
  onOpenNegotiation: (requestId: string) => void;
  onOpenConversation: (bookingId: string) => void;
  onStart: (id: string) => Promise<void>;
  onAdvanceStage: (bookingId: string, action: { trackingStatus: string; note: string }) => Promise<void>;
  onOpenProof: (bookingId: string) => void;
  onAcceptCounter: (quote: Quote) => Promise<void>;
  onConfirmCash?: (bookingId: string) => Promise<void>;
}) {
  const activeBooking = pickPriorityBooking(activeBookings);
  const openJobs = rankOpenJobs(requests, myQuoteFor).slice(0, 3);
  const talks = rankNegotiations(negotiationJobs, myQuoteFor).slice(0, 3);
  const recentMessages = [...conversations]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);
  const latestPayment = wallet?.payments?.[0] ?? null;
  const attention = buildAttentionItems({
    verified,
    presenceError,
    isOnline,
    messageUnreadCount,
    activeBooking,
    talks: negotiationJobs,
    myQuoteFor,
    onGoOnline,
    onGoJobs,
    onGoMessages,
    onOpenBooking,
    onOpenNegotiation,
    onOpenProof,
  });

  const firstName = businessName.split(/\s+/)[0] || "Driver";
  const balance = wallet?.availableBalance ?? 0;

  return (
    <div className={styles.root}>
      <section className={styles.shiftHero}>
        <div className={styles.shiftCard}>
          <div className={styles.shiftTop}>
            <div>
              <p className={styles.eyebrow}>{isOnline ? "Live shift" : "Shift offline"}</p>
              <h2 className={styles.greeting}>Hey {firstName}</h2>
              <p className={styles.subcopy}>
                {activeBooking
                  ? "Your next task is ready — stay focused on the current stop."
                  : isOnline
                    ? "You’re online. New jobs and price talks will show up here first."
                    : "Go online to get requests, share live GPS, and unlock the command center."}
              </p>
            </div>
            <button
              type="button"
              className={`${styles.onlineToggle} ${isOnline ? styles.onlineToggleOn : styles.onlineToggleOff}`}
              onClick={onGoOnline}
            >
              {isOnline ? "Go offline" : "Go online"}
            </button>
          </div>

          <div className={styles.metricRow}>
            <button type="button" className={styles.metric} onClick={onGoWallet}>
              <div className={styles.metricLabel}>Balance</div>
              <div className={styles.metricValue}>{walletLoading && !wallet ? "…" : `$${balance.toFixed(0)}`}</div>
              <div className={styles.metricHint}>After platform fee</div>
            </button>
            <button type="button" className={styles.metric} onClick={onGoWork}>
              <div className={styles.metricLabel}>Active work</div>
              <div className={styles.metricValue}>{activeBookings.length + negotiationJobs.length}</div>
              <div className={styles.metricHint}>Jobs & price talks</div>
            </button>
            <button type="button" className={styles.metric} onClick={onGoJobs}>
              <div className={styles.metricLabel}>Open jobs</div>
              <div className={styles.metricValue}>{requests.length}</div>
              <div className={styles.metricHint}>Ready to quote</div>
            </button>
          </div>

          <div className={styles.liveChip}>
            <span className={`${styles.liveDot} ${isOnline ? "" : styles.liveDotOff}`} />
            {isOnline
              ? messageUnreadCount > 0
                ? `${messageUnreadCount} unread · sharing live GPS`
                : "Online · sharing live GPS"
              : "Offline · customers can’t see you yet"}
          </div>
        </div>

        {activeBooking ? (
          <ActiveTaskCard
            booking={activeBooking}
            busy={busyId === activeBooking.id}
            onOpen={() => onOpenBooking(activeBooking.id)}
            onMessage={() => onOpenConversation(activeBooking.id)}
            onStart={() => void onStart(activeBooking.id)}
            onAdvance={(action) => void onAdvanceStage(activeBooking.id, action)}
            onOpenProof={() => onOpenProof(activeBooking.id)}
            onConfirmCash={onConfirmCash ? () => onConfirmCash(activeBooking.id) : undefined}
          />
        ) : (
          <div className={`${styles.taskHero} ${styles.taskHeroEmpty}`}>
            <div className={styles.radar} aria-hidden>
              <span className={`${styles.ring} ${styles.ringOne}`} />
              <span className={`${styles.ring} ${styles.ringTwo}`} />
              <span className={`${styles.ring} ${styles.ringThree}`} />
              <span className={styles.brandMark}>M</span>
              <span className={`${styles.moverDot} ${styles.moverOne}`} />
              <span className={`${styles.moverDot} ${styles.moverTwo}`} />
            </div>
            <div>
              <p className={styles.sectionLabel}>Opportunity radar</p>
              <h3 className={styles.taskTitle}>
                {requests.length > 0 ? `${requests.length} jobs nearby` : "Waiting for jobs"}
              </h3>
              <p className={styles.taskMeta}>
                {verified
                  ? "Quotes unlock instantly when you find a good match."
                  : "Browse now — quoting unlocks after verification."}
              </p>
            </div>
            <div className={styles.taskActions} style={{ gridTemplateColumns: "1fr 1fr" }}>
              <button type="button" className={styles.primaryBtn} onClick={onGoJobs}>
                Find jobs
              </button>
              <button type="button" className={styles.ghostBtn} onClick={onGoWork}>
                My jobs
              </button>
            </div>
          </div>
        )}
      </section>

      <section className={styles.actionRail} aria-label="Quick actions">
        {[
          { label: "My jobs", sub: `${activeBookings.length + negotiationJobs.length} active`, icon: "myJobs" as const, accent: activeBookings.length > 0, onClick: onGoWork },
          { label: "Find jobs", sub: `${requests.length} open`, icon: "search" as const, accent: false, onClick: onGoJobs },
          { label: "Messages", sub: messageUnreadCount ? `${messageUnreadCount} unread` : "Chat", icon: "messages" as const, accent: messageUnreadCount > 0, onClick: onGoMessages },
          { label: "Wallet", sub: wallet ? `$${wallet.tipEarnings.toFixed(0)} tips` : "Earnings", icon: "wallet" as const, accent: false, onClick: onGoWallet },
        ].map((item) => (
          <button key={item.label} type="button" className={styles.actionTile} onClick={item.onClick}>
            <span className={`${styles.actionIcon} ${item.accent ? styles.actionIconAccent : ""}`}>
              <AppIcon name={item.icon} size={18} />
            </span>
            <span className={styles.actionLabel}>{item.label}</span>
            <span className={styles.actionSub}>{item.sub}</span>
          </button>
        ))}
      </section>

      {attention.length > 0 && (
        <section>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>Needs attention</h3>
          </div>
          <div className={styles.attentionRail}>
            {attention.map((item) => (
              <button key={item.id} type="button" className={styles.attentionCard} onClick={item.onClick}>
                <div className={styles.rowBody}>
                  <div className={styles.rowTitle}>{item.title}</div>
                  <div className={styles.rowSub} style={{ whiteSpace: "normal" }}>{item.sub}</div>
                  <span className={`${styles.badge} ${badgeClass(item.tone)}`}>Action needed</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className={styles.bento}>
        <div className={`${styles.panel} ${styles.spanTwo}`}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>Best open jobs</h3>
            <button type="button" className={styles.linkBtn} onClick={onGoJobs}>View all</button>
          </div>
          <div className={styles.stack}>
            {openJobs.length === 0 ? (
              <div className={styles.emptyInline}>No open requests right now. Stay online and check back.</div>
            ) : (
              openJobs.map((request) => {
                const quote = myQuoteFor(request);
                const estimate = request.estimatedPrice != null ? Math.round(Number(request.estimatedPrice)) : null;
                return (
                  <button key={request.id} type="button" className={styles.rowBtn} onClick={onGoJobs}>
                    <UserAvatar
                      name={customerDisplayName(request.customer)}
                      imageUrl={request.customer?.customerProfile?.avatarUrl}
                      size={40}
                    />
                    <div className={styles.rowBody}>
                      <div className={styles.rowTitle}>
                        <span>{customerDisplayName(request.customer)}</span>
                        <span className={styles.rowPrice}>
                          {quote ? `$${Number(quote.price).toFixed(0)}` : estimate != null ? `~$${estimate}` : "Quote"}
                        </span>
                      </div>
                      <div className={styles.rowSub}>
                        {request.pickupAddress} → {request.destinationAddress}
                      </div>
                      <span className={`${styles.badge} ${quote ? styles.badgeAccent : ""}`}>
                        {quote ? "Your quote sent" : formatMovingRequestWhen(request)}
                        {request.distanceKm != null ? ` · ${Number(request.distanceKm).toFixed(0)} km` : ""}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>Price talks</h3>
            <button type="button" className={styles.linkBtn} onClick={onGoWork}>Open</button>
          </div>
          <div className={styles.stack}>
            {talks.length === 0 ? (
              <div className={styles.emptyInline}>No active negotiations.</div>
            ) : (
              talks.map((request) => {
                const quote = myQuoteFor(request);
                if (!quote) return null;
                const meta = quoteNegotiationMeta(quote);
                const driverTurn = Boolean(meta.waitingOnMover);
                return (
                  <button
                    key={request.id}
                    type="button"
                    className={styles.rowBtn}
                    onClick={() => onOpenNegotiation(request.id)}
                  >
                    <div className={styles.rowBody}>
                      <div className={styles.rowTitle}>
                        <span>{customerDisplayName(request.customer)}</span>
                        <span className={styles.rowPrice}>${Number(meta.latest?.price ?? quote.price).toFixed(0)}</span>
                      </div>
                      <div className={styles.rowSub}>
                        {request.pickupAddress} → {request.destinationAddress}
                      </div>
                      <span className={`${styles.badge} ${driverTurn ? styles.badgeAccent : styles.badge}`}>
                        {driverTurn ? "Your response needed" : meta.statusLabel}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
          {talks.some((r) => {
            const q = myQuoteFor(r);
            return q && quoteNegotiationMeta(q).waitingOnMover;
          }) && (
            <div style={{ marginTop: 10 }}>
              {talks.slice(0, 1).map((request) => {
                const quote = myQuoteFor(request);
                if (!quote || !quoteNegotiationMeta(quote).waitingOnMover) return null;
                return (
                  <DriverPrimaryButton
                    key={`accept-${request.id}`}
                    variant="accent"
                    fullWidth
                    disabled={negotiationBusyId === quote.id}
                    onClick={() => void onAcceptCounter(quote)}
                  >
                    {negotiationBusyId === quote.id ? "Accepting…" : `Accept $${Number(quoteNegotiationMeta(quote).latest?.price ?? quote.price).toFixed(0)}`}
                  </DriverPrimaryButton>
                );
              })}
            </div>
          )}
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>Recent messages</h3>
            <button type="button" className={styles.linkBtn} onClick={onGoMessages}>Inbox</button>
          </div>
          <div className={styles.stack}>
            {recentMessages.length === 0 ? (
              <div className={styles.emptyInline}>No chats yet. Start a job to unlock messaging.</div>
            ) : (
              recentMessages.map((conversation) => (
                <button
                  key={conversation.bookingId}
                  type="button"
                  className={styles.rowBtn}
                  onClick={() => onOpenConversation(conversation.bookingId)}
                >
                  <UserAvatar name={conversation.partnerName} imageUrl={conversation.partner?.customerProfile?.avatarUrl} size={40} />
                  <div className={styles.rowBody}>
                    <div className={styles.rowTitle}>
                      <span>{conversation.partnerName}</span>
                      {conversation.unreadCount > 0 && (
                        <span className={`${styles.badge} ${styles.badgeAccent}`}>{conversation.unreadCount}</span>
                      )}
                    </div>
                    <div className={styles.rowSub}>
                      {conversation.lastMessage?.content || conversation.routePreview || "Open conversation"}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className={`${styles.panel} ${styles.spanTwo}`}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>Earnings snapshot</h3>
            <button type="button" className={styles.linkBtn} onClick={onGoWallet}>Wallet</button>
          </div>
          <div className={styles.earningsGrid}>
            <div className={styles.earnStat}>
              <div className={styles.earnLabel}>Available</div>
              <div className={styles.earnValue}>{walletLoading && !wallet ? "…" : `$${balance.toFixed(0)}`}</div>
            </div>
            <div className={styles.earnStat}>
              <div className={styles.earnLabel}>Lifetime</div>
              <div className={styles.earnValue}>${(wallet?.lifetimeEarnings ?? 0).toFixed(0)}</div>
            </div>
            <div className={styles.earnStat}>
              <div className={styles.earnLabel}>Tips</div>
              <div className={styles.earnValue}>${(wallet?.tipEarnings ?? 0).toFixed(0)}</div>
            </div>
            <div className={styles.earnStat}>
              <div className={styles.earnLabel}>Completed</div>
              <div className={styles.earnValue}>{wallet?.completedJobs ?? 0}</div>
            </div>
          </div>
          {latestPayment ? (
            <button type="button" className={styles.rowBtn} style={{ marginTop: 10 }} onClick={onGoWallet}>
              <div className={styles.rowBody}>
                <div className={styles.rowTitle}>
                  <span>Latest payout</span>
                  <span className={styles.rowPrice}>${Number(latestPayment.net).toFixed(0)}</span>
                </div>
                <div className={styles.rowSub}>
                  {latestPayment.customerName}
                  {latestPayment.route ? ` · ${latestPayment.route.pickup} → ${latestPayment.route.destination}` : ""}
                </div>
                <span className={`${styles.badge} ${styles.badgeOk}`}>{latestPayment.kind} · {latestPayment.status}</span>
              </div>
            </button>
          ) : (
            <div className={styles.emptyInline} style={{ marginTop: 10 }}>Completed jobs will show payouts here.</div>
          )}
        </div>
      </section>
    </div>
  );
}

function ActiveTaskCard({
  booking,
  busy,
  onOpen,
  onMessage,
  onStart,
  onAdvance,
  onOpenProof,
  onConfirmCash,
}: {
  booking: Booking;
  busy: boolean;
  onOpen: () => void;
  onMessage: () => void;
  onStart: () => void;
  onAdvance: (action: { trackingStatus: string; note: string }) => void;
  onOpenProof: () => void;
  onConfirmCash?: () => Promise<void> | void;
}) {
  const proofCount = deliveryProofCount(booking);
  const customer = customerDisplayName(booking.customer);
  const places = placesFromBookingRecord(booking);
  const driverLeg = isPastPickupStage(booking.trackingEvents ?? []) ? "dropoff" : "pickup";
  const currentStop = driverLeg === "dropoff" ? places.destination : places.pickup;
  const stopAddress = currentStop?.address || (driverLeg === "dropoff" ? "Drop-off" : "Pickup");
  const coords = toLatLng(currentStop);

  const openNavigation = () => {
    const destination = coords ? `${coords.lat},${coords.lng}` : stopAddress;
    if (!destination) return;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={styles.taskHero}>
      <p className={styles.sectionLabel}>Next task · {driverJobStageLabel(booking) ?? "Active"}</p>
      <h3 className={styles.taskTitle}>{customer}</h3>
      <p className={styles.taskMeta}>
        ${Number(booking.price).toFixed(0)} · {stopAddress}
      </p>
      <div style={{ marginTop: 14 }}>
        <DriverJobProgress
          booking={booking}
          busy={busy}
          proofCount={proofCount}
          compact
          currentStopLabel={driverLeg === "dropoff" ? "Drop-off" : "Pickup"}
          currentStopAddress={stopAddress}
          onNavigate={openNavigation}
          onStart={onStart}
          onAdvance={onAdvance}
          onOpenProof={onOpenProof}
          onConfirmCash={onConfirmCash}
        />
      </div>
      <div className={styles.taskActions}>
        <button type="button" className={styles.darkBtn} onClick={onOpen}>
          Open job
        </button>
        <button type="button" className={styles.ghostBtn} onClick={openNavigation}>
          Navigate
        </button>
        <button type="button" className={styles.ghostBtn} onClick={onMessage}>
          Message
        </button>
      </div>
    </div>
  );
}

function pickPriorityBooking(bookings: Booking[]): Booking | null {
  const ranked = [...bookings].sort((a, b) => bookingRank(a) - bookingRank(b));
  return ranked[0] ?? null;
}

function bookingRank(booking: Booking) {
  if (booking.status === "in_progress") return 0;
  if (booking.status === "confirmed") return 1;
  return 2;
}

function rankOpenJobs(requests: MovingRequest[], myQuoteFor: (r: MovingRequest) => Quote | undefined) {
  return [...requests].sort((a, b) => {
    const aQuoted = myQuoteFor(a) ? 1 : 0;
    const bQuoted = myQuoteFor(b) ? 1 : 0;
    if (aQuoted !== bQuoted) return aQuoted - bQuoted;
    const aDist = a.distanceKm != null ? Number(a.distanceKm) : Number.POSITIVE_INFINITY;
    const bDist = b.distanceKm != null ? Number(b.distanceKm) : Number.POSITIVE_INFINITY;
    if (aDist !== bDist) return aDist - bDist;
    const aPrice = a.estimatedPrice != null ? Number(a.estimatedPrice) : 0;
    const bPrice = b.estimatedPrice != null ? Number(b.estimatedPrice) : 0;
    return bPrice - aPrice;
  });
}

function rankNegotiations(requests: MovingRequest[], myQuoteFor: (r: MovingRequest) => Quote | undefined) {
  return [...requests].sort((a, b) => {
    const aMeta = myQuoteFor(a) ? quoteNegotiationMeta(myQuoteFor(a)!) : null;
    const bMeta = myQuoteFor(b) ? quoteNegotiationMeta(myQuoteFor(b)!) : null;
    const aTurn = aMeta?.waitingOnMover ? 0 : 1;
    const bTurn = bMeta?.waitingOnMover ? 0 : 1;
    return aTurn - bTurn;
  });
}

function buildAttentionItems(input: {
  verified: boolean;
  presenceError: string | null;
  isOnline: boolean;
  messageUnreadCount: number;
  activeBooking: Booking | null;
  talks: MovingRequest[];
  myQuoteFor: (r: MovingRequest) => Quote | undefined;
  onGoOnline: () => void;
  onGoJobs: () => void;
  onGoMessages: () => void;
  onOpenBooking: (id: string) => void;
  onOpenNegotiation: (requestId: string) => void;
  onOpenProof: (bookingId: string) => void;
}): AttentionItem[] {
  const items: AttentionItem[] = [];

  if (!input.verified) {
    items.push({
      id: "verify",
      title: "Verification pending",
      sub: "You can browse jobs now. Quoting unlocks after admin approval.",
      tone: "warn",
      onClick: input.onGoJobs,
    });
  }

  if (input.presenceError) {
    items.push({
      id: "gps",
      title: "Location needed",
      sub: input.presenceError,
      tone: "warn",
      onClick: input.onGoOnline,
    });
  } else if (!input.isOnline) {
    items.push({
      id: "offline",
      title: "You’re offline",
      sub: "Go online to receive jobs and share live GPS with customers.",
      tone: "accent",
      onClick: input.onGoOnline,
    });
  }

  if (input.activeBooking) {
    const stage = resolveDriverJobStage(input.activeBooking);
    const proof = deliveryProofCount(input.activeBooking);
    if (stage === "proof_required" || (stage === "ready_to_complete" && proof === 0) || stage === "arrived_dropoff") {
      items.push({
        id: `proof-${input.activeBooking.id}`,
        title: "Upload delivery proof",
        sub: "Add at least one photo before you can complete this job.",
        tone: "accent",
        onClick: () => input.onOpenProof(input.activeBooking!.id),
      });
    } else if (input.activeBooking.status === "confirmed") {
      items.push({
        id: `start-${input.activeBooking.id}`,
        title: "Start your confirmed job",
        sub: `${customerDisplayName(input.activeBooking.customer)} is waiting for pickup.`,
        tone: "accent",
        onClick: () => input.onOpenBooking(input.activeBooking!.id),
      });
    }
  }

  for (const request of input.talks) {
    const quote = input.myQuoteFor(request);
    if (!quote) continue;
    const meta = quoteNegotiationMeta(quote);
    if (!meta.waitingOnMover) continue;
    items.push({
      id: `talk-${request.id}`,
      title: "Customer counteroffer",
      sub: `${customerDisplayName(request.customer)} offered $${Number(meta.latest?.price ?? quote.price).toFixed(0)}.`,
      tone: "accent",
      onClick: () => input.onOpenNegotiation(request.id),
    });
  }

  if (input.messageUnreadCount > 0) {
    items.push({
      id: "messages",
      title: `${input.messageUnreadCount} unread message${input.messageUnreadCount === 1 ? "" : "s"}`,
      sub: "Customers may be waiting on a reply.",
      tone: "ok",
      onClick: input.onGoMessages,
    });
  }

  return items.slice(0, 6);
}

function badgeClass(tone: AttentionItem["tone"]) {
  if (tone === "accent") return styles.badgeAccent;
  if (tone === "warn") return styles.badgeWarn;
  if (tone === "ok") return styles.badgeOk;
  return styles.badge;
}
