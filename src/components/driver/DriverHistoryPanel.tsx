"use client";

import { useMemo, useState } from "react";
import { BookingDisputeBanner } from "@/components/booking/BookingDisputeBanner";
import { DisputeThreadPanel } from "@/components/dispute/DisputeThreadPanel";
import {
  DriverListItem,
  DriverPanel,
} from "@/components/driver/DriverDashboardShell";
import {
  DeliveryProofGallery,
  PartyProfileCard,
  RouteStatsPanel,
  customerDisplayName,
  placesFromBookingRecord,
} from "@/components/move/JobPanels";
import { EmptyState } from "@/components/ui/AppUi";
import { EmptyStateIcon } from "@/components/ui/Icons";
import { useGeocodedPlace } from "@/hooks/useGeocodedPlace";
import type { Booking } from "@/lib/api/types";
import styles from "./DriverHistoryPanel.module.css";

function hasDisputes(booking: Booking) {
  return (booking.disputes ?? []).length > 0;
}

function isHistoryBooking(booking: Booking) {
  return booking.status === "completed" || booking.status === "cancelled" || hasDisputes(booking);
}

function historyRank(booking: Booking) {
  if (hasDisputes(booking) && booking.disputes?.some((d) => d.status === "open")) return 0;
  if (hasDisputes(booking)) return 1;
  if (booking.status === "completed") return 2;
  return 3;
}

