"use client";

import { useEffect, useMemo, useState } from "react";
import { usersApi, type UserActivity, type UserStatistics } from "@/lib/api";
import { activityTypeIcon, TypeIcon } from "@/components/ui/Icons";

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
      <div style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,.1)", borderRadius: 16, padding: "22px 24px", font: "600 14px var(--font-hanken)", color: "#8A8A90" }}>
        Loading activity…
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,.1)", borderRadius: 16, padding: "22px 24px" }}>
      <h2 style={{ margin: "0 0 6px", font: "800 22px var(--font-archivo)" }}>Your activity</h2>
      <p style={{ margin: "0 0 18px", font: "500 14px var(--font-hanken)", color: "#6B6B70" }}>
        Summary of your moves, requests, and account history on MoveThisOut.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 20 }}>
        <StatCard label="Move requests" value={stats?.movingRequests ?? 0} hint="Jobs you've posted" />
        <StatCard label="Bookings" value={stats?.bookings ?? 0} hint="Confirmed moves" />
        {conversionRate != null && stats!.movingRequests > 0 && (
          <StatCard label="Book rate" value={`${conversionRate}%`} hint="Requests → bookings" />
        )}
      </div>

      {activity?.message && (
        <div style={{ font: "500 13px var(--font-hanken)", color: "#6B6B70", marginBottom: 12, padding: "10px 12px", background: "#fafaf8", borderRadius: 10 }}>
          {activity.message}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {(["all", "request", "booking", "payment"] as ActivityFilter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            style={{
              height: 30,
              padding: "0 12px",
              borderRadius: 999,
              border: filter === f ? "none" : "1px solid rgba(0,0,0,.12)",
              background: filter === f ? "#0E0E10" : "#fff",
              color: filter === f ? "#fff" : "#0E0E10",
              font: "700 11px var(--font-hanken)",
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {filteredActivities.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filteredActivities.map((item, i) => (
            <div
              key={`${item.type}-${i}`}
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                background: "#fafaf8",
                border: "1px solid rgba(0,0,0,.06)",
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1, flex: "none" }}>{activityIcon(item.type)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: "600 14px var(--font-hanken)" }}>{item.description}</div>
                <div style={{ display: "flex", gap: 10, marginTop: 4, font: "500 11px var(--font-hanken)", color: "#9a9aa0" }}>
                  <span style={{ textTransform: "uppercase", letterSpacing: ".04em" }}>{item.type.replace(/_/g, " ")}</span>
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ font: "600 14px var(--font-hanken)", color: "#8A8A90" }}>
          {filter === "all" ? "No recent activity logged yet." : `No ${filter} activity yet.`}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div style={{ border: "1.5px solid rgba(0,0,0,.08)", borderRadius: 12, padding: "14px 16px", background: "#fafaf8" }}>
      <div style={{ font: "700 11px var(--font-hanken)", letterSpacing: ".06em", textTransform: "uppercase", color: "#8A8A90" }}>{label}</div>
      <div style={{ font: "800 26px var(--font-archivo)", marginTop: 6 }}>{value}</div>
      {hint && <div style={{ font: "500 11px var(--font-hanken)", color: "#9a9aa0", marginTop: 4 }}>{hint}</div>}
    </div>
  );
}
