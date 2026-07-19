"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TextInput } from "@/components/FormControls";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, type AdminAnalytics, type AdminWalletStatementEntry, type Booking, type Dispute, type Promotion, type User } from "@/lib/api";
import { WalletStatementPanel } from "@/components/move/WalletPanels";
import { AdminZonesPanel } from "@/components/admin/AdminZonesPanel";
import { PlatformHealthBadge } from "@/components/admin/PlatformHealthBadge";
import { AdminBookingCard, AdminDashboardPanel, AdminDisputeCard, AdminUserCard } from "@/components/admin/AdminDetailCards";
import { NotificationsBell } from "@/components/notifications/NotificationsBell";
import type { Notification } from "@/lib/api/types";
import { resolveAdminNotificationAction } from "@/lib/notificationNav";
import styles from "./admin.module.css";

type Tab = "dashboard" | "users" | "bookings" | "disputes" | "transactions" | "promotions" | "zones";

const tabs: { id: Tab; label: string; sub: string }[] = [
  { id: "dashboard", label: "Dashboard", sub: "Overview" },
  { id: "users", label: "Users", sub: "Verify drivers" },
  { id: "bookings", label: "Bookings", sub: "All moves" },
  { id: "disputes", label: "Disputes", sub: "Resolve issues" },
  { id: "transactions", label: "Statements", sub: "All payments" },
  { id: "zones", label: "Zones & rates", sub: "Pricing control" },
  { id: "promotions", label: "Promotions", sub: "Discount codes" },
];

export default function AdminPage() {
  return (
    <AuthGuard roles={["admin"]}>
      <AdminPanel />
    </AuthGuard>
  );
}

