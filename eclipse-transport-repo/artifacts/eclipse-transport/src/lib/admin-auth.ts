import { setAuthTokenGetter } from "@workspace/api-client-react";

const STORAGE_KEY = "eclipse_admin_token";

export function getAdminToken(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setAdminToken(token: string): void {
  localStorage.setItem(STORAGE_KEY, token);
  setAuthTokenGetter(() => token);
}

export function clearAdminToken(): void {
  localStorage.removeItem(STORAGE_KEY);
  setAuthTokenGetter(null);
}

export function initAdminAuth(): void {
  const token = getAdminToken();
  if (token) {
    setAuthTokenGetter(() => token);
  }
}

export function isAdminAuthenticated(): boolean {
  return !!getAdminToken();
}
