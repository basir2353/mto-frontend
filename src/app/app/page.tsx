"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AppIcon } from "@/components/ui/Icons";
import styles from "./app-welcome.module.css";

export default function MobileAppWelcomePage() {
  const router = useRouter();
  const { isAuthenticated, user, loading } = useAuth();

  useEffect(() => {
    if (loading || !isAuthenticated || !user) return;
    if (user.roles.includes("admin")) router.replace("/admin");
    else if (user.roles.includes("mover")) router.replace("/driver-app");
    else router.replace("/customer-app");
  }, [isAuthenticated, user, loading, router]);

  if (loading || isAuthenticated) {
    return (
      <div className={styles.boot}>
        <div className={styles.bootMark}>M</div>
        <p>Opening MoveThisOut…</p>
      </div>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.atmosphere} aria-hidden />
      <div className={styles.inner}>
        <header className={styles.brand}>
          <div className={styles.mark}>M</div>
          <h1 className={styles.title}>MoveThisOut</h1>
          <p className={styles.tagline}>Move anything. Right now.</p>
        </header>

        <p className={styles.support}>
          Book local drivers in minutes, or earn with your own vehicle — one app for both.
        </p>

        <div className={styles.actions}>
          <Link href="/auth#signup" className={styles.primary}>
            <span className={styles.actionIcon}>
              <AppIcon name="package" size={22} color="#0E0E10" />
            </span>
            <span>
              <strong>Need a move</strong>
              <em>Get quotes and book a driver</em>
            </span>
          </Link>

          <Link href="/driver-signup" className={styles.secondary}>
            <span className={styles.actionIconDark}>
              <AppIcon name="truck" size={22} color="var(--accent)" />
            </span>
            <span>
              <strong>Want to drive</strong>
              <em>Earn with your vehicle</em>
            </span>
          </Link>

          <Link href="/auth#login" className={styles.signin}>
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
