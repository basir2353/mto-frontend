"use client";

import { useEffect } from "react";
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

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <PushRegistration />
        <GoogleMapsProvider>{children}</GoogleMapsProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
