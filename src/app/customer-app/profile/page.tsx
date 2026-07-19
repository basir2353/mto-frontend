"use client";

import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import { AccountProfileForm } from "@/components/profile/AccountProfileForm";
import { SavedAddressesPanel } from "@/components/profile/SavedAddressesPanel";
import { UserStatsPanel } from "@/components/profile/UserStatsPanel";
import { CustomerDisputesPanel } from "@/components/profile/CustomerDisputesPanel";

export default function CustomerProfilePage() {
  return (
    <AuthGuard roles={["customer"]}>
      <div
        style={{
          background: "#F5F4EF",
          height: "100dvh",
          width: "100%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
          <div className="customer-profile-header" style={{ height: 66, flex: "none", background: "#0E0E10", color: "#fff", display: "flex", alignItems: "center", padding: "0 26px", gap: 16 }}>
            <Link href="/customer-app" style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none", color: "#fff" }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", font: "900 17px 'Archivo'", color: "#0E0E10" }}>
                M
              </div>
              <span style={{ font: "800 19px 'Archivo'" }}>MoveThisOut</span>
            </Link>
            <span style={{ marginLeft: "auto", font: "700 13px 'Hanken Grotesk'", color: "rgba(255,255,255,.6)" }}>Profile</span>
          </div>
          <div className="customer-profile-content" style={{ flex: 1, overflow: "auto", minHeight: 0, padding: "28px 36px 40px", display: "flex", flexDirection: "column", gap: 24 }}>
            <AccountProfileForm backHref="/customer-app" backLabel="Back to app" title="My profile" subtitle="Your name, photo, phone, and address are shown to movers during negotiations and tracking." />
            <UserStatsPanel />
            <CustomerDisputesPanel />
            <SavedAddressesPanel />
          </div>
          <style>{`
            @media(max-width:600px){
              .customer-profile-header{height:58px!important;padding:0 14px!important}
              .customer-profile-header a>span{display:none}
              .customer-profile-content{padding:20px 14px 32px!important;gap:18px!important}
            }
          `}</style>
      </div>
    </AuthGuard>
  );
}
