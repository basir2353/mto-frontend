"use client";

import Link from "next/link";
import { useState, type CSSProperties, type ReactNode } from "react";
import { NotificationsBell } from "@/components/notifications/NotificationsBell";
import { AppIcon, type AppIconName } from "@/components/ui/Icons";
import { useAuth } from "@/contexts/AuthContext";
import type { Notification } from "@/lib/api/types";

export type CustomerNavId = "new" | "move" | "messages" | "history" | "wallet";

const NAV: { id: CustomerNavId; label: string; icon: AppIconName }[] = [
  { id: "new", label: "New move", icon: "plus" },
  { id: "move", label: "My move", icon: "myJobs" },
  { id: "messages", label: "Messages", icon: "messages" },
  { id: "history", label: "History", icon: "clock" },
  { id: "wallet", label: "Wallet", icon: "wallet" },
];

const COLLAPSED_KEY = "mto_customer_sidebar_collapsed";

export function CustomerAppShell({
  activeNav,
  onNav,
  displayName,
  onOpenNotification,
  alerts,
  children,
}: {
  activeNav: CustomerNavId;
  onNav: (id: CustomerNavId) => void;
  displayName: string;
  onOpenNotification?: (notification: Notification) => void | Promise<void>;
  alerts?: ReactNode;
  children: ReactNode;
}) {
  const { logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem(COLLAPSED_KEY) === "1";
    } catch {
      return false;
    }
  });

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      try {
        sessionStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const sideW = collapsed ? 72 : 228;

  return (
    <div
      className="customer-app-shell"
      style={{
        background: "#F5F4EF",
        height: "100dvh",
        width: "100%",
        overflow: "hidden",
        display: "flex",
        color: "#0E0E10",
      }}
    >
      <aside
        className="customer-desktop-sidebar"
        style={{
          width: sideW,
          flex: "none",
          background: "#0E0E10",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          padding: collapsed ? "14px 10px 12px" : "14px 12px 12px",
          transition: "width .2s ease",
          borderRight: "1px solid rgba(255,255,255,.06)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 18,
            padding: collapsed ? 0 : "0 4px",
            justifyContent: collapsed ? "center" : "space-between",
          }}
        >
          <button
            type="button"
            onClick={() => onNav("new")}
            title="MoveThisOut"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              background: "transparent",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              padding: 0,
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                font: "900 15px 'Archivo'",
                color: "#0E0E10",
                flex: "none",
              }}
            >
              M
            </div>
            {!collapsed && (
              <div style={{ textAlign: "left", minWidth: 0 }}>
                <div style={{ font: "800 15px 'Archivo'", letterSpacing: "-.02em", lineHeight: 1.1 }}>MoveThisOut</div>
                <div style={{ font: "500 10px 'Hanken Grotesk'", color: "rgba(255,255,255,.45)", marginTop: 2 }}>Customer</div>
              </div>
            )}
          </button>

          {!collapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button type="button" onClick={toggleCollapsed} title="Collapse sidebar" aria-label="Collapse sidebar" style={iconBtnDark}>
                <AppIcon name="chevronLeft" size={16} color="rgba(255,255,255,.75)" />
              </button>
            </div>
          )}
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minHeight: 0 }}>
          {NAV.map((item) => {
            const active = item.id === activeNav;
            return (
              <div key={item.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <button
                  type="button"
                  title={item.label}
                  onClick={() => onNav(item.id)}
                  style={{
                    height: 42,
                    border: "none",
                    borderRadius: 10,
                    padding: collapsed ? 0 : "0 12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: collapsed ? "center" : "flex-start",
                    gap: 11,
                    cursor: "pointer",
                    background: active ? "var(--accent)" : "transparent",
                    color: active ? "#0E0E10" : "rgba(255,255,255,.72)",
                    font: active ? "700 13px 'Archivo'" : "600 13px 'Hanken Grotesk'",
                    textAlign: "left",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ width: 18, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                    <AppIcon
                      name={item.icon}
                      size={17}
                      color={active ? "#0E0E10" : "rgba(255,255,255,.75)"}
                      strokeWidth={active ? 2.1 : 1.75}
                    />
                  </span>
                  {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
                </button>
                {!collapsed && item.id === "move" && activeNav === "move" && (
                  <button
                    type="button"
                    onClick={() => onNav("new")}
                    title="Create new move"
                    style={{
                      height: 30,
                      borderRadius: 8,
                      border: "1px solid rgba(255,255,255,.15)",
                      background: "rgba(255,255,255,.06)",
                      color: "rgba(255,255,255,.9)",
                      font: "700 12px 'Hanken Grotesk'",
                      cursor: "pointer",
                    }}
                  >
                    + New move
                  </button>
                )}
              </div>
            );
          })}
        </nav>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
          {!collapsed && (
            <>
              <Link href="/help" style={sideLink}>
                Help
              </Link>
              <Link href="/customer-app/support" style={sideLink}>
                Support
              </Link>
              <Link href="/customer-app/profile" style={sideLink}>
                Profile
              </Link>
              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={loggingOut}
                style={{
                  ...sideLink,
                  border: 0,
                  background: "transparent",
                  cursor: loggingOut ? "wait" : "pointer",
                  color: "rgba(255,222,46,.95)",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                {loggingOut ? "Logging out…" : "Log out"}
              </button>
            </>
          )}

          {collapsed && (
            <button type="button" onClick={toggleCollapsed} title="Expand sidebar" aria-label="Expand sidebar" style={{ ...iconBtnDark, width: "100%", height: 36 }}>
              <AppIcon name="chevronRight" size={16} color="rgba(255,255,255,.75)" />
            </button>
          )}
        </div>
      </aside>

      <div className="customer-app-main" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <header className="customer-mobile-header">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="customer-mobile-brand"
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className="customer-mobile-mark">M</span>
            <span>MoveThisOut</span>
          </button>
          <div className="customer-mobile-actions">
            <NotificationsBell dark={false} onOpenNotification={onOpenNotification} />
            <Link href="/customer-app/profile" className="customer-mobile-avatar" aria-label="Profile">
              {displayName.charAt(0).toUpperCase()}
            </Link>
          </div>
        </header>
        {alerts}

        <div className="customer-app-content" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>{children}</div>
        <nav className="customer-mobile-nav" aria-label="Customer navigation">
          {NAV.map((item) => {
            const active = item.id === activeNav;
            return (
              <button key={item.id} type="button" onClick={() => onNav(item.id)} className={active ? "active" : ""}>
                <AppIcon name={item.icon} size={19} color={active ? "#0E0E10" : "#6B6B70"} strokeWidth={active ? 2.2 : 1.8} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      {mobileMenuOpen && (
        <div className="customer-mobile-drawer-layer">
          <button
            type="button"
            className="customer-mobile-drawer-backdrop"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation menu"
          />
          <aside className="customer-mobile-drawer" aria-label="Customer menu">
            <div className="customer-mobile-drawer-head">
              <div>
                <strong>MoveThisOut</strong>
                <span>{displayName}</span>
              </div>
              <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">×</button>
            </div>
            <nav>
              {NAV.map((item) => {
                const active = item.id === activeNav;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={active ? "active" : ""}
                    onClick={() => {
                      onNav(item.id);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <AppIcon name={item.icon} size={20} color={active ? "#0E0E10" : "rgba(255,255,255,.78)"} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="customer-mobile-drawer-links">
              <Link href="/customer-app/profile" onClick={() => setMobileMenuOpen(false)}>Profile</Link>
              <Link href="/customer-app/support" onClick={() => setMobileMenuOpen(false)}>Support</Link>
              <Link href="/help" onClick={() => setMobileMenuOpen(false)}>Help</Link>
              <button
                type="button"
                className="customer-mobile-logout"
                disabled={loggingOut}
                onClick={() => {
                  setMobileMenuOpen(false);
                  void handleLogout();
                }}
              >
                {loggingOut ? "Logging out…" : "Log out"}
              </button>
            </div>
          </aside>
        </div>
      )}
      <style>{`
        .customer-mobile-header,.customer-mobile-nav,.customer-mobile-drawer-layer{display:none}
        @media(max-width:900px){
          .customer-app-shell{height:100dvh!important;overflow:hidden!important}
          .customer-desktop-sidebar{display:none!important}
          .customer-app-main{width:100%;min-width:0;position:relative}
          .customer-mobile-header{height:auto;min-height:58px;flex:none;display:flex;align-items:center;justify-content:space-between;padding:calc(8px + env(safe-area-inset-top)) 16px 8px;background:#fff;border-bottom:1px solid rgba(0,0,0,.08);z-index:20}
          .customer-mobile-brand{display:flex;align-items:center;gap:9px;border:0;background:none;padding:0;font:800 16px 'Archivo';color:#0E0E10}
          .customer-mobile-mark{width:30px;height:30px;border-radius:8px;background:var(--accent);display:grid;place-items:center;font:900 15px 'Archivo'}
          .customer-mobile-actions{display:flex;align-items:center;gap:10px}
          .customer-mobile-avatar{width:32px;height:32px;border-radius:50%;background:var(--accent);display:grid;place-items:center;text-decoration:none;color:#0E0E10;font:800 12px 'Archivo'}
          .customer-app-content{padding-bottom:0;overflow:hidden!important;box-sizing:border-box}
          .customer-app-main:not(:has(.wizard-shell)) .customer-app-content{
            padding-bottom:calc(68px + env(safe-area-inset-bottom))!important;
            overflow:auto!important;
          }
          .customer-app-main:has(.wizard-shell) .customer-mobile-header{
            position:absolute;top:calc(10px + env(safe-area-inset-top));left:10px;right:10px;height:44px;padding:0;
            background:transparent;border:0;z-index:40;pointer-events:none
          }
          .customer-app-main:has(.wizard-shell) .customer-mobile-brand{
            pointer-events:auto;height:42px;padding:0 13px 0 6px;border-radius:14px;
            color:#fff;background:rgba(14,14,16,.92);box-shadow:0 8px 24px rgba(0,0,0,.22);font-size:14px
          }
          .customer-app-main:has(.wizard-shell) .customer-mobile-mark{width:30px;height:30px}
          .customer-app-main:has(.wizard-shell) .customer-mobile-actions{pointer-events:auto;gap:7px;background:rgba(255,255,255,.94);padding:5px;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,.18)}
          .customer-app-main:has(.wizard-shell) .customer-mobile-avatar{width:32px;height:32px}
          .customer-mobile-nav{
            display:grid!important;
            grid-template-columns:repeat(5,minmax(0,1fr));
            gap:2px;
            position:fixed;
            left:0;right:0;bottom:0;
            z-index:60;
            height:calc(62px + env(safe-area-inset-bottom));
            padding:6px 8px calc(6px + env(safe-area-inset-bottom));
            background:#fff;
            border-top:1px solid rgba(0,0,0,.1);
            box-shadow:0 -8px 24px rgba(0,0,0,.06);
          }
          .customer-app-main:has(.wizard-shell) .customer-mobile-nav{display:none!important}
          .customer-mobile-nav button{min-width:0;border:0;background:transparent;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;color:#6B6B70;font:600 10px 'Hanken Grotesk';padding:3px 1px}
          .customer-mobile-nav button.active{background:rgba(255,222,46,.35);color:#0E0E10;font-weight:800}
          .customer-mobile-nav button span{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
          .customer-mobile-drawer-layer{display:block;position:fixed;inset:0;z-index:500}
          .customer-mobile-drawer-backdrop{position:absolute;inset:0;border:0;background:rgba(0,0,0,.42);backdrop-filter:blur(2px)}
          .customer-mobile-drawer{position:absolute;top:0;right:0;bottom:0;width:min(84vw,340px);padding:calc(20px + env(safe-area-inset-top)) 16px calc(20px + env(safe-area-inset-bottom));background:#0E0E10;color:#fff;box-shadow:-18px 0 50px rgba(0,0,0,.32);display:flex;flex-direction:column;animation:customerDrawerIn .22s ease-out}
          .customer-mobile-drawer-head{display:flex;align-items:center;justify-content:space-between;padding:2px 4px 22px;border-bottom:1px solid rgba(255,255,255,.12)}
          .customer-mobile-drawer-head>div{display:flex;flex-direction:column;gap:3px}
          .customer-mobile-drawer-head strong{font:800 19px 'Archivo'}
          .customer-mobile-drawer-head span{font:500 12px 'Hanken Grotesk';color:rgba(255,255,255,.5)}
          .customer-mobile-drawer-head button{width:38px;height:38px;border:1px solid rgba(255,255,255,.16);border-radius:11px;background:rgba(255,255,255,.07);color:#fff;font-size:25px;line-height:1}
          .customer-mobile-drawer>nav{display:flex;flex-direction:column;gap:6px;padding:20px 0}
          .customer-mobile-drawer>nav button{height:50px;padding:0 15px;border:0;border-radius:13px;background:transparent;color:rgba(255,255,255,.82);display:flex;align-items:center;gap:13px;font:700 15px 'Hanken Grotesk';text-align:left}
          .customer-mobile-drawer>nav button.active{background:var(--accent);color:#0E0E10}
          .customer-mobile-drawer-links{margin-top:auto;padding-top:16px;border-top:1px solid rgba(255,255,255,.12);display:flex;flex-direction:column}
          .customer-mobile-drawer-links a{padding:11px 8px;color:rgba(255,255,255,.65);font:600 14px 'Hanken Grotesk';text-decoration:none}
          .customer-mobile-logout{margin-top:8px;height:48px;border:0;border-radius:12px;background:var(--accent);color:#0E0E10;font:800 15px 'Hanken Grotesk';cursor:pointer}
          .customer-mobile-logout:disabled{opacity:.7;cursor:wait}
          @keyframes customerDrawerIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
        }
        @media(max-width:370px){
          .customer-mobile-nav button span{font-size:9px}.customer-mobile-header{padding:0 12px}
          .customer-app-main:has(.wizard-shell) .customer-mobile-brand>span:last-child{display:none}
          .customer-app-main:has(.wizard-shell) .customer-mobile-brand{padding-right:6px}
        }
      `}</style>
    </div>
  );
}

const iconBtnDark: CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(255,255,255,.06)",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "none",
  padding: 0,
};

const sideLink: CSSProperties = {
  height: 34,
  borderRadius: 9,
  padding: "0 12px",
  display: "flex",
  alignItems: "center",
  font: "600 12px 'Hanken Grotesk'",
  color: "rgba(255,255,255,.55)",
  textDecoration: "none",
};
