import type { CapacitorConfig } from "@capacitor/cli";

const FRONTEND_URL =
  process.env.CAPACITOR_SERVER_URL?.trim() ||
  "https://mto-frontend.vercel.app";

const config: CapacitorConfig = {
  appId: "com.movethisout.app",
  appName: "MoveThisOut",
  webDir: "public",
  server: {
    // Hosted Next.js app — booking + driver flows stay on Vercel.
    url: `${FRONTEND_URL.replace(/\/$/, "")}/app`,
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: "#0E0E10",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0E0E10",
    },
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#0E0E10",
  },
};

export default config;
