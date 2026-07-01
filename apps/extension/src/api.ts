import { loginSchema } from "@s-shoter/shared";
import { API_BASE_URL } from "./config";
import { clearAccessToken } from "./storage";

export class AuthError extends Error {
  constructor() {
    super("Требуется повторный вход");
  }
}

export interface TodayItem {
  id: string;
  capturedAt: string;
  thumbnailUrl: string;
}

export interface TodayResponse {
  count: number;
  items: TodayItem[];
}

async function authFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status === 401) {
    await clearAccessToken();
    throw new AuthError();
  }
  return res;
}

export async function login(email: string, password: string): Promise<string> {
  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) {
    throw new Error("Введите email и пароль");
  }

  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed.data),
  });
  if (!res.ok) {
    throw new Error("Неверный email или пароль");
  }
  const data = (await res.json()) as { accessToken: string };
  return data.accessToken;
}

export async function fetchToday(token: string): Promise<TodayResponse> {
  const tz = new Date().getTimezoneOffset();
  const res = await authFetch(`${API_BASE_URL}/api/screenshots/today?tz=${tz}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Не удалось получить список скриншотов");
  return (await res.json()) as TodayResponse;
}

export async function uploadScreenshot(
  token: string,
  blob: Blob,
  sourceUrl: string,
  pageTitle: string,
  capturedAt: string,
): Promise<void> {
  const form = new FormData();
  form.append("file", blob, "screenshot.jpg");
  form.append("sourceUrl", sourceUrl);
  form.append("pageTitle", pageTitle);
  form.append("capturedAt", capturedAt);

  const res = await authFetch(`${API_BASE_URL}/api/screenshots`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) throw new Error("Не удалось сохранить скриншот");
}

export async function fetchAuthorizedImageUrl(token: string, relativePath: string): Promise<string> {
  const res = await authFetch(`${API_BASE_URL}${relativePath}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Не удалось загрузить превью");
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
