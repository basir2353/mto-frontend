"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NotificationsBell } from "@/components/notifications/NotificationsBell";
import { UserAvatar } from "@/components/ui/AppUi";
import { driverTabIcon } from "@/components/ui/Icons";
import type { Notification } from "@/lib/api/types";
import responsive from "./DriverResponsive.module.css";
import cardStyles from "./DriverCards.module.css";
import {
  buildQuoteNotes,
  formatDurationLabel,
  formatTimeLabel,
  parseArrivalToTime24,
  parseQuoteArrivalLabel,
} from "@/lib/quoteTiming";

export type DriverTab = "overview" | "messages" | "jobs" | "work" | "pay";

const NAV: { id: DriverTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "messages", label: "Messages" },
  { id: "jobs", label: "Find jobs" },
  { id: "work", label: "My jobs" },
  { id: "pay", label: "Wallet" },
];

const SECTION_TITLES: Record<DriverTab, { title: string; subtitle: string }> = {
  overview: { title: "Dashboard", subtitle: "Your day at a glance" },
  messages: { title: "Messages", subtitle: "Chats with your customers" },
  jobs: { title: "Find jobs", subtitle: "Quote on open moves nearby" },
  work: { title: "My jobs", subtitle: "Active moves, history & disputes" },
  pay: { title: "Wallet", subtitle: "Earnings, tips & payouts" },
};

