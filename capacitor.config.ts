import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Default Capacitor config (customer). Flavor-specific configs are generated into
 * android/app/src/{customer,driver}/assets by `npm run apk:prepare`.
 */
const FRONTEND_URL =
  process.env.CAPACITOR_SERVER_URL?.trim() ||
  "https://mto-frontend-xi.vercel.app";

const isDriver = process.env.CAPACITOR_VARIANT === "driver";

const config: CapacitorConfig = {
  appId: isDriver ? "com.movethisout.driver" : "com.movethisout.customer",
  appName: isDriver ? "MoveThisOut Driver" : "MoveThisOut",
  webDir: "public",
  server: {
    url: `${FRONTEND_URL.replace(/\/$/, "")}${isDriver ? "/app/driver" : "/app/customer"}`,
    cleartext: false,
    allowNavigation: [
      "mto-frontend-xi.vercel.app",
      "mto-frontend.vercel.app",
      "mto-backend-production.up.railway.app",
      "*.vercel.app",
      "*.up.railway.app",
    ],
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: "#0E0E10",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#F5F4EF",
    },
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#F5F4EF",
  },
};

export default config;
