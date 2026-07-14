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
}

export function getGuestSessionId(): string {
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem(SESSION_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(SESSION_ID_KEY, id);
  }
  return id;
}

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (typeof window !== "undefined") {
    config.headers["X-Session-Id"] = getGuestSessionId();
  }
  return config;
});

export function apiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return (
      (error.response?.data as { message?: string } | undefined)?.message ||
      error.message
    );
  }
  return "Something went wrong. Please try again.";
}
