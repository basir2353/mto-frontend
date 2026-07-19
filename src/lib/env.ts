export const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";
export const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
export const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

function resolveApiOrigin(base: string): string {
  try {
    return new URL(base).origin;
  } catch {
    return "http://localhost:4000";
  }
}

export const apiOrigin = resolveApiOrigin(apiBaseUrl);

export const hasGoogleMaps = googleMapsApiKey.length > 0;
export const hasWebPush = vapidPublicKey.length > 0;

export const isProdBuild = process.env.NODE_ENV === "production";

if (isProdBuild && process.env.NEXT_PUBLIC_USE_MOCKS === "true") {
  console.warn("[MTO] NEXT_PUBLIC_USE_MOCKS=true in production — disable mocks for live traffic.");
}
