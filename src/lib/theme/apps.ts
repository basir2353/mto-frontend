/** Cross-app local/prod base URLs */
const isProd = process.env.NODE_ENV === "production";

export const appUrls = {
  marketing:
    process.env.NEXT_PUBLIC_MARKETING_URL?.trim() ||
    (isProd ? "https://mto-frontend.vercel.app" : "http://localhost:3000"),
  admin:
    process.env.NEXT_PUBLIC_ADMIN_URL?.trim() ||
    (isProd ? "https://mto-admin.vercel.app" : "http://localhost:3001"),
  driverWeb:
    process.env.NEXT_PUBLIC_DRIVER_WEB_URL?.trim() ||
    (isProd ? "https://mto-driver-web.vercel.app" : "http://localhost:3002"),
  customerApp:
    process.env.NEXT_PUBLIC_CUSTOMER_APP_URL?.trim() || "http://localhost:8081",
  driverApp:
    process.env.NEXT_PUBLIC_DRIVER_APP_URL?.trim() || "http://localhost:8082",
} as const;
