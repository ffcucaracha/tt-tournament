import { request } from "./httpClient";

export async function loginAdmin(payload: { email: string; password: string }): Promise<{
  accessToken: string;
  admin: { id: string; email: string };
}> {
  return request("/admin/auth/login", {
    method: "POST",
    json: payload
  });
}

export async function logoutAdmin(): Promise<{ ok: boolean }> {
  return request("/admin/auth/logout", {
    method: "POST"
  });
}
