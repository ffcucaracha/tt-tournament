const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
const ADMIN_TOKEN_KEY = "admin_access_token";
const ADMIN_EMAIL_KEY = "admin_email";

interface RequestOptions extends RequestInit {
  json?: unknown;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { json, headers, ...rest } = options;
  const token = typeof window !== "undefined" ? window.localStorage.getItem(ADMIN_TOKEN_KEY) : null;
  const mergedHeaders = new Headers(headers ?? undefined);
  if (json !== undefined && !mergedHeaders.has("Content-Type")) {
    mergedHeaders.set("Content-Type", "application/json");
  }
  if (token && !mergedHeaders.has("Authorization")) {
    mergedHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: mergedHeaders,
    body: json !== undefined ? JSON.stringify(json) : rest.body
  });

  if (!response.ok) {
    if (response.status === 401) {
      redirectToAdminLogin(path);
    }
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

function redirectToAdminLogin(path: string): void {
  if (typeof window === "undefined" || path === "/admin/auth/login") {
    return;
  }

  window.localStorage.removeItem(ADMIN_TOKEN_KEY);
  window.localStorage.removeItem(ADMIN_EMAIL_KEY);

  const currentPath = `${window.location.pathname}${window.location.search}`;
  if (!currentPath.startsWith("/admin") || currentPath.startsWith("/admin/login")) {
    return;
  }

  const loginUrl = new URL("/admin/login", window.location.origin);
  loginUrl.searchParams.set("from", currentPath);
  window.location.replace(loginUrl.toString());
}
