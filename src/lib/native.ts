/** True when the site was opened in "app" mode via the `?mobile=1` entry link. */
export function isMobileAppEntry(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get("mobile") === "1";
  } catch {
    return false;
  }
}
