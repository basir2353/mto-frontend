"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AppIcon } from "@/components/ui/Icons";
import { setAppRole } from "@/lib/appRole";
import styles from "../app-welcome.module.css";

export default function DriverAppWelcomePage() {
  const router = useRouter();
  const { isAuthenticated, user, loading } = useAuth();

  useEffect(() => {
    setAppRole("driver");
  }, []);

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
        <p>Opening MoveThisOut Driver…</p>
      </div>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.atmosphere} aria-hidden />
      <div className={styles.inner}>
        <header className={styles.brand}>
          <div className={styles.mark}>M</div>
          <h1 className={styles.title}>MoveThisOut Driver</h1>
          <p className={styles.tagline}>Earn with your vehicle.</p>
        </header>

        <p className={styles.support}>
          Get nearby job requests, send quotes, and complete paid moves on your schedule.
        </p>

        <div className={styles.actions}>
          <Link href="/driver-signup" className={styles.primary}>
            <span className={styles.actionIcon}>
              <AppIcon name="truck" size={22} color="#0E0E10" />
            </span>
            <span>
              <strong>Apply to drive</strong>
              <em>Create your driver account</em>
            </span>
          </Link>

          <Link href="/auth?app=driver#login" className={styles.signin}>
            Already a driver? Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
