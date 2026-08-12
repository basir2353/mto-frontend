"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { customersApi, type Booking, type Dispute } from "@/lib/api";
import { BookingDisputeBanner } from "@/components/booking/BookingDisputeBanner";
import { DisputeThreadPanel } from "@/components/dispute/DisputeThreadPanel";
import styles from "./CustomerDisputesPanel.module.css";

export function CustomerDisputesPanel() {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<Array<Dispute & { route?: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const bookings = await customersApi.listBookings();
        const all: Array<Dispute & { route?: string }> = [];
        for (const b of bookings) {
          for (const d of b.disputes ?? []) {
            all.push({ ...d, route: formatRoute(b) });
          }
        }
        all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setDisputes(all);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openCount = disputes.filter((d) => d.status === "open").length;

  return (
    <section className={styles.panel} aria-labelledby="disputes-title">
      <div className={styles.head}>
        <h2 id="disputes-title" className={styles.title}>
          Your disputes
        </h2>
        {openCount > 0 ? <span className={styles.openBadge}>{openCount} open</span> : null}
      </div>
      <p className={styles.subtitle}>
        Track dispute status and chat with admin and your mover in the dispute room. Need help? See the{" "}
        <Link href="/customer-app/support">support guide</Link>.
      </p>

      {loading ? <div className={styles.muted}>Loading disputes…</div> : null}

      {!loading && disputes.length === 0 ? (
        <div className={styles.empty}>
          No disputes on file. If something goes wrong with a move, open Track or History and use Manage this move → Raise
          dispute.
        </div>
      ) : null}

      {!loading &&
        disputes.map((d) => (
          <div key={d.id} className={styles.disputeBlock}>
            {d.route ? <div className={styles.route}>{d.route}</div> : null}
            <BookingDisputeBanner disputes={[d]} />
            {user?.id ? (
              <div className={styles.thread}>
                <DisputeThreadPanel bookingId={d.bookingId} myUserId={user.id} compact />
              </div>
            ) : null}
          </div>
        ))}
    </section>
  );
}

function formatRoute(b: Booking): string {
  const pickup =
    (b.pickupAddress as { street?: string } | undefined)?.street ?? b.request?.pickupAddress ?? "Pickup";
  const dest =
    (b.destinationAddress as { street?: string } | undefined)?.street ??
    b.request?.destinationAddress ??
    "Destination";
  return `${pickup} → ${dest}`;
}