function AdminPanel() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [transactions, setTransactions] = useState<AdminWalletStatementEntry[]>([]);
  const [roleFilter, setRoleFilter] = useState<"all" | "customer" | "mover" | "admin">("all");
  const [bookingFilter, setBookingFilter] = useState<"all" | "active" | "completed" | "cancelled">("all");

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      if (tab === "dashboard") {
        const [stats, userList, bookingList, disputeList] = await Promise.all([
          adminApi.analytics(),
          adminApi.listUsers(),
          adminApi.listBookings(),
          adminApi.listDisputes(),
        ]);
        setAnalytics(stats);
        setUsers(userList);
        setBookings(bookingList);
        setDisputes(disputeList);
      } else if (tab === "users") {
        setUsers(await adminApi.listUsers());
      } else if (tab === "bookings") {
        setBookings(await adminApi.listBookings());
      } else if (tab === "disputes") {
        setDisputes(await adminApi.listDisputes());
      } else if (tab === "promotions") {
        setPromotions(await adminApi.listPromotions());
      } else if (tab === "transactions") {
        const [txList, userList] = await Promise.all([
          adminApi.listTransactions(),
          adminApi.listUsers(),
        ]);
        setTransactions(txList);
        setUsers(userList);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setBusy(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const pendingMovers = useMemo(
    () => users.filter((u) => u.roles.includes("mover") && (!u.isVerified || !u.moverProfile?.isVerified)),
    [users],
  );

  const verifyUser = async (userId: string) => {
    setBusy(true);
    setError(null);
    try {
      await adminApi.verifyUser(userId);
      setUsers(await adminApi.listUsers());
      if (tab === "dashboard") setAnalytics(await adminApi.analytics());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not verify user");
    } finally {
      setBusy(false);
    }
  };

  const resolveDispute = async (disputeId: string, resolution: string, refundAmount?: number) => {
    if (!resolution.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await adminApi.resolveDispute(disputeId, resolution.trim(), refundAmount);
      setDisputes(await adminApi.listDisputes());
      if (tab === "dashboard") setAnalytics(await adminApi.analytics());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not resolve dispute");
    } finally {
      setBusy(false);
    }
  };

  const refundPayment = async (paymentId: string) => {
    if (!confirm("Refund this payment?")) return;
    setBusy(true);
    setError(null);
    try {
      await adminApi.refundPayment(paymentId);
      setBookings(await adminApi.listBookings());
      if (tab === "dashboard") setAnalytics(await adminApi.analytics());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not refund payment");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.page} style={{ background: "#0E0E10", minHeight: "100vh", padding: 24 }}>
      <div
        className={styles.shell}
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          height: "min(900px, calc(100vh - 48px))",
          borderRadius: 18,
          overflow: "hidden",
          display: "flex",
          boxShadow: "0 30px 80px -20px rgba(0,0,0,.5)",
          background: "#F5F4EF",
          color: "#0E0E10",
        }}
      >
        <aside
          className={styles.sidebar}
          style={{
            width: 280,
            flex: "none",
            background: "#0E0E10",
            color: "#fff",
            padding: "36px 28px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "#fff", marginBottom: 36 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", font: "900 19px 'Archivo'", color: "#0E0E10" }}>
              M
            </div>
            <span style={{ font: "800 20px 'Archivo'" }}>MoveThisOut</span>
          </Link>

          <div style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 18 }}>
            Admin panel
          </div>

          <div className={styles.tabs}>
            {tabs.map((t) => {
              const active = tab === t.id;
              return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                style={{
                  textAlign: "left",
                  border: "none",
                  cursor: "pointer",
                  borderRadius: 12,
                  padding: "12px 14px",
                  marginBottom: 8,
                  background: active ? "var(--accent)" : "transparent",
                  color: active ? "#0E0E10" : "#fff",
                }}
              >
                <div style={{ font: "700 15px 'Hanken Grotesk'" }}>{t.label}</div>
                <div style={{ font: "500 12px 'Hanken Grotesk'", opacity: active ? 0.75 : 0.45, marginTop: 2 }}>{t.sub}</div>
              </button>
              );
            })}
          </div>

          <div className={styles.account} style={{ marginTop: "auto" }}>
            <Link
              href="/admin/profile"
              style={{
                display: "block",
                marginBottom: 12,
                padding: "12px 14px",
                borderRadius: 12,
                border: "1.5px solid rgba(255,255,255,.2)",
                color: "#fff",
                textDecoration: "none",
                font: "700 14px 'Hanken Grotesk'",
              }}
            >
              My profile
            </Link>
            <div style={{ font: "500 13px 'Hanken Grotesk'", color: "rgba(255,255,255,.55)" }}>
              Signed in as
              <div style={{ color: "#fff", fontWeight: 700, marginTop: 4 }}>{user?.email}</div>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              style={{
                marginTop: 14,
                height: 40,
                width: "100%",
                borderRadius: 10,
                border: "1.5px solid rgba(255,255,255,.25)",
                background: "transparent",
                color: "#fff",
                font: "700 13px 'Hanken Grotesk'",
                cursor: "pointer",
              }}
            >
              Sign out
            </button>
          </div>
        </aside>

        <main className={styles.main} style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <header className={styles.header} style={{ padding: "28px 36px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1 style={{ margin: 0, font: "800 28px 'Archivo'", letterSpacing: "-.02em" }}>
                {tabs.find((t) => t.id === tab)?.label}
              </h1>
              <p style={{ margin: "6px 0 0", font: "500 14px 'Hanken Grotesk'", color: "#6B6B70" }}>
                Platform management and moderation
              </p>
            </div>
            <div className={styles.headerActions} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                type="button"
                onClick={load}
                disabled={busy}
                style={{
                  height: 40,
                  padding: "0 16px",
                  borderRadius: 10,
                  border: "1.5px solid rgba(0,0,0,.14)",
                  background: "#fff",
                  font: "700 13px 'Hanken Grotesk'",
                  cursor: busy ? "wait" : "pointer",
                }}
              >
                {busy ? "Loading…" : "Refresh"}
              </button>
              <PlatformHealthBadge />
              <NotificationsBell
                dark={false}
                onOpenNotification={(n: Notification) => {
                  const action = resolveAdminNotificationAction(n);
                  if (action.kind === "disputes") setTab("disputes");
                  else if (action.kind === "bookings") setTab("bookings");
                  else if (action.kind === "users") setTab("users");
                  else setTab("dashboard");
                }}
              />
            </div>
          </header>

          {error && (
            <div className={styles.error} style={{ margin: "16px 36px 0", padding: "12px 14px", borderRadius: 12, background: "rgba(168,68,42,.08)", border: "1px solid rgba(168,68,42,.35)", color: "#a8442a", font: "600 14px 'Hanken Grotesk'" }}>
              {error}
            </div>
          )}

          <div className={styles.content} style={{ flex: 1, overflow: "auto", padding: "24px 36px 36px" }}>
            {tab === "dashboard" && analytics && (
              <AdminDashboardPanel analytics={analytics} pendingMovers={pendingMovers.length} users={users} bookings={bookings} disputes={disputes} />
            )}
            {tab === "dashboard" && !analytics && <EmptyState text="Loading dashboard…" />}
            {tab === "users" && (
              <UsersView users={users} busy={busy} onVerify={verifyUser} roleFilter={roleFilter} onRoleFilter={setRoleFilter} />
            )}
            {tab === "bookings" && (
              <BookingsView bookings={bookings} busy={busy} onRefund={refundPayment} filter={bookingFilter} onFilter={setBookingFilter} />
            )}
            {tab === "disputes" && (
              <DisputesView
                disputes={disputes}
                busy={busy}
                myUserId={user?.id ?? ""}
                onResolve={resolveDispute}
              />
            )}
            {tab === "transactions" && (
              <TransactionsView transactions={transactions} users={users} busy={busy} />
            )}
            {tab === "zones" && <AdminZonesPanel onError={setError} onUpdated={load} />}
            {tab === "promotions" && <PromotionsView promotions={promotions} onCreated={load} onError={setError} />}
          </div>
        </main>
      </div>
    </div>
  );
}

function UsersView({
  users,
  busy,
  onVerify,
  roleFilter,
  onRoleFilter,
}: {
  users: User[];
  busy: boolean;
  onVerify: (id: string) => void;
  roleFilter: "all" | "customer" | "mover" | "admin";
  onRoleFilter: (v: "all" | "customer" | "mover" | "admin") => void;
}) {
  const filtered = users.filter((u) => roleFilter === "all" || u.roles.includes(roleFilter));
  if (!filtered.length) return <EmptyState text="No users match this filter." />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <FilterBar
        options={[
          { id: "all", label: "All" },
          { id: "customer", label: "Customers" },
          { id: "mover", label: "Movers" },
          { id: "admin", label: "Admins" },
        ]}
        value={roleFilter}
        onChange={(v) => onRoleFilter(v as typeof roleFilter)}
      />
      {filtered.map((u) => (
        <AdminUserCard key={u.id} user={u} busy={busy} onVerify={onVerify} />
      ))}
    </div>
  );
}

