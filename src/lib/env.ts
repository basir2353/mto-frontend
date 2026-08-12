export const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";
export const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

const PROD_API_FALLBACK = "https://mto-backend-production.up.railway.app/api/v1";
const DEV_API_FALLBACK = "http://localhost:4000/api/v1";

/** Absolute Railway (or local) API — used for sockets, uploads CDN origin, and SSR. */
export const directApiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL?.trim() ||
  (process.env.NODE_ENV === "production" ? PROD_API_FALLBACK : DEV_API_FALLBACK);

/**
<<<<<<< HEAD
 * Browser fetch base. On Vercel (and local Next) use the same-origin `/mto-api`
 * rewrite so uploads and requests avoid cross-origin issues.
=======
 * Browser fetch base. On Vercel and local Next, use the same-origin `/mto-api`
 * rewrite to avoid cross-origin request failures.
>>>>>>> ac960226d218fcf032389f207fde44cc1d48f28f
 */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (
      host.endsWith("vercel.app") ||
      host === "localhost" ||
      host === "127.0.0.1"
    ) {
      return `${window.location.origin}/mto-api`;
    }
  }
  return directApiBaseUrl;
}

/** @deprecated Prefer getApiBaseUrl() in client code — kept for modules evaluated at import time. */
export const apiBaseUrl = directApiBaseUrl;

function resolveApiOrigin(base: string): string {
  try {
    return new URL(base).origin;
  } catch {
    return "http://localhost:4000";
  }
}

export const apiOrigin = resolveApiOrigin(directApiBaseUrl);

export const hasGoogleMaps = googleMapsApiKey.length > 0;
export const hasWebPush = vapidPublicKey.length > 0;

export const isProdBuild = process.env.NODE_ENV === "production";

if (isProdBuild && process.env.NEXT_PUBLIC_USE_MOCKS === "true") {
  console.warn("[MTO] NEXT_PUBLIC_USE_MOCKS=true in production — disable mocks for live traffic.");
}
