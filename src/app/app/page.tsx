"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AppIcon } from "@/components/ui/Icons";
import styles from "./app-welcome.module.css";

/** Legacy app entry kept as a customer-route alias for existing web links. */
export default function MobileAppWelcomePage() {
  const router = useRouter();
  const { isAuthenticated, user, loading } = useAuth();

  useEffect(() => {
    if (loading || !isAuthenticated || !user) return;
    router.replace("/customer-app");
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
          Book, manage, and track your moves from one place.
        </p>

        <div className={styles.actions}>
          <Link href="/app/customer" className={styles.primary}>
            <span className={styles.actionIcon}>
              <AppIcon name="package" size={22} color="#0E0E10" />
            </span>
            <span>
              <strong>Customer</strong>
              <em>Book and track a move</em>
            </span>
          </Link>

        </div>
      </div>
    </main>
  );
}
