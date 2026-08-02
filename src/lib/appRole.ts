/** Persist which native/web shell the user opened (customer vs driver APK). */
const KEY = "mto_app_role";

export type AppRole = "customer" | "driver";

export function getAppRole(): AppRole | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(KEY);
    return v === "customer" || v === "driver" ? v : null;
  } catch {
    return null;
  }
}

export function setAppRole(role: AppRole) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, role);
  } catch {
    /* ignore */
  }
}

export function appHomePath(role?: AppRole | null): string {
  const r = role ?? getAppRole();
  if (r === "driver") return "/app/driver";
  if (r === "customer") return "/app/customer";
  return "/app";
}

export function appAuthPath(role?: AppRole | null): string {
  const r = role ?? getAppRole();
  if (r === "driver") return "/auth?app=driver";
  if (r === "customer") return "/auth?app=customer";
  return "/auth";
}
