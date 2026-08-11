"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AppIcon } from "@/components/ui/Icons";
import { setAppRole } from "@/lib/appRole";
import styles from "../app-welcome.module.css";

export default function CustomerAppWelcomePage() {
  const router = useRouter();
  const { isAuthenticated, user, loading } = useAuth();

  useEffect(() => {
    setAppRole("customer");
  }, []);

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
          <p className={styles.tagline}>Book a move in minutes.</p>
        </header>

        <p className={styles.support}>
          Post what you need moved, compare quotes from verified local drivers, and track your job live.
        </p>

        <div className={styles.actions}>
          <Link href="/auth?app=customer#signup" className={styles.primary}>
            <span className={styles.actionIcon}>
              <AppIcon name="package" size={22} color="#0E0E10" />
            </span>
            <span>
              <strong>Create account</strong>
              <em>Start booking moves</em>
            </span>
          </Link>

          <Link href="/auth?app=customer#login" className={styles.signin}>
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
