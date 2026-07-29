import type { NextConfig } from "next";

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL?.trim() ||
  "https://mto-backend-production.up.railway.app/api/v1";
let apiHostname: string | undefined;
try {
  apiHostname = new URL(apiUrl).hostname;
} catch {
  apiHostname = undefined;
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      ...(apiHostname
        ? [
            {
              protocol: "https" as const,
              hostname: apiHostname,
            },
            {
              protocol: "http" as const,
              hostname: apiHostname,
            },
          ]
        : []),
      {
        protocol: "https",
        hostname: "**.up.railway.app",
      },
    ],
  },
  async rewrites() {
    const dest = apiUrl.replace(/\/$/, "");
    return [
      {
        // Same-origin proxy so Capacitor WebView avoids flaky cross-origin multipart uploads.
        source: "/mto-api/:path*",
        destination: `${dest}/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
