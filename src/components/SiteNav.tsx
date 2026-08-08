"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { appUrls } from "@/lib/theme/apps";

type NavKey = "move" | "earn" | "business" | "about" | "";

export default function SiteNav({ active = "" }: { active?: NavKey }) {
  const [open, setOpen] = useState<"earn" | "about" | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const on = "#fff";
  const off = "rgba(255,255,255,.6)";
  const cMove = active === "move" ? on : off;
  const cEarn = active === "earn" ? on : off;
  const cBiz = active === "business" ? on : off;
  const cAbout = active === "about" ? on : off;

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const loginHref = `${appUrls.customerApp}/auth#login`;
  const signupHref = `${appUrls.customerApp}/customer-app`;
  const signupLabel = "Sign up";

  return (
    <div className="mto-nav">
      <Link href="/" className="mto-nav-brand" onClick={() => setMenuOpen(false)}>
        <div className="mto-nav-mark">M</div>
        <span className="mto-nav-name">MoveThisOut</span>
      </Link>

      <div className="mto-nav-links">
        <Link href="/" style={{ textDecoration: "none", color: cMove }}>
          Move
        </Link>

        <div
          style={{ position: "relative" }}
          onMouseEnter={() => setOpen("earn")}
          onMouseLeave={() => setOpen(null)}
        >
          <a
            href={`${appUrls.driverWeb}/signup`}
            style={{
              textDecoration: "none",
              color: cEarn,
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
            }}
          >
            Earn <span style={{ fontSize: 8, opacity: 0.7 }}>▼</span>
          </a>
          {open === "earn" && (
            <div style={{ position: "absolute", top: "100%", left: -18, paddingTop: 14 }}>
              <div className="mto-nav-dropdown">
                <a href={`${appUrls.driverWeb}/signup`} className="mto-nav-dropdown-link">
                  <b>Become a driver</b>
                  <span>Drive with your own vehicle</span>
                </a>
                <a href={`${appUrls.driverWeb}/login`} className="mto-nav-dropdown-link">
                  Driver login
                </a>
              </div>
            </div>
          )}
        </div>

        <Link href="/business" style={{ textDecoration: "none", color: cBiz }}>
          Business
        </Link>

        <div
          style={{ position: "relative" }}
          onMouseEnter={() => setOpen("about")}
          onMouseLeave={() => setOpen(null)}
        >
          <Link
            href="/about"
            style={{
              textDecoration: "none",
              color: cAbout,
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
            }}
          >
            About <span style={{ fontSize: 8, opacity: 0.7 }}>▼</span>
          </Link>
          {open === "about" && (
            <div style={{ position: "absolute", top: "100%", left: -18, paddingTop: 14 }}>
              <div className="mto-nav-dropdown" style={{ width: 230 }}>
                <Link href="/about" className="mto-nav-dropdown-link">
                  Our story
                </Link>
                <Link href="/about#safety" className="mto-nav-dropdown-link">
                  Safety
                </Link>
                <Link href="/about#values" className="mto-nav-dropdown-link">
                  How we operate
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mto-nav-actions">
        <span className="mto-nav-lang">
          <span className="mto-nav-lang-dot" />
          EN
        </span>
        <Link href="/help" className="mto-nav-help">
          Help
        </Link>
        <a href={loginHref} className="mto-nav-login">
          Log in
        </a>
        <a href={signupHref} className="mto-nav-signup">
          {signupLabel}
        </a>
      </div>

      <button
        type="button"
        className="mto-nav-burger"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((v) => !v)}
      >
        <span className={menuOpen ? "mto-nav-burger-bar is-open" : "mto-nav-burger-bar"} />
        <span className={menuOpen ? "mto-nav-burger-bar is-open" : "mto-nav-burger-bar"} />
        <span className={menuOpen ? "mto-nav-burger-bar is-open" : "mto-nav-burger-bar"} />
      </button>

      {menuOpen && (
        <div className="mto-nav-drawer" role="dialog" aria-modal="true">
          <div className="mto-nav-drawer-links">
            <Link href="/" onClick={() => setMenuOpen(false)} className={active === "move" ? "is-active" : undefined}>
              Move
            </Link>
            <a href={`${appUrls.driverWeb}/signup`} onClick={() => setMenuOpen(false)} className={active === "earn" ? "is-active" : undefined}>
              Earn
            </a>
            <Link href="/business" onClick={() => setMenuOpen(false)} className={active === "business" ? "is-active" : undefined}>
              Business
            </Link>
            <Link href="/about" onClick={() => setMenuOpen(false)} className={active === "about" ? "is-active" : undefined}>
              About
            </Link>
            <Link href="/help" onClick={() => setMenuOpen(false)}>
              Help
            </Link>
          </div>
          <div className="mto-nav-drawer-cta">
            <a href={loginHref} onClick={() => setMenuOpen(false)} className="mto-nav-drawer-login">
              Log in
            </a>
            <a href={signupHref} onClick={() => setMenuOpen(false)} className="mto-nav-drawer-signup">
              {signupLabel}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
