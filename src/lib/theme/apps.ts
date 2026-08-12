/** Cross-app local / live base URLs. Live builds never fall back to localhost. */

const LIVE = {
  marketing: "https://mto-frontend.vercel.app",
  admin: "https://mto-admin.vercel.app",
  driverWeb: "https://mto-driver-web.vercel.app",
  /** No separate customer web deploy yet — live CTAs stay on marketing. */
  customerApp: "https://mto-frontend.vercel.app",
  /** Driver jobs web portal (Expo local stays on :8082). */
  driverApp: "https://mto-driver-web.vercel.app/driver-app",
} as const;

const LOCAL = {
  marketing: "http://localhost:3000",
  admin: "http://localhost:3001",
  driverWeb: "http://localhost:3002",
  /** Customer booking lives on marketing web (same-site). */
  customerApp: "http://localhost:3000",
  driverApp: "http://localhost:8082",
} as const;

const isProd = process.env.NODE_ENV === "production";

function stripSlash(url: string) {
  return url.replace(/\/+$/, "");
}

function isLocalhostUrl(url: string) {
  try {
    const host = new URL(url, "http://localhost").hostname;
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return /localhost|127\.0\.0\.1/i.test(url);
  }
}

function pick(envValue: string | undefined, local: string, live: string) {
  const fromEnv = envValue?.trim();
  if (fromEnv) {
    const cleaned = stripSlash(fromEnv);
    // Live/prod must never hand out localhost, even if env is mis-set.
    if (isProd && isLocalhostUrl(cleaned)) return live;
    return cleaned;
  }
  return isProd ? live : local;
}

const staticAppUrls = {
  marketing: pick(process.env.NEXT_PUBLIC_MARKETING_URL, LOCAL.marketing, LIVE.marketing),
  admin: pick(process.env.NEXT_PUBLIC_ADMIN_URL, LOCAL.admin, LIVE.admin),
  driverWeb: pick(process.env.NEXT_PUBLIC_DRIVER_WEB_URL, LOCAL.driverWeb, LIVE.driverWeb),
  customerApp: pick(
    process.env.NEXT_PUBLIC_CUSTOMER_APP_URL,
    LOCAL.customerApp,
    LIVE.customerApp,
  ),
  driverApp: pick(process.env.NEXT_PUBLIC_DRIVER_APP_URL, LOCAL.driverApp, LIVE.driverApp),
} as const;

function liveUpgrade(url: string, live: string) {
  return isLocalhostUrl(url) ? live : url;
}

/**
 * Prefer this in client components. On a live host (e.g. *.vercel.app),
 * any leftover localhost URL is upgraded to the live sibling.
 */
export function getAppUrls() {
  if (typeof window === "undefined") return staticAppUrls;

  const host = window.location.hostname;
  const onLocal = host === "localhost" || host === "127.0.0.1";
  if (onLocal) return staticAppUrls;

  return {
    marketing: liveUpgrade(staticAppUrls.marketing, LIVE.marketing),
    admin: liveUpgrade(staticAppUrls.admin, LIVE.admin),
    driverWeb: liveUpgrade(staticAppUrls.driverWeb, LIVE.driverWeb),
    customerApp: liveUpgrade(staticAppUrls.customerApp, LIVE.customerApp),
    driverApp: liveUpgrade(staticAppUrls.driverApp, LIVE.driverApp),
  } as const;
}

/** Build-time / SSR defaults. Client UI should prefer getAppUrls(). */
export const appUrls = staticAppUrls;

export function sameAppOrigin(a: string, b: string) {
  try {
    return new URL(a, "http://localhost").origin === new URL(b, "http://localhost").origin;
  } catch {
    return stripSlash(a) === stripSlash(b);
  }
}