function BookingsView({
  bookings,
  busy,
  onRefund,
  filter,
  onFilter,
}: {
  bookings: Booking[];
  busy?: boolean;
  onRefund: (paymentId: string) => void;
  filter: "all" | "active" | "completed" | "cancelled";
  onFilter: (v: "all" | "active" | "completed" | "cancelled") => void;
}) {
  const filtered = bookings.filter((b) => {
    if (filter === "all") return true;
    if (filter === "active") return ["confirmed", "in_progress", "open"].includes(b.status);
    if (filter === "completed") return b.status === "completed";
    return b.status === "cancelled";
  });

  if (!filtered.length) return <EmptyState text="No bookings match this filter." />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <FilterBar
        options={[
          { id: "all", label: "All" },
          { id: "active", label: "Active" },
          { id: "completed", label: "Completed" },
          { id: "cancelled", label: "Cancelled" },
        ]}
        value={filter}
        onChange={(v) => onFilter(v as typeof filter)}
      />
      {filtered.map((b) => (
        <AdminBookingCard key={b.id} booking={b} busy={busy} onRefund={onRefund} />
      ))}
    </div>
  );
}

function DisputesView({
  disputes,
  busy,
  myUserId,
  onResolve,
}: {
  disputes: Dispute[];
  busy: boolean;
  myUserId: string;
  onResolve: (id: string, resolution: string, refundAmount?: number) => void;
}) {
  const open = disputes.filter((d) => d.status === "open");
  const resolved = disputes.filter((d) => d.status !== "open");

  if (!disputes.length) return <EmptyState text="No disputes." />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {open.length > 0 && (
        <div>
          <div style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".08em", textTransform: "uppercase", color: "#8a5a00", marginBottom: 10 }}>
            Open ({open.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {open.map((d) => (
              <AdminDisputeCard key={d.id} dispute={d} busy={busy} myUserId={myUserId} onResolve={onResolve} />
            ))}
          </div>
        </div>
      )}
      {resolved.length > 0 && (
        <div>
          <div style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".08em", textTransform: "uppercase", color: "#8A8A90", marginBottom: 10 }}>
            Resolved ({resolved.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {resolved.map((d) => (
              <AdminDisputeCard key={d.id} dispute={d} busy={busy} myUserId={myUserId} onResolve={onResolve} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterBar({
  options,
  value,
  onChange,
}: {
  options: Array<{ id: string; label: string }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          style={{
            height: 34,
            padding: "0 14px",
            borderRadius: 999,
            border: value === o.id ? "none" : "1.5px solid rgba(0,0,0,.14)",
            background: value === o.id ? "#0E0E10" : "#fff",
            color: value === o.id ? "#fff" : "#0E0E10",
            font: "700 12px 'Hanken Grotesk'",
            cursor: "pointer",
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function PromotionsView({
  promotions,
  onCreated,
  onError,
}: {
  promotions: Promotion[];
  onCreated: () => void;
  onError: (msg: string) => void;
}) {
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setSuccess(null);
    onError("");
    try {
      const promo = await adminApi.createPromotion({
        code: code.trim(),
        title: title.trim(),
        description: description.trim() || undefined,
        discountPercent: discountPercent ? Number(discountPercent) : undefined,
        validFrom: new Date(validFrom).toISOString(),
        validTo: new Date(validTo).toISOString(),
      });
      setSuccess(`Promotion ${promo.code} created.`);
      setCode("");
      setTitle("");
      setDescription("");
      setDiscountPercent("");
      onCreated();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not create promotion");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: 40, alignItems: "flex-start", flexWrap: "wrap" }}>
      <form onSubmit={submit} style={{ maxWidth: 520, flex: "1 1 380px", display: "flex", flexDirection: "column", gap: 16 }}>
        <TextInput label="Code" value={code} onChange={setCode} placeholder="SUMMER25" />
        <TextInput label="Title" value={title} onChange={setTitle} placeholder="Summer discount" />
        <TextInput label="Description" value={description} onChange={setDescription} placeholder="Optional details" />
        <TextInput label="Discount %" value={discountPercent} onChange={setDiscountPercent} placeholder="10" />
        <TextInput label="Valid from" value={validFrom} onChange={setValidFrom} placeholder="2026-07-01" />
        <TextInput label="Valid to" value={validTo} onChange={setValidTo} placeholder="2026-08-31" />
        {success && (
          <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(0,128,0,.08)", color: "#1f6b1f", font: "600 14px 'Hanken Grotesk'" }}>
            {success}
          </div>
        )}
        <button
          type="submit"
          disabled={busy}
          style={{ height: 48, borderRadius: 12, border: "none", background: "var(--accent)", font: "800 15px 'Archivo'", color: "#0E0E10", cursor: busy ? "wait" : "pointer" }}
        >
          {busy ? "Creating…" : "Create promotion"}
        </button>
      </form>

      <div style={{ flex: "1 1 320px", display: "flex", flexDirection: "column", gap: 10 }}>
        {promotions.length === 0 ? (
          <EmptyState text="No promotions yet." />
        ) : (
          promotions.map((p) => (
            <div key={p.id} style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,.1)", borderRadius: 14, padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
                <div style={{ font: "800 15px 'Archivo'" }}>{p.code}</div>
                <Badge text={p.isActive ? "active" : "inactive"} tone={p.isActive ? "ok" : "neutral"} />
              </div>
              <div style={{ font: "700 14px 'Hanken Grotesk'", marginTop: 6 }}>{p.title}</div>
              {p.description && <div style={{ font: "500 13px 'Hanken Grotesk'", color: "#6B6B70", marginTop: 4 }}>{p.description}</div>}
              <div style={{ font: "500 13px 'Hanken Grotesk'", color: "#6B6B70", marginTop: 8 }}>
                {p.discountPercent != null ? `${p.discountPercent}% off` : p.discountAmount != null ? `$${p.discountAmount} off` : ""}
                {" · "}
                {new Date(p.validFrom).toLocaleDateString()} – {new Date(p.validTo).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TransactionsView({
  transactions,
  users,
  busy,
}: {
  transactions: AdminWalletStatementEntry[];
  users: User[];
  busy: boolean;
}) {
  const [accountFilter, setAccountFilter] = useState<"all" | "customer" | "mover">("all");
  const userLabel = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return userId.slice(0, 8);
    if (user.moverProfile?.businessName) return user.moverProfile.businessName;
    if (user.customerProfile) {
      return `${user.customerProfile.firstName} ${user.customerProfile.lastName}`.trim() || user.email;
    }
    return user.email;
  };

  const filtered = transactions.filter((tx) => accountFilter === "all" || tx.accountType === accountFilter);
  const totalIn = filtered.filter((t) => t.direction === "credit").reduce((s, t) => s + t.amount, 0);
  const totalOut = filtered.filter((t) => t.direction === "debit").reduce((s, t) => s + t.amount, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <FilterBar
        options={[
          { id: "all", label: "All accounts" },
          { id: "customer", label: "Customers" },
          { id: "mover", label: "Movers" },
        ]}
        value={accountFilter}
        onChange={(v) => setAccountFilter(v as typeof accountFilter)}
      />
      <WalletStatementPanel
        loading={busy}
        statement={{
          currentBalance: 0,
          totalIn: Number(totalIn.toFixed(2)),
          totalOut: Number(totalOut.toFixed(2)),
          entries: filtered.map((tx) => ({
            ...tx,
            description: `${tx.description} · ${userLabel(tx.userId)} (${tx.accountType})`,
          })),
        }}
        title="Platform payment statements"
        subtitle="Every wallet credit and debit across customers and movers"
      />
    </div>
  );
}

function Badge({ text, tone = "neutral" }: { text: string; tone?: "neutral" | "ok" | "warn" }) {
  const bg = tone === "ok" ? "#e7f5ea" : tone === "warn" ? "#fff4df" : "#f0f0ec";
  const color = tone === "ok" ? "#1f6b1f" : tone === "warn" ? "#8a5a00" : "#3a3a40";
  return (
    <span style={{ font: "700 11px 'Hanken Grotesk'", letterSpacing: ".04em", textTransform: "uppercase", background: bg, color, padding: "4px 8px", borderRadius: 999 }}>
      {text}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ padding: "48px 24px", textAlign: "center", font: "600 15px 'Hanken Grotesk'", color: "#8A8A90" }}>
      {text}
    </div>
  );
}
