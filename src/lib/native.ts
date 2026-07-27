import { Capacitor } from "@capacitor/core";

/** True when running inside a Capacitor native shell (Android/iOS). */
export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function isMobileAppEntry(): boolean {
  if (typeof window === "undefined") return false;
  if (isNativeApp()) return true;
  try {
    return new URLSearchParams(window.location.search).get("mobile") === "1";
  } catch {
    return false;
  }
}
