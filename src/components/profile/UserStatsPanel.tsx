"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usersApi, type UserActivity, type UserStatistics } from "@/lib/api";
import styles from "./UserStatsPanel.module.css";

function bucketType(type: string): "request" | "booking" | "payment" | "other" {
  const t = type.toLowerCase();
  if (t.includes("payment")) return "payment";
  if (t.includes("booking")) return "booking";
  if (t.includes("request") || t.includes("quote")) return "request";
  return "other";
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function UserStatsPanel() {
  const [stats, setStats] = useState<UserStatistics | null>(null);
  const [activity, setActivity] = useState<UserActivity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, a] = await Promise.all([usersApi.getStatistics(), usersApi.getActivity()]);
        setStats(s);
        setActivity(a);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const conversionRate = useMemo(() => {
    if (!stats?.movingRequests) return 0;
    return Math.round((stats.bookings / stats.movingRequests) * 100);
  }, [stats]);

  const mix = useMemo(() => {
    const counts = { request: 0, booking: 0, payment: 0, other: 0 };
    for (const item of activity?.activities ?? []) {
      counts[bucketType(item.type)] += 1;
    }
    return counts;
  }, [activity]);

  const latest = activity?.activities?.[0] ?? null;

  if (loading) {
    return (
      <section className={styles.panel}>
        <div className={styles.muted}>Loading activity…</div>
      </section>
    );
  }

  const requests = stats?.movingRequests ?? 0;
  const bookings = stats?.bookings ?? 0;

  return (
    <section className={styles.panel} aria-labelledby="activity-title">
      <div className={styles.head}>
        <div>
          <h2 id="activity-title" className={styles.title}>
            Your activity
          </h2>
          <p className={styles.subtitle}>A quick snapshot of how you move on MoveThisOut.</p>
        </div>
        <div className={styles.livePill}>
          <span className={styles.liveDot} aria-hidden />
          Snapshot
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Move requests</div>
          <div className={styles.statValue}>{requests}</div>
          <div className={styles.statHint}>Jobs you&apos;ve posted</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Bookings</div>
          <div className={styles.statValue}>{bookings}</div>
          <div className={styles.statHint}>Confirmed moves</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Book rate</div>
          <div className={styles.statValue}>{requests > 0 ? `${conversionRate}%` : "—"}</div>
          <div className={styles.statHint}>{requests > 0 ? "Requests → bookings" : "Needs a request first"}</div>
        </div>
      </div>

      <div className={styles.funnel}>
        <div className={styles.funnelTop}>
          <div className={styles.funnelLabel}>Booking funnel</div>
          <div className={styles.funnelRate}>{requests > 0 ? `${conversionRate}% converted` : "No requests yet"}</div>
        </div>
        <div className={styles.track} aria-hidden>
          <div className={styles.fill} style={{ width: `${requests > 0 ? Math.min(100, conversionRate) : 0}%` }} />
        </div>
        <div className={styles.funnelMeta}>
          <span>{requests} requests</span>
          <span>{bookings} bookings</span>
        </div>
      </div>

      <div className={styles.mix} aria-label="Activity mix">
        <div className={styles.mixCard}>
          <div className={styles.mixValue}>{mix.request}</div>
          <div className={styles.mixLabel}>Requests</div>
        </div>
        <div className={styles.mixCard}>
          <div className={styles.mixValue}>{mix.booking}</div>
          <div className={styles.mixLabel}>Bookings</div>
        </div>
        <div className={styles.mixCard}>
          <div className={styles.mixValue}>{mix.payment}</div>
          <div className={styles.mixLabel}>Payments</div>
        </div>
        <div className={styles.mixCard}>
          <div className={styles.mixValue}>{mix.other}</div>
          <div className={styles.mixLabel}>Other</div>
        </div>
      </div>

      <div className={styles.latest}>
        <div className={styles.latestCard}>
          <div className={styles.latestEyebrow}>Latest moment</div>
          {latest ? (
            <>
              <div className={styles.latestDesc}>{latest.description}</div>
              <div className={styles.latestTime}>{relativeTime(latest.createdAt)}</div>
            </>
          ) : (
            <>
              <div className={styles.latestDesc}>No recent moments yet — book a move to get started.</div>
              <div className={styles.latestTime}>Waiting for activity</div>
            </>
          )}
        </div>

        <div className={styles.ctaStack}>
          <Link href="/book" className={styles.ctaCard}>
            <div>
              <div className={styles.ctaText}>Book a move</div>
              <div className={styles.ctaHint}>Start a new request</div>
            </div>
            <span className={styles.ctaArrow} aria-hidden>
              →
            </span>
          </Link>
          <Link href="/customer-app/history" className={styles.ctaCard}>
            <div>
              <div className={styles.ctaText}>Move history</div>
              <div className={styles.ctaHint}>Past bookings &amp; status</div>
            </div>
            <span className={styles.ctaArrow} aria-hidden>
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