export function DriverHistoryPanel({
  bookings,
  selectedId,
  onSelect,
  myUserId,
}: {
  bookings: Booking[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  myUserId: string;
}) {
  const items = useMemo(
    () =>
      bookings
        .filter(isHistoryBooking)
        .sort((a, b) => {
          const rank = historyRank(a) - historyRank(b);
          if (rank !== 0) return rank;
          return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
        }),
    [bookings],
  );

  const active = items.find((b) => b.id === selectedId) ?? items[0] ?? null;
  const [filter, setFilter] = useState<"all" | "completed" | "disputes">("all");
  const [mobileDetailOpen, setMobileDetailOpen] = useState(Boolean(selectedId));

  const visible = items.filter((booking) => {
    if (filter === "completed") return booking.status === "completed" || booking.status === "cancelled";
    if (filter === "disputes") return hasDisputes(booking);
    return true;
  });

  const selected = visible.find((b) => b.id === active?.id) ?? visible[0] ?? null;
  const places = selected ? placesFromBookingRecord(selected) : { pickup: null, destination: null };
  const pickupPlace = useGeocodedPlace(places.pickup);
  const destinationPlace = useGeocodedPlace(places.destination);
  const proofPhotos = (selected?.items ?? []).filter((item) => item.photoUrl && item.name === "Delivery proof");
  const openDisputeCount = items.filter((b) => b.disputes?.some((d) => d.status === "open")).length;

  const selectBooking = (id: string) => {
    onSelect(id);
    setMobileDetailOpen(true);
  };

  if (!items.length) {
    return (
      <DriverPanel>
        <EmptyState
          icon={<EmptyStateIcon name="clock" />}
          title="No job history yet"
          description="Completed moves and any disputes will show up here after you finish jobs."
        />
      </DriverPanel>
    );
  }

  return (
    <div className={`${styles.root} historyLayout`}>
      <div className={`${styles.listPane} ${mobileDetailOpen ? styles.mobileHidden : ""}`}>
        <div className={styles.listHeader}>
          <div className={styles.eyebrow}>Archive</div>
          <div className={styles.title}>History & disputes</div>
          <div className={styles.sub}>
            {items.length} past jobs
            {openDisputeCount > 0 ? ` · ${openDisputeCount} open dispute${openDisputeCount === 1 ? "" : "s"}` : ""}
          </div>
          <div className={styles.filters}>
            {(
              [
                { id: "all", label: "All" },
                { id: "completed", label: "Completed" },
                { id: "disputes", label: "Disputes" },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                className={`${styles.filterBtn} ${filter === item.id ? styles.filterBtnActive : ""}`}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.listBody}>
          {visible.length === 0 ? (
            <div className={styles.emptyInline}>Nothing in this filter yet.</div>
          ) : (
            visible.map((booking) => {
              const customer = customerDisplayName(booking.customer);
              const open = booking.disputes?.some((d) => d.status === "open");
              return (
                <DriverListItem
                  key={booking.id}
                  selected={booking.id === selected?.id}
                  onClick={() => selectBooking(booking.id)}
                  title={customer}
                  subtitle={`${booking.request?.pickupAddress ?? "Pickup"} → ${booking.request?.destinationAddress ?? "Drop-off"}`}
                  price={`$${Number(booking.price).toFixed(0)}`}
                  avatarName={customer}
                  avatarUrl={booking.customer?.customerProfile?.avatarUrl}
                  badge={
                    open
                      ? "Dispute open"
                      : hasDisputes(booking)
                        ? "Dispute closed"
                        : booking.status.replace(/_/g, " ")
                  }
                />
              );
            })
          )}
        </div>
      </div>

      <div className={`${styles.detailPane} ${mobileDetailOpen ? styles.mobileDetailOpen : styles.mobileDetailClosed}`}>
        {selected ? (
          <>
            <button
              type="button"
              className={styles.backButton}
              aria-label="Back to history list"
              onClick={() => setMobileDetailOpen(false)}
            >
              ← Back
            </button>
            <PartyProfileCard
              name={customerDisplayName(selected.customer)}
              imageUrl={selected.customer?.customerProfile?.avatarUrl}
              roleLabel="Customer"
              subtitle={`${selected.request?.pickupAddress ?? "Pickup"} → ${selected.request?.destinationAddress ?? "Drop-off"}`}
              phone={selected.customer?.customerProfile?.phone}
              meta={[
                { label: "Job price", value: `$${Number(selected.price).toFixed(0)}` },
                { label: "Status", value: selected.status.replace(/_/g, " ") },
              ]}
            />

            <div className={styles.metaStrip}>
              <div>
                <div className={styles.metaLabel}>Completed / updated</div>
                <div className={styles.metaValue}>
                  {new Date(selected.updatedAt || selected.createdAt).toLocaleString()}
                </div>
              </div>
              <div>
                <div className={styles.metaLabel}>Proof photos</div>
                <div className={styles.metaValue}>{proofPhotos.length}</div>
              </div>
              <div>
                <div className={styles.metaLabel}>Disputes</div>
                <div className={styles.metaValue}>{(selected.disputes ?? []).length}</div>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <RouteStatsPanel
                pickup={pickupPlace}
                destination={destinationPlace}
                showDriver={false}
                estimatedHours={selected.quote?.estimatedHours}
              />
            </div>

            {proofPhotos.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <DeliveryProofGallery photos={proofPhotos} />
              </div>
            )}

            {(selected.disputes ?? []).length > 0 ? (
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                <BookingDisputeBanner disputes={selected.disputes} />
                <DisputeThreadPanel
                  bookingId={selected.id}
                  myUserId={myUserId}
                  compact
                  disputeId={selected.disputes?.[0]?.id}
                />
              </div>
            ) : (
              <div className={styles.emptyInline} style={{ marginTop: 14 }}>
                No disputes on this job. Delivery completed cleanly.
              </div>
            )}

            {selected.review && (
              <div className={styles.reviewCard}>
                <div className={styles.metaLabel}>Customer review</div>
                <div className={styles.metaValue}>
                  {"★".repeat(Math.round(Number(selected.review.rating)))} {Number(selected.review.rating).toFixed(1)}
                </div>
                {selected.review.comment && (
                  <div style={{ marginTop: 8, font: "500 13px/1.45 'Hanken Grotesk'", color: "#6B6B70" }}>
                    {selected.review.comment}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className={styles.emptyInline}>Select a past job to review details and disputes.</div>
        )}
      </div>
    </div>
  );
}

export function DriverWorkModeTabs({
  mode,
  onChange,
  activeCount,
  historyCount,
  disputeCount,
}: {
  mode: "active" | "history";
  onChange: (mode: "active" | "history") => void;
  activeCount: number;
  historyCount: number;
  disputeCount: number;
}) {
  return (
    <div className={styles.modeTabs} role="tablist" aria-label="My jobs sections">
      <button
        type="button"
        role="tab"
        aria-selected={mode === "active"}
        className={`${styles.modeTab} ${mode === "active" ? styles.modeTabActive : ""}`}
        onClick={() => onChange("active")}
      >
        Active
        <span className={styles.modeCount}>{activeCount}</span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === "history"}
        className={`${styles.modeTab} ${mode === "history" ? styles.modeTabActive : ""}`}
        onClick={() => onChange("history")}
      >
        History
        <span className={styles.modeCount}>{historyCount}</span>
        {disputeCount > 0 && <span className={styles.disputeDot} aria-label={`${disputeCount} open disputes`} />}
      </button>
    </div>
  );
}

export function countHistoryBookings(bookings: Booking[]) {
  return bookings.filter(isHistoryBooking).length;
}

export function countOpenDisputeBookings(bookings: Booking[]) {
  return bookings.filter((b) => b.disputes?.some((d) => d.status === "open")).length;
}
