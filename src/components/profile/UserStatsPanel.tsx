"use client";

import { useEffect, useMemo, useState } from "react";
import { usersApi, type UserActivity, type UserStatistics } from "@/lib/api";
import { activityTypeIcon, TypeIcon } from "@/components/ui/Icons";
import styles from "./UserStatsPanel.module.css";

type ActivityFilter = "all" | "request" | "booking" | "payment";

function activityIcon(type: string) {
  return <TypeIcon icon={activityTypeIcon(type)} size={18} />;
}

function matchesFilter(type: string, filter: ActivityFilter) {
  if (filter === "all") return true;
  if (filter === "request") return type.includes("request") || type.includes("quote");
  if (filter === "booking") return type.includes("booking");
  if (filter === "payment") return type.includes("payment");
  return true;
}

export function UserStatsPanel() {
  const [stats, setStats] = useState<UserStatistics | null>(null);
  const [activity, setActivity] = useState<UserActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ActivityFilter>("all");

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
    if (!stats?.movingRequests) return null;
    return Math.round((stats.bookings / stats.movingRequests) * 100);
  }, [stats]);

  const filteredActivities = useMemo(
    () => (activity?.activities ?? []).filter((a) => matchesFilter(a.type, filter)),
    [activity, filter],
  );

  if (loading) {
    return (
      <section className={styles.panel}>
        <div className={styles.muted}>Loading activity…</div>
      </section>
    );
  }

  return (
    <section className={styles.panel} aria-labelledby="activity-title">
      <h2 id="activity-title" className={styles.title}>
        Your activity
      </h2>
      <p className={styles.subtitle}>Summary of your moves, requests, and account history on MoveThisOut.</p>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Move requests</div>
          <div className={styles.statValue}>{stats?.movingRequests ?? 0}</div>
          <div className={styles.statHint}>Jobs you&apos;ve posted</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Bookings</div>
          <div className={styles.statValue}>{stats?.bookings ?? 0}</div>
          <div className={styles.statHint}>Confirmed moves</div>
        </div>
        {conversionRate != null && stats!.movingRequests > 0 ? (
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Book rate</div>
            <div className={styles.statValue}>{conversionRate}%</div>
            <div className={styles.statHint}>Requests → bookings</div>
          </div>
        ) : (
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Book rate</div>
            <div className={styles.statValue}>—</div>
            <div className={styles.statHint}>Needs a request first</div>
          </div>
        )}
      </div>

      {activity?.message ? <div className={styles.message}>{activity.message}</div> : null}

      <div className={styles.filters}>
        {(["all", "request", "booking", "payment"] as ActivityFilter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ""}`}
          >
            {f}
          </button>
        ))}
      </div>

      {filteredActivities.length ? (
        <div className={styles.activityList}>
          {filteredActivities.map((item, i) => (
            <div key={`${item.type}-${i}`} className={styles.activityItem}>
              <span className={styles.activityIcon}>{activityIcon(item.type)}</span>
              <div className={styles.activityBody}>
                <div className={styles.activityDesc}>{item.description}</div>
                <div className={styles.activityMeta}>
                  <span className={styles.activityType}>{item.type.replace(/_/g, " ")}</span>
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.muted}>
          {filter === "all" ? "No recent activity logged yet." : `No ${filter} activity yet.`}
        </div>
      )}
    </section>
  );
}
