"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "mto_app_prompt_dismissed";

/** Optional native/Expo customer app — never required to book on the website. */
function nativeCustomerAppUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_CUSTOMER_NATIVE_APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  if (process.env.NODE_ENV !== "production") return "http://localhost:8081";
  return "";
}

export default function AppPromptPopup() {
  const [visible, setVisible] = useState(false);
  const appUrl = nativeCustomerAppUrl();

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* ignore */
    }
    const t = window.setTimeout(() => setVisible(true), 1600);
    return () => window.clearTimeout(t);
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Book on website or open the app"
      style={{
        position: "fixed",
        zIndex: 1200,
        right: 18,
        bottom: "max(18px, env(safe-area-inset-bottom))",
        left: 18,
        display: "flex",
        justifyContent: "flex-end",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          pointerEvents: "auto",
          width: "min(380px, 100%)",
          background: "#0E0E10",
          color: "#fff",
          borderRadius: 20,
          padding: "18px 18px 16px",
          boxShadow: "0 22px 60px rgba(0,0,0,.35)",
          border: "1px solid rgba(255,255,255,.08)",
          animation: "mtoAppPromptIn .35s cubic-bezier(.22,1,.36,1)",
        }}
      >
        <style>{`
          @keyframes mtoAppPromptIn{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
          @media(max-width:520px){
            .mto-app-prompt-actions{flex-direction:column!important}
            .mto-app-prompt-actions a,.mto-app-prompt-actions button{width:100%}
          }
        `}</style>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "var(--accent)",
              color: "#0E0E10",
              display: "grid",
              placeItems: "center",
              font: "900 20px var(--font-archivo)",
              flex: "none",
            }}
          >
            M
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: "800 16px/1.2 var(--font-archivo)", letterSpacing: "-.02em" }}>
              Book on this website
            </div>
            <p style={{ margin: "6px 0 0", font: "500 13px/1.4 var(--font-hanken)", color: "rgba(255,255,255,.62)" }}>
              Enter pickup and drop-off, then finish your move here. Prefer the app? You can open it anytime — optional.
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,.14)",
              background: "rgba(255,255,255,.06)",
              color: "#fff",
              fontSize: 18,
              lineHeight: 1,
              cursor: "pointer",
              flex: "none",
            }}
          >
            ×
          </button>
        </div>

        <div className="mto-app-prompt-actions" style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={dismiss} style={{ ...primaryBtn, border: "none", cursor: "pointer" }}>
            Continue on website
          </button>
          {appUrl ? (
            <a
              href={appUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={dismiss}
              style={secondaryBtn}
            >
              Open app
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  flex: 1,
  minHeight: 44,
  borderRadius: 12,
  background: "var(--accent)",
  color: "#0E0E10",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  font: "800 13px var(--font-archivo)",
  textDecoration: "none",
  padding: "0 12px",
};

const secondaryBtn: React.CSSProperties = {
  flex: 1,
  minHeight: 44,
  borderRadius: 12,
  background: "rgba(255,255,255,.08)",
  border: "1px solid rgba(255,255,255,.14)",
  color: "#fff",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  font: "800 13px var(--font-archivo)",
  textDecoration: "none",
  padding: "0 12px",
  cursor: "pointer",
};
