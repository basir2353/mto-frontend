/**
 * Generate Capacitor configs for customer + driver Android flavors.
 * Usage: node scripts/prepare-apk-variants.mjs
 */
import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const FRONTEND_URL = (
  process.env.CAPACITOR_SERVER_URL?.trim() ||
  "https://mto-frontend-xi.vercel.app"
).replace(/\/$/, "");

const variants = {
  customer: {
    appId: "com.movethisout.customer",
    appName: "MoveThisOut",
    startPath: "/app/customer",
  },
  driver: {
    appId: "com.movethisout.driver",
    appName: "MoveThisOut Driver",
    startPath: "/app/driver",
  },
};

function buildConfig(variant) {
  return {
    appId: variant.appId,
    appName: variant.appName,
    webDir: "public",
    server: {
      url: `${FRONTEND_URL}${variant.startPath}`,
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
}

const active = process.env.CAPACITOR_VARIANT === "driver" ? "driver" : "customer";
const activeConfig = buildConfig(variants[active]);

// Root capacitor.config.json used by `cap sync` (writes into main/assets).
writeFileSync(
  join(root, "capacitor.config.json"),
  `${JSON.stringify(activeConfig, null, 2)}\n`,
);

for (const [name, variant] of Object.entries(variants)) {
  const dir = join(root, "android", "app", "src", name, "assets");
  mkdirSync(dir, { recursive: true });
  const cfg = buildConfig(variant);
  writeFileSync(join(dir, "capacitor.config.json"), `${JSON.stringify(cfg, null, 2)}\n`);
  console.log(`Wrote ${name} → ${cfg.server.url} (${cfg.appId})`);
}

console.log(`Active cap sync variant: ${active}`);
