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
import styles from "./profile.module.css";

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
      <div className={styles.page}>
        <header className={styles.header}>
          <Link href="/customer-app" className={styles.brand}>
            <div className={styles.mark}>M</div>
            <span>MoveThisOut</span>
          </Link>
          <Link href="/customer-app/support" className={styles.helpLink}>
            Help
          </Link>
          <button
            type="button"
            className={styles.logoutTop}
            disabled={loggingOut}
            onClick={() => void handleLogout()}
          >
            {loggingOut ? "…" : "Log out"}
          </button>
        </header>

        <div className={styles.content}>
          <div className={styles.intro}>
            <p className={styles.eyebrow}>Account</p>
            <h1 className={styles.title}>My profile</h1>
            <p className={styles.subtitle}>
              Your name, photo, phone, and address are shown to movers during negotiations and tracking.
            </p>
          </div>

          <AccountProfileForm embedded showChrome={false} />
          <SavedAddressesPanel />
          <UserStatsPanel />
          <CustomerDisputesPanel />

          <section className={styles.dangerZone} aria-label="Sign out">
            <div>
              <div className={styles.dangerTitle}>Sign out</div>
              <div className={styles.dangerHint}>You can sign back in anytime with the same account.</div>
            </div>
            <button
              type="button"
              className={styles.logout}
              disabled={loggingOut}
              onClick={() => void handleLogout()}
            >
              {loggingOut ? "Logging out…" : "Log out"}
            </button>
          </section>
        </div>

        <nav className={styles.footer} aria-label="Customer shortcuts">
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
      </div>
    </AuthGuard>
  );
}
