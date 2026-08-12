"use client";

import { useEffect, useRef } from "react";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || "";

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
        width: 360,
      });
    };

    if (window.google?.accounts?.id) {
      render();
      return () => {
        cancelled = true;
      };
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-google-gsi="1"]',
    );
    if (existing) {
      existing.addEventListener("load", render);
      return () => {
        cancelled = true;
        existing.removeEventListener("load", render);
      };
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleGsi = "1";
    script.addEventListener("load", render);
    document.head.appendChild(script);

    return () => {
      cancelled = true;
      script.removeEventListener("load", render);
    };
  }, [disabled, label]);

  if (!CLIENT_ID) return null;

  return (
    <div
      ref={hostRef}
      style={{
        display: "flex",
        justifyContent: "center",
        marginTop: 12,
        opacity: disabled ? 0.55 : 1,
        pointerEvents: disabled ? "none" : "auto",
      }}
    />
  );
}
