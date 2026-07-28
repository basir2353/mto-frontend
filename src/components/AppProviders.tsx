"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import GoogleMapsProvider from "@/components/maps/GoogleMapsProvider";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ToastProvider } from "@/components/ui/Toast";
import { registerPushServiceWorker, syncGrantedPushSubscription } from "@/lib/push";

function PushRegistration() {
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    void registerPushServiceWorker();
  }, []);

  useEffect(() => {
    if (userId) void syncGrantedPushSubscription();
  }, [userId]);

  return null;
}

function NativeShellBootstrap() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;
    let removeBack: (() => void) | undefined;

    (async () => {
      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        if (cancelled) return;
        // Light app chrome: dark status icons + cream bar (avoid empty black strip on Android).
        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: "#F5F4EF" });
      } catch {
        /* plugin unavailable on web */
      }

      try {
        const { SplashScreen } = await import("@capacitor/splash-screen");
        if (cancelled) return;
        await SplashScreen.hide();
      } catch {
        /* ignore */
      }

      try {
        const { App } = await import("@capacitor/app");
        if (cancelled) return;
        const handle = await App.addListener("backButton", ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            void App.exitApp();
          }
        });
        removeBack = () => {
          void handle.remove();
        };
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
      removeBack?.();
    };
  }, []);

  return null;
}

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <NativeShellBootstrap />
        <PushRegistration />
        <GoogleMapsProvider>{children}</GoogleMapsProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
