const ACCESS_KEY = "mto_access_token";
const REFRESH_KEY = "mto_refresh_token";

function canUseStorage() {
  return typeof window !== "undefined";
}

<<<<<<< HEAD
/** One-time migrate from sessionStorage (old web sessions) → localStorage. */
=======
/** One-time migration from legacy sessionStorage sessions to localStorage. */
>>>>>>> ac960226d218fcf032389f207fde44cc1d48f28f
function migrateFromSession() {
  if (!canUseStorage()) return;
  try {
    const access = sessionStorage.getItem(ACCESS_KEY);
    const refresh = sessionStorage.getItem(REFRESH_KEY);
    if (access && !localStorage.getItem(ACCESS_KEY)) {
      localStorage.setItem(ACCESS_KEY, access);
    }
    if (refresh && !localStorage.getItem(REFRESH_KEY)) {
      localStorage.setItem(REFRESH_KEY, refresh);
    }
    if (access) sessionStorage.removeItem(ACCESS_KEY);
    if (refresh) sessionStorage.removeItem(REFRESH_KEY);
  } catch {
    /* private mode / blocked storage */
  }
}

export function getAccessToken(): string | null {
  if (!canUseStorage()) return null;
  migrateFromSession();
  try {
    return localStorage.getItem(ACCESS_KEY);
  } catch {
    return null;
  }
}

export function getRefreshToken(): string | null {
  if (!canUseStorage()) return null;
  migrateFromSession();
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export function setTokens(accessToken: string, refreshToken: string) {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
  } catch {
    /* ignore */
  }
}

export function clearTokens() {
  if (!canUseStorage()) return;
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
  } catch {
    /* ignore */
  }
}

export function hasSession(): boolean {
  return !!getAccessToken();
}
