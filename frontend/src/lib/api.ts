import axios, { AxiosError } from "axios";

/**
 * Shared Axios instance. In the browser we hit the same-origin `/api` proxy
 * (see next.config rewrites) so cookies / CORS stay simple; on the server we
 * call the backend directly.
 */
const baseURL =
  typeof window === "undefined"
    ? process.env.API_PROXY_TARGET || "http://localhost:5000"
    : "";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

const ACCESS_TOKEN_KEY = "sc_access_token";
const SESSION_ID_KEY = "sc_session_id";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  else window.localStorage.removeItem(ACCESS_TOKEN_KEY);

  // Ensure any in-flight Axios requests after login/logout pick up the new token.
  // (Axios request interceptor reads from localStorage at request time, but this
  // helps prevent edge cases with cached interceptor config.)
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}


export function getGuestSessionId(): string {
  if (typeof window === "undefined") return "server";

  let id = window.localStorage.getItem(SESSION_ID_KEY);
  if (!id) {
    // crypto.randomUUID() is not available in some older/edge runtimes.
    // Provide a safe fallback so guest carts never lose their session id.
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      id = crypto.randomUUID();
    } else {
      id = `guest-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
    window.localStorage.setItem(SESSION_ID_KEY, id);
  }

  return id;
}


api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token && token.trim().length > 0) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (typeof window !== "undefined") {
    config.headers["X-Session-Id"] = getGuestSessionId();
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (typeof window === "undefined") throw error;

    const status = error?.response?.status;
    if (status !== 401) throw error;

    // Clear invalid/expired JWT and proceed as guest.
    setStoredToken(null);

    // Retry once; request interceptor will attach X-Session-Id.
    const originalConfig = error.config;
    if (!originalConfig || originalConfig.__isRetried) throw error;

    originalConfig.__isRetried = true;
    if (originalConfig.headers) {
      delete originalConfig.headers.Authorization;
    }

    return api.request(originalConfig);
  }
);


export function apiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return (
      (error.response?.data as { message?: string } | undefined)?.message ||
      error.message
    );
  }
  return "Something went wrong. Please try again.";
}
