"use client";

import { useEffect, useState } from "react";
import { appUrls } from "@/lib/theme/apps";

const DISMISS_KEY = "mto_app_prompt_dismissed";

export default function AppPromptPopup() {
  const [visible, setVisible] = useState(false);

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
      aria-label="Open MoveThisOut apps"
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
            .mto-app-prompt-actions a{width:100%}
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
              font: "900 20px Archivo",
              flex: "none",
            }}
          >
            M
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: "800 16px/1.2 Archivo", letterSpacing: "-.02em" }}>
              Use the MoveThisOut app
            </div>
            <p style={{ margin: "6px 0 0", font: "500 13px/1.4 Hanken Grotesk", color: "rgba(255,255,255,.62)" }}>
              Start a move with locations first. Account details only when you book.
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
          <a href={`${appUrls.customerApp}/customer-app`} onClick={dismiss} style={primaryBtn}>
            Open customer app
          </a>
          <button type="button" onClick={dismiss} style={secondaryBtn}>
            Not now
          </button>
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
  font: "800 13px Archivo",
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
  font: "800 13px Archivo",
  textDecoration: "none",
  padding: "0 12px",
  cursor: "pointer",
};
