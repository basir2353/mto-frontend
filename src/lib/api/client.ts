import { getApiBaseUrl } from "@/lib/env";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "@/lib/session";
import { ApiError } from "./errors";
import { useMocks } from "./mock/config";
import { mockRequest } from "./mock/handlers";

export { ApiError };

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  statusCode?: number;
  message?: string | string[];
};

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const base = getApiBaseUrl();
  const res = await fetch(`${base}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  const body = (await res.json()) as ApiEnvelope<{ accessToken: string; refreshToken: string }>;
  if (!body.success || !body.data) {
    clearTokens();
    return null;
  }

  setTokens(body.data.accessToken, body.data.refreshToken);
  return body.data.accessToken;
}

async function getValidToken(): Promise<string | null> {
  return getAccessToken();
}

function buildHeaders(options: RequestInit, token: string | null): Record<string, string> {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  // Never force Content-Type on FormData — WebView must set multipart boundary.
  if (isFormData) delete headers["Content-Type"];
  return headers;
}

async function fetchApi(path: string, options: RequestInit, headers: Record<string, string>) {
  const base = getApiBaseUrl();
  try {
    return await fetch(`${base}${path}`, { ...options, headers });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "network error";
    throw new ApiError(0, [
      `Cannot reach the API server (${base}). ${detail}. Check your connection and try again.`,
    ]);
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const token = await getValidToken();
  if (useMocks) return mockRequest<T>(path, options, token);

  const headers = buildHeaders(options, token);
  const res = await fetchApi(path, options, headers);

  let body: ApiEnvelope<T>;
  try {
    const text = await res.text();
    body = text ? (JSON.parse(text) as ApiEnvelope<T>) : { success: false, message: res.statusText };
  } catch {
    throw new ApiError(res.status, [
      res.status === 404 ? `Cannot POST ${path}` : res.statusText || "Invalid server response",
    ]);
  }

  if (res.status === 401 && retry && getRefreshToken()) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }
    const newToken = await refreshPromise;
    if (newToken) return api<T>(path, options, false);
  }

  if (!body.success) {
    const msg = body.message;
    const messages = Array.isArray(msg) ? msg : [msg ?? res.statusText ?? "Request failed"];
    throw new ApiError(body.statusCode ?? res.status, messages.filter(Boolean) as string[]);
  }

  return body.data as T;
}

export async function apiPublic<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (useMocks) return mockRequest<T>(path, options, null);

  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string>),
  };
  if (isFormData) delete headers["Content-Type"];

  let res: Response;
  try {
    res = await fetchApi(path, options, headers);
  } catch (e) {
    throw e;
  }

  let body: ApiEnvelope<T>;
  try {
    const text = await res.text();
    body = text ? (JSON.parse(text) as ApiEnvelope<T>) : { success: false, message: res.statusText };
  } catch {
    throw new ApiError(res.status, [
      res.status === 404
        ? `Cannot POST ${path}`
        : res.statusText || "Invalid server response",
    ]);
  }

  if (!body.success) {
    const msg = body.message;
    const messages = Array.isArray(msg) ? msg : [msg ?? res.statusText ?? "Request failed"];
    throw new ApiError(body.statusCode ?? res.status, messages.filter(Boolean) as string[]);
  }
  return body.data as T;
}
