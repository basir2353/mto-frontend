"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
type NavKey = "move" | "business" | "about" | "";

export default function SiteNav({ active = "" }: { active?: NavKey }) {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const color = (key: NavKey) => (active === key ? "#fff" : "rgba(255,255,255,.6)");

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const loginHref = "/auth#login";
  const signupHref = "/auth#signup";
  const signupLabel = "Sign up";

  return (
    <div className="mto-nav">
      <Link href="/" className="mto-nav-brand" onClick={() => setMenuOpen(false)}>
        <div className="mto-nav-mark">M</div>
        <span className="mto-nav-name">MoveThisOut</span>
      </Link>

      <div className="mto-nav-links">
        <Link href="/" style={{ textDecoration: "none", color: color("move") }}>
          Move
        </Link>
        <Link href="/business" style={{ textDecoration: "none", color: color("business") }}>
          Business
        </Link>
        <div style={{ position: "relative" }} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
          <Link href="/about" style={{ textDecoration: "none", color: color("about"), display: "flex", alignItems: "center", gap: 6 }}>
            About <span style={{ fontSize: 8, opacity: 0.7 }}>▼</span>
          </Link>
          {open && (
            <div style={{ position: "absolute", top: "100%", left: -18, paddingTop: 14 }}>
              <div className="mto-nav-dropdown" style={{ width: 230 }}>
                <Link href="/about" className="mto-nav-dropdown-link">Our story</Link>
                <Link href="/about#safety" className="mto-nav-dropdown-link">Safety</Link>
                <Link href="/about#values" className="mto-nav-dropdown-link">How we operate</Link>
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
        <Link href={loginHref} className="mto-nav-login">
          Log in
        </Link>
        <Link href={signupHref} className="mto-nav-signup">
          {signupLabel}
        </Link>
      </div>

      <button type="button" className="mto-nav-burger" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}>
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
            <Link href={loginHref} onClick={() => setMenuOpen(false)} className="mto-nav-drawer-login">
              Log in
            </Link>
            <Link href={signupHref} onClick={() => setMenuOpen(false)} className="mto-nav-drawer-signup">
              {signupLabel}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
