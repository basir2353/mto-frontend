"use client";

import Link from "next/link";
import { useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import { AccountProfileForm } from "@/components/profile/AccountProfileForm";
import { SavedAddressesPanel } from "@/components/profile/SavedAddressesPanel";
import { UserStatsPanel } from "@/components/profile/UserStatsPanel";
import { CustomerDisputesPanel } from "@/components/profile/CustomerDisputesPanel";
import { AppIcon } from "@/components/ui/Icons";
import { useAuth } from "@/contexts/AuthContext";

export default function CustomerProfilePage() {
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <AuthGuard roles={["customer"]}>
      <div
        className="customer-profile-page"
        style={{
          background: "#F5F4EF",
          height: "100dvh",
          width: "100%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="customer-profile-header">
          <Link href="/customer-app" className="customer-profile-brand">
            <div className="customer-profile-mark">M</div>
            <span>MoveThisOut</span>
          </Link>
          <button
            type="button"
            className="customer-profile-logout-top"
            disabled={loggingOut}
            onClick={() => void handleLogout()}
          >
            {loggingOut ? "…" : "Log out"}
          </button>
        </div>
        <div className="customer-profile-content">
          <AccountProfileForm
            backHref="/customer-app"
            backLabel="Back to app"
            title="My profile"
            subtitle="Your name, photo, phone, and address are shown to movers during negotiations and tracking."
          />
          <UserStatsPanel />
          <CustomerDisputesPanel />
          <SavedAddressesPanel />
          <button
            type="button"
            className="customer-profile-logout"
            disabled={loggingOut}
            onClick={() => void handleLogout()}
          >
            {loggingOut ? "Logging out…" : "Log out"}
          </button>
        </div>
        <nav className="customer-profile-footer" aria-label="Customer shortcuts">
          <Link href="/customer-app">
            <AppIcon name="plus" size={18} color="#0E0E10" />
            <span>New move</span>
          </Link>
          <Link href="/customer-app">
            <AppIcon name="myJobs" size={18} color="#0E0E10" />
            <span>My move</span>
          </Link>
          <Link href="/customer-app/profile" aria-current="page">
            <AppIcon name="settings" size={18} color="#0E0E10" />
            <span>Profile</span>
          </Link>
        </nav>
        <style>{`
          .customer-profile-header{
            flex:none;
            min-height:58px;
            background:#0E0E10;
            color:#fff;
            display:flex;
            align-items:center;
            gap:12px;
            padding:calc(10px + env(safe-area-inset-top)) 16px 12px;
            z-index:20;
          }
          .customer-profile-brand{
            display:flex;
            align-items:center;
            gap:10px;
            text-decoration:none;
            color:#fff;
            min-width:0;
          }
          .customer-profile-mark{
            width:30px;height:30px;border-radius:9px;background:var(--accent);
            display:flex;align-items:center;justify-content:center;
            font:900 17px 'Archivo';color:#0E0E10;flex:none;
          }
          .customer-profile-brand>span{font:800 18px 'Archivo';letter-spacing:-.02em}
          .customer-profile-logout-top{
            margin-left:auto;
            height:34px;
            padding:0 12px;
            border:0;
            border-radius:10px;
            background:var(--accent);
            color:#0E0E10;
            font:800 12px 'Hanken Grotesk';
            cursor:pointer;
            flex:none;
          }
          .customer-profile-logout-top:disabled{opacity:.7;cursor:wait}
          .customer-profile-content{
            flex:1;
            overflow:auto;
            min-height:0;
            padding:24px 20px calc(88px + env(safe-area-inset-bottom));
            display:flex;
            flex-direction:column;
            gap:20px;
          }
          .customer-profile-logout{
            width:100%;
            height:52px;
            border:0;
            border-radius:14px;
            background:#0E0E10;
            color:#fff;
            font:800 15px 'Hanken Grotesk';
            cursor:pointer;
          }
          .customer-profile-logout:disabled{opacity:.7;cursor:wait}
          .customer-profile-footer{
            position:fixed;
            left:0;right:0;bottom:0;
            z-index:40;
            display:grid;
            grid-template-columns:repeat(3,minmax(0,1fr));
            gap:6px;
            background:#fff;
            border-top:1px solid rgba(0,0,0,.1);
            padding:8px 10px calc(8px + env(safe-area-inset-bottom));
            box-shadow:0 -8px 24px rgba(0,0,0,.06);
          }
          .customer-profile-footer a{
            display:flex;
            flex-direction:column;
            align-items:center;
            justify-content:center;
            gap:4px;
            min-height:48px;
            border-radius:12px;
            text-decoration:none;
            color:#0E0E10;
            font:700 11px 'Hanken Grotesk';
            background:#f5f4ef;
          }
          .customer-profile-footer a[aria-current="page"]{
            background:rgba(255,222,46,.45);
          }
          @media(min-width:901px){
            .customer-profile-header{padding:0 26px;min-height:66px}
            .customer-profile-content{padding:28px 36px 40px;gap:24px}
            .customer-profile-footer{display:none}
          }
        `}</style>
      </div>
    </AuthGuard>
  );
}
