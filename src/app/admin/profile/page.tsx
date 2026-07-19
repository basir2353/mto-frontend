"use client";

import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import { AccountProfileForm } from "@/components/profile/AccountProfileForm";
import styles from "./profile.module.css";

export default function AdminProfilePage() {
  return (
    <AuthGuard roles={["admin"]}>
      <div className={styles.page} style={{ background: "#0E0E10", minHeight: "100vh", padding: 24 }}>
        <div
          className={styles.shell}
          style={{
            maxWidth: 900,
            margin: "0 auto",
            borderRadius: 18,
            overflow: "hidden",
            background: "#F5F4EF",
            boxShadow: "0 30px 80px -20px rgba(0,0,0,.5)",
            minHeight: "min(900px, calc(100vh - 48px))",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ height: 66, flex: "none", background: "#0E0E10", color: "#fff", display: "flex", alignItems: "center", padding: "0 26px", gap: 16 }}>
            <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none", color: "#fff" }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", font: "900 17px 'Archivo'", color: "#0E0E10" }}>
                M
              </div>
              <span style={{ font: "800 19px 'Archivo'" }}>Admin</span>
            </Link>
            <span style={{ marginLeft: "auto", font: "700 13px 'Hanken Grotesk'", color: "rgba(255,255,255,.6)" }}>My account</span>
          </div>
          <AccountProfileForm
            backHref="/admin"
            backLabel="Back to admin panel"
            title="Admin profile"
            subtitle="Set your display name and contact details for the admin account."
          />
        </div>
      </div>
    </AuthGuard>
  );
}
