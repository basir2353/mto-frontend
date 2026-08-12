"use client";

import { useEffect, useRef } from "react";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || "";
/** Google Identity Services caps button width at 400px. */
const GSI_MAX_WIDTH = 400;

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, string | number | boolean>,
          ) => void;
        };
      };
    };
  }
}

export function isGoogleWebAuthConfigured() {
  return Boolean(CLIENT_ID);
}

type Props = {
  onCredential: (idToken: string) => void;
  disabled?: boolean;
  label?: "signin_with" | "signup_with" | "continue_with";
};

export function GoogleSignInButton({
  onCredential,
  disabled,
  label = "continue_with",
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  callbackRef.current = onCredential;

  useEffect(() => {
    if (!CLIENT_ID || !hostRef.current || disabled) return;

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    const buttonWidth = () => {
      const el = hostRef.current;
      if (!el) return GSI_MAX_WIDTH;
      const w = Math.round(el.getBoundingClientRect().width);
      return Math.max(200, Math.min(GSI_MAX_WIDTH, w || GSI_MAX_WIDTH));
    };

    const render = () => {
      if (cancelled || !hostRef.current || !window.google?.accounts?.id) return;
      hostRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response) => {
          if (response.credential) callbackRef.current(response.credential);
        },
      });
      window.google.accounts.id.renderButton(hostRef.current, {
        theme: "outline",
        size: "large",
        text: label,
        shape: "rectangular",
        width: buttonWidth(),
      });

      // Force the GSI wrapper + iframe to fill the form column.
      const child = hostRef.current.firstElementChild as HTMLElement | null;
      if (child) {
        child.style.width = "100%";
        child.style.display = "block";
        const iframe = child.querySelector("iframe");
        if (iframe) {
          iframe.style.width = "100%";
          iframe.setAttribute("width", String(buttonWidth()));
        }
      }
    };

    const setup = () => {
      render();
      if (!hostRef.current || typeof ResizeObserver === "undefined") return;
      let last = buttonWidth();
      resizeObserver = new ResizeObserver(() => {
        const next = buttonWidth();
        if (Math.abs(next - last) < 2) return;
        last = next;
        render();
      });
      resizeObserver.observe(hostRef.current);
    };

    if (window.google?.accounts?.id) {
      setup();
      return () => {
        cancelled = true;
        resizeObserver?.disconnect();
      };
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-google-gsi="1"]',
    );
    if (existing) {
      existing.addEventListener("load", setup);
      return () => {
        cancelled = true;
        resizeObserver?.disconnect();
        existing.removeEventListener("load", setup);
      };
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleGsi = "1";
    script.addEventListener("load", setup);
    document.head.appendChild(script);

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      script.removeEventListener("load", setup);
    };
  }, [disabled, label]);

  if (!CLIENT_ID) return null;

  return (
    <div
      ref={hostRef}
      className="mto-google-btn"
      style={{
        width: "100%",
        marginTop: 12,
        opacity: disabled ? 0.55 : 1,
        pointerEvents: disabled ? "none" : "auto",
      }}
    />
  );
}
