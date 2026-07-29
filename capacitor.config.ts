import type { CapacitorConfig } from "@capacitor/cli";

const FRONTEND_URL =
  process.env.CAPACITOR_SERVER_URL?.trim() ||
  "https://mto-frontend-xi.vercel.app";

const config: CapacitorConfig = {
  appId: "com.movethisout.app",
  appName: "MoveThisOut",
  webDir: "public",
  server: {
    // Hosted Next.js app — booking + driver flows stay on Vercel.
    url: `${FRONTEND_URL.replace(/\/$/, "")}/app`,
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
