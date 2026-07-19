import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
let apiHostname: string | undefined;
try {
  apiHostname = apiUrl ? new URL(apiUrl).hostname : undefined;
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