export function DriverDashboardShell({
  activeTab,
  onTabChange,
  counts,
  businessName,
  avatarUrl,
  isOnline,
  onToggleOnline,
  onLogout,
  alerts,
  onOpenNotification,
  children,
}: {
  activeTab: DriverTab;
  onTabChange: (tab: DriverTab) => void;
  counts?: Partial<Record<DriverTab, number>>;
  businessName: string;
  avatarUrl?: string | null;
  isOnline: boolean;
  onToggleOnline: () => void;
  onLogout: () => void;
  alerts?: ReactNode;
  onOpenNotification?: (notification: Notification) => void | Promise<void>;
  children: ReactNode;
}) {
  const section = SECTION_TITLES[activeTab];
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const drawerId = useId();

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      menuButtonRef.current?.focus();
    };
  }, [mobileMenuOpen]);

  const closeMenu = () => setMobileMenuOpen(false);

  const sidebarBody = (
    <>
      <div className={responsive.sidebarBrandRow}>
        <Link href="/" className={responsive.sidebarBrand} onClick={closeMenu}>
          <div className={responsive.brandMark}>M</div>
          <div>
            <div className={responsive.brandTitle}>MoveThisOut</div>
            <div className={responsive.brandSub}>Driver app</div>
          </div>
        </Link>
        <button
          type="button"
          className={responsive.sidebarClose}
          aria-label="Close navigation"
          onClick={closeMenu}
        >
          ×
        </button>
      </div>

      <nav className={responsive.sidebarNav} aria-label="Main">
        {NAV.map((item) => {
          const active = item.id === activeTab;
          const count = counts?.[item.id];
          return (
            <button
              key={item.id}
              type="button"
              className={`${responsive.navItem} ${active ? responsive.navItemActive : ""}`}
              onClick={() => {
                onTabChange(item.id);
                closeMenu();
              }}
            >
              <span className={responsive.navIcon}>{driverTabIcon(item.id, active)}</span>
              <span className={responsive.navLabel}>{item.label}</span>
              {count != null && count > 0 && (
                <span className={`${responsive.navCount} ${active ? responsive.navCountActive : ""}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className={responsive.sidebarFooter}>
        <div className={responsive.sidebarProfile}>
          <UserAvatar name={businessName} imageUrl={avatarUrl} size={40} />
          <div className={responsive.sidebarProfileCopy}>
            <div className={responsive.sidebarProfileName}>{businessName}</div>
            <div className={isOnline ? responsive.sidebarOnline : responsive.sidebarOffline}>
              {isOnline ? "Online · sharing GPS" : "Offline"}
            </div>
          </div>
        </div>
        <button
          type="button"
          className={`${responsive.sidebarOnlineBtn} ${isOnline ? responsive.sidebarOnlineBtnOff : ""}`}
          onClick={onToggleOnline}
        >
          {isOnline ? "Go offline" : "Go online"}
        </button>
        <Link href="/driver-app/settings" className={responsive.sidebarLink} onClick={closeMenu}>
          Profile & settings
        </Link>
        <button type="button" className={responsive.sidebarLogout} onClick={onLogout}>
          Log out
        </button>
      </div>
    </>
  );

  return (
    <div className={responsive.shellPage}>
      <div className={responsive.shellFrame}>
        <aside className={responsive.sidebar} aria-label="Driver navigation">
          {sidebarBody}
        </aside>

        <div className={responsive.main}>
          <header className={responsive.header}>
            <button
              ref={menuButtonRef}
              type="button"
              className={responsive.mobileMenuButton}
              aria-label="Open navigation"
              aria-expanded={mobileMenuOpen}
              aria-controls={drawerId}
              onClick={() => setMobileMenuOpen(true)}
            >
              <span className={responsive.menuBars} aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </button>
            <div className={responsive.headerTitle}>
              <h1>{section.title}</h1>
              <p>{section.subtitle}</p>
            </div>
            <div className={responsive.headerActions}>
              <OnlineChip isOnline={isOnline} onToggle={onToggleOnline} compact />
              <NotificationsBell dark={false} onOpenNotification={onOpenNotification} />
              <OnlinePill isOnline={isOnline} onToggle={onToggleOnline} />
            </div>
          </header>

          {alerts}

          <div className={responsive.content}>{children}</div>
        </div>
      </div>

      {portalReady &&
        mobileMenuOpen &&
        createPortal(
          <div
            className={responsive.mobileDrawerLayer}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 500,
              width: "100vw",
              height: "100dvh",
              overflow: "hidden",
            }}
          >
            <button
              type="button"
              className={responsive.mobileOverlay}
              aria-label="Close navigation"
              onClick={closeMenu}
              style={{
                position: "absolute",
                inset: 0,
                border: 0,
                margin: 0,
                padding: 0,
                background: "rgba(0,0,0,.42)",
                cursor: "pointer",
              }}
            />
            <aside
              id={drawerId}
              className={responsive.mobileDrawer}
              role="dialog"
              aria-modal="true"
              aria-label="Driver navigation"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                bottom: 0,
                width: "min(86vw, 320px)",
                maxHeight: "100%",
                zIndex: 1,
              }}
            >
              {sidebarBody}
            </aside>
          </div>,
          document.body,
        )}
    </div>
  );
}

function OnlineChip({
  isOnline,
  onToggle,
  compact,
}: {
  isOnline: boolean;
  onToggle: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      className={`${responsive.onlineChip} ${isOnline ? responsive.onlineChipOn : ""} ${compact ? responsive.onlineChipCompact : ""}`}
      onClick={onToggle}
      aria-pressed={isOnline}
      aria-label={isOnline ? "Go offline" : "Go online"}
    >
      <span className={responsive.onlineChipDot} />
      <span>{isOnline ? "Online" : "Offline"}</span>
    </button>
  );
}

function OnlinePill({ isOnline, onToggle }: { isOnline: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={`${responsive.onlinePill} ${isOnline ? responsive.onlinePillOn : ""}`}
      onClick={onToggle}
    >
      <span className={responsive.onlinePillPulseWrap}>
        {isOnline && <span className={responsive.onlinePillPulse} />}
        <span className={responsive.onlinePillDot} />
      </span>
      <span className={responsive.onlinePillCopy}>
        {isOnline ? "You're visible to customers" : "Go online to get jobs"}
      </span>
      <span className={responsive.onlinePillAction}>{isOnline ? "Stop" : "Start"}</span>
    </button>
  );
}

export function DriverStatCard({
  label,
  value,
  hint,
  accent,
  onClick,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      style={{
        background: accent ? "#0E0E10" : "#fff",
        color: accent ? "#fff" : "#0E0E10",
        border: accent ? "none" : "1.5px solid rgba(0,0,0,.08)",
        borderRadius: 16,
        padding: "18px 20px",
        cursor: onClick ? "pointer" : "default",
        boxShadow: accent ? "0 12px 32px -12px rgba(0,0,0,.35)" : "none",
      }}
    >
      <div style={{ font: "600 12px 'Hanken Grotesk'", color: accent ? "rgba(255,255,255,.5)" : "#8A8A90", marginBottom: 8 }}>{label}</div>
      <div style={{ font: "900 28px/1 'Archivo'", letterSpacing: "-.02em" }}>{value}</div>
      {hint && (
        <div style={{ font: "500 12px 'Hanken Grotesk'", color: accent ? "rgba(255,255,255,.45)" : "#6B6B70", marginTop: 8 }}>{hint}</div>
      )}
    </div>
  );
}

export function DriverPanel({
  children,
  noPadding,
  style,
}: {
  children: ReactNode;
  noPadding?: boolean;
  style?: CSSProperties;
}) {
  return (
    <section
      className={responsive.panel}
      style={{
        background: "#fff",
        border: "1.5px solid rgba(0,0,0,.08)",
        borderRadius: 18,
        overflow: "hidden",
        ...style,
      }}
    >
      <div style={{ padding: noPadding ? 0 : 22 }}>{children}</div>
    </section>
  );
}

export function DriverSplitLayout({
  list,
  detail,
  listTitle,
  listSubtitle,
}: {
  list: ReactNode;
  detail: ReactNode;
  listTitle: string;
  listSubtitle?: string;
}) {
  return (
    <DriverPanel noPadding style={{ display: "flex", minHeight: 640 }}>
      <div
        style={{
          width: 300,
          flex: "none",
          borderRight: "1px solid rgba(0,0,0,.08)",
          background: "#FAFAF8",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid rgba(0,0,0,.06)" }}>
          <div style={{ font: "800 16px 'Archivo'" }}>{listTitle}</div>
          {listSubtitle && (
            <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#6B6B70", marginTop: 4 }}>{listSubtitle}</div>
          )}
        </div>
        <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>{list}</div>
      </div>
      <div style={{ flex: 1, overflow: "auto", minHeight: 0, padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
        {detail}
      </div>
    </DriverPanel>
  );
}

export function DriverListItem({
  selected,
  onClick,
  title,
  subtitle,
  price,
  badge,
  avatarName,
  avatarUrl,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
  price?: string;
  badge?: string;
  avatarName: string;
  avatarUrl?: string | null;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${cardStyles.workListItem} ${selected ? cardStyles.workListItemSelected : ""}`}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "14px 16px",
        border: "none",
        borderBottom: "1px solid rgba(0,0,0,.05)",
        background: selected ? "#0E0E10" : "transparent",
        color: selected ? "#fff" : "#0E0E10",
        cursor: "pointer",
        display: "flex",
        gap: 12,
        alignItems: "center",
      }}
    >
      <UserAvatar name={avatarName} imageUrl={avatarUrl} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
          <b style={{ font: "700 14px 'Hanken Grotesk'", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</b>
          {price && <b style={{ font: "800 14px 'Archivo'", flex: "none" }}>{price}</b>}
        </div>
        <div style={{ font: "500 12px/1.4 'Hanken Grotesk'", color: selected ? "rgba(255,255,255,.6)" : "#6B6B70", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {subtitle}
        </div>
        {badge && (
          <div
            style={{
              display: "inline-block",
              marginTop: 8,
              font: "700 10px 'Hanken Grotesk'",
              letterSpacing: ".04em",
              textTransform: "uppercase",
              padding: "3px 8px",
              borderRadius: 6,
              background: selected ? "rgba(255,222,46,.25)" : "rgba(0,0,0,.06)",
              color: selected ? "var(--accent)" : "#6B6B70",
            }}
          >
            {badge}
          </div>
        )}
      </div>
    </button>
  );
}

export function DriverAlert({ variant, children, inline }: { variant: "warn" | "error" | "info"; children: ReactNode; inline?: boolean }) {
  const styles = {
    warn: { bg: "rgba(255,222,46,.2)", color: "#6b5a00", border: "rgba(255,222,46,.5)" },
    error: { bg: "rgba(168,68,42,.1)", color: "#a8442a", border: "rgba(168,68,42,.25)" },
    info: { bg: "rgba(31,107,31,.08)", color: "#1f6b1f", border: "rgba(31,107,31,.2)" },
  }[variant];

  return (
    <div
      style={{
        margin: inline ? 0 : undefined,
        padding: "12px 16px",
        borderRadius: 12,
        background: styles.bg,
        color: styles.color,
        border: `1px solid ${styles.border}`,
        font: "600 14px 'Hanken Grotesk'",
      }}
      className={inline ? undefined : responsive.alert}
    >
      {children}
    </div>
  );
}

export function DriverJobCard({
  customerName,
  avatarUrl,
  route,
  meta,
  statusLine,
  statusTone,
  action,
}: {
  customerName: string;
  avatarUrl?: string | null;
  route: string;
  meta: string;
  statusLine?: string;
  statusTone?: "ok" | "warn" | "neutral";
  action: ReactNode;
}) {
  const toneColor = statusTone === "ok" ? "#1f6b1f" : statusTone === "warn" ? "#a8442a" : "#6B6B70";

  return (
    <div
      style={{
        background: "#fff",
        border: "1.5px solid rgba(0,0,0,.08)",
        borderRadius: 16,
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <UserAvatar name={customerName} imageUrl={avatarUrl} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: "700 16px 'Hanken Grotesk'" }}>{customerName}</div>
          <div style={{ font: "600 13px 'Hanken Grotesk'", color: "#6B6B70", marginTop: 3 }}>{meta}</div>
        </div>
      </div>
      <div style={{ font: "700 15px/1.35 'Hanken Grotesk'", color: "#3a3a40" }}>{route}</div>
      {statusLine && (
        <div style={{ font: "600 13px 'Hanken Grotesk'", color: toneColor }}>{statusLine}</div>
      )}
      {action}
    </div>
  );
}

export function DriverJobListRow({
  customerName,
  avatarUrl,
  pickup,
  destination,
  itemCount,
  moveDate,
  distanceKm,
  estimatedPrice,
  myQuotePrice,
  inNegotiation,
  onOpen,
}: {
  customerName: string;
  avatarUrl?: string | null;
  pickup: string;
  destination: string;
  itemCount: number;
  moveDate: string;
  distanceKm?: number | null;
  estimatedPrice?: number | null;
  myQuotePrice?: number | null;
  inNegotiation?: boolean;
  onOpen: () => void;
}) {
  const priceLabel =
    myQuotePrice != null
      ? `$${Math.round(myQuotePrice)}`
      : estimatedPrice != null
        ? `~$${estimatedPrice}`
        : "Quote";

  return (
    <button type="button" className={cardStyles.jobListRow} onClick={onOpen}>
      <UserAvatar name={customerName} imageUrl={avatarUrl} size={40} />
      <div className={cardStyles.jobListBody}>
        <div className={cardStyles.jobListTop}>
          <strong>{customerName}</strong>
          <span>{priceLabel}</span>
        </div>
        <div className={cardStyles.jobListRoute}>
          {pickup} → {destination}
        </div>
        <div className={cardStyles.jobListMeta}>
          <span>
            {itemCount} items · {moveDate}
            {distanceKm != null ? ` · ${distanceKm.toFixed(1)} km` : ""}
          </span>
          {(myQuotePrice != null || inNegotiation) && (
            <span className={inNegotiation ? cardStyles.jobListBadgeWarn : cardStyles.jobListBadge}>
              {inNegotiation ? "Price talk" : "Quoted"}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export function DriverOpenJobCard({
  customerName,
  avatarUrl,
  pickup,
  destination,
  itemCount,
  moveDate,
  distanceKm,
  estimatedPrice,
  defaultPrice,
  myQuotePrice,
  myQuoteHours,
  myQuoteNotes,
  inNegotiation,
  verified,
  busy,
  onQuote,
  embedded = false,
}: {
  customerName: string;
  avatarUrl?: string | null;
  pickup: string;
  destination: string;
  itemCount: number;
  moveDate: string;
  distanceKm?: number | null;
  estimatedPrice?: number | null;
  defaultPrice: number;
  myQuotePrice?: number | null;
  myQuoteHours?: number | null;
  myQuoteNotes?: string | null;
  inNegotiation?: boolean;
  verified: boolean;
  busy: boolean;
  onQuote: (price: number, estimatedHours: number, notes?: string) => void;
  embedded?: boolean;
}) {
  const estimate = estimatedPrice != null && estimatedPrice > 0 ? Math.round(Number(estimatedPrice)) : null;
  const initialPrice = myQuotePrice != null ? Math.round(myQuotePrice) : Math.max(1, Math.round(defaultPrice) || estimate || 0);
  const [price, setPrice] = useState(String(initialPrice));
  const [arrivalTime, setArrivalTime] = useState(() => parseArrivalToTime24(myQuoteNotes) || "09:00");
  const [hours, setHours] = useState(() => String(myQuoteHours && myQuoteHours > 0 ? myQuoteHours : 2));
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!touched) {
      setPrice(String(initialPrice));
      setArrivalTime(parseArrivalToTime24(myQuoteNotes) || "09:00");
      setHours(String(myQuoteHours && myQuoteHours > 0 ? myQuoteHours : 2));
    }
  }, [initialPrice, myQuoteHours, myQuoteNotes, touched]);

  const numericPrice = Math.max(0, Number(price) || 0);
  const numericHours = Math.max(1, Math.min(12, Number(hours) || 2));
  const quoteDiff = estimate != null && numericPrice > 0 ? numericPrice - estimate : null;
  const locked = !verified || !!inNegotiation;
  const arrivalLabel = arrivalTime ? formatTimeLabel(arrivalTime) : null;
  const durationLabel = formatDurationLabel(numericHours);

  const setPriceValue = (v: string) => {
    setTouched(true);
    setPrice(v.replace(/[^0-9]/g, ""));
  };
  const bump = (delta: number) => setPriceValue(String(Math.max(1, numericPrice + delta)));

  const sendQuote = () => {
    onQuote(numericPrice, numericHours, buildQuoteNotes(arrivalTime));
  };

  const quoteSummary = [
    `$${Math.round(myQuotePrice ?? numericPrice)}`,
    parseQuoteArrivalLabel(myQuoteNotes) || arrivalLabel,
    myQuoteHours != null ? formatDurationLabel(myQuoteHours) : durationLabel,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={embedded ? cardStyles.embeddedQuote : cardStyles.openJobCard}
      style={
        embedded
          ? undefined
          : {
              background: "#fff",
              border: "1.5px solid rgba(0,0,0,.08)",
              borderRadius: 18,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }
      }
    >
      <div
        className={cardStyles.jobHeader}
        style={{ padding: "16px 18px 14px", borderBottom: "1px solid rgba(0,0,0,.06)", display: "flex", gap: 12, alignItems: "center" }}
      >
        <UserAvatar name={customerName} imageUrl={avatarUrl} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: "700 16px 'Hanken Grotesk'" }}>{customerName}</div>
          <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#6B6B70", marginTop: 3 }}>
            {itemCount} items · {moveDate}
            {distanceKm != null ? ` · ${distanceKm.toFixed(1)} km` : ""}
          </div>
        </div>
        {estimate != null && (
          <div className={cardStyles.budgetBadge}>
            <div className={cardStyles.budgetLabel}>Est. budget</div>
            <div className={cardStyles.budgetValue}>${estimate}</div>
          </div>
        )}
      </div>

      <div className={cardStyles.routeBlock} style={{ padding: "14px 18px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 12px", alignItems: "start" }}>
          <span style={{ font: "800 11px 'Archivo'", color: "#1f6b1f", marginTop: 2 }}>A</span>
          <span style={{ font: "600 14px/1.35 'Hanken Grotesk'", color: "#3a3a40" }}>{pickup}</span>
          <span style={{ font: "800 11px 'Archivo'", color: "#a8442a", marginTop: 2 }}>B</span>
          <span style={{ font: "600 14px/1.35 'Hanken Grotesk'", color: "#3a3a40" }}>{destination}</span>
        </div>
      </div>

      {!locked && (
        <div className={cardStyles.quoteControls}>
          <div>
            <div className={cardStyles.quoteLabel}>Your price for this job</div>
            <div className={cardStyles.priceRow}>
              <button type="button" onClick={() => bump(-10)} disabled={busy || numericPrice <= 10} className={cardStyles.stepBtn} aria-label="Decrease price">
                −
              </button>
              <div className={cardStyles.priceField}>
                <span className={cardStyles.pricePrefix}>$</span>
                <input
                  value={price}
                  onChange={(e) => setPriceValue(e.target.value)}
                  inputMode="numeric"
                  aria-label={`Quote price for ${customerName}`}
                  className={cardStyles.priceInput}
                />
              </div>
              <button type="button" onClick={() => bump(10)} disabled={busy} className={cardStyles.stepBtn} aria-label="Increase price">
                +
              </button>
            </div>
            {estimate != null && (
              <div className={cardStyles.quoteHintRow}>
                <button type="button" disabled={busy} onClick={() => setPriceValue(String(estimate))} className={cardStyles.chipBtn}>
                  Match estimate ${estimate}
                </button>
                {quoteDiff != null && quoteDiff !== 0 && (
                  <span style={{ font: "600 12px 'Hanken Grotesk'", color: quoteDiff > 0 ? "#a8442a" : "#1f6b1f" }}>
                    {quoteDiff > 0 ? `+$${quoteDiff} above` : `$${Math.abs(quoteDiff)} below`} estimate
                  </span>
                )}
              </div>
            )}
          </div>

          <div className={responsive.quoteSchedule}>
            <div>
              <div className={cardStyles.quoteLabel}>Arrival time</div>
              <input
                type="time"
                value={arrivalTime}
                onChange={(e) => {
                  setTouched(true);
                  setArrivalTime(e.target.value);
                }}
                disabled={busy}
                aria-label="Proposed arrival time"
                className={cardStyles.fieldControl}
              />
            </div>
            <div>
              <div className={cardStyles.quoteLabel}>Job duration</div>
              <select
                value={String(numericHours)}
                onChange={(e) => {
                  setTouched(true);
                  setHours(e.target.value);
                }}
                disabled={busy}
                aria-label="Estimated job duration"
                className={cardStyles.fieldControl}
              >
                {[1, 2, 3, 4, 5, 6, 8].map((h) => (
                  <option key={h} value={h}>
                    {h === 1 ? "1 hour" : `${h} hours`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {myQuotePrice != null && (
        <div className={`${cardStyles.quoteStatus} ${inNegotiation ? cardStyles.quoteStatusWarn : cardStyles.quoteStatusOk}`}>
          {inNegotiation ? "In price talk — see Price talks tab" : `Current quote sent: ${quoteSummary}`}
        </div>
      )}

      <div className={cardStyles.quoteFooter} style={{ padding: "0 18px 16px", marginTop: "auto" }}>
        <button
          type="button"
          onClick={sendQuote}
          disabled={locked || busy || numericPrice <= 0 || !arrivalTime}
          className={`${cardStyles.sendBtn} ${
            locked || numericPrice <= 0 || !arrivalTime
              ? cardStyles.sendBtnDisabled
              : myQuotePrice
                ? cardStyles.sendBtnDark
                : cardStyles.sendBtnAccent
          }`}
        >
          {busy
            ? "Sending…"
            : inNegotiation
              ? "In price talk"
              : !verified
                ? "Verify profile to quote"
                : myQuotePrice
                  ? `Update quote · $${numericPrice} · ${arrivalLabel}`
                  : `Send quote · $${numericPrice} · ${arrivalLabel}`}
        </button>
      </div>
    </div>
  );
}

export function DriverPrimaryButton({
  children,
  onClick,
  disabled,
  variant = "accent",
  fullWidth,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "accent" | "dark" | "ghost";
  fullWidth?: boolean;
}) {
  const bg = variant === "accent" ? "var(--accent)" : variant === "dark" ? "#0E0E10" : "transparent";
  const color = variant === "ghost" ? "#6B6B70" : variant === "dark" ? "#fff" : "#0E0E10";
  const border = variant === "ghost" ? "1.5px solid rgba(0,0,0,.14)" : "none";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: fullWidth ? "100%" : undefined,
        height: 48,
        padding: fullWidth ? undefined : "0 20px",
        borderRadius: 12,
        border,
        background: disabled ? "rgba(0,0,0,.08)" : bg,
        color: disabled ? "#9a9aa0" : color,
        font: "800 14px 'Archivo'",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}
