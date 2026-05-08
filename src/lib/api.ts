import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

// ─── Constants ───────────────────────────────────────────────────────────────
export const BASE_API_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

const TOKEN_KEY = "ag_access_token";
const DEVICE_ID_KEY = "ag_device_id";

// ─── Token helpers ────────────────────────────────────────────────────────────

export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  clear: (): void => localStorage.removeItem(TOKEN_KEY),
};

export const deviceIdStorage = {
  get: (): string | null => localStorage.getItem(DEVICE_ID_KEY),
  set: (fingerprint: string): void =>
    localStorage.setItem(DEVICE_ID_KEY, fingerprint),
  clear: (): void => localStorage.removeItem(DEVICE_ID_KEY),
};

export async function initDeviceId() {
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  const visitorId = result.visitorId;
  deviceIdStorage.set(visitorId);
  return visitorId;
}

// ─── Axios instance ───────────────────────────────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL: BASE_API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

// ─── Request interceptor – attach JWT ────────────────────────────────────────

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers["X-Device-Id"] = deviceIdStorage.get();
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response interceptor – normalize errors ─────────────────────────────────

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      tokenStorage.clear();
      // Redirect to login without hard reload
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
    console.error(error);
    return Promise.reject(buildApiError(error));
  },
);

// ─── Error shape ─────────────────────────────────────────────────────────────

export interface ApiError {
  status: number;
  message: string;
  raw?: unknown;
}

function buildApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const data = error.response?.data as Record<string, unknown> | undefined;
    const message =
      (data?.detail as string) ??
      (data?.message as string) ??
      error.message ??
      "Unknown error";
    return { status, message, raw: data };
  }
  return { status: 0, message: String(error), raw: error };
}

// ─── Generic request helpers ─────────────────────────────────────────────────

export async function get<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await api.get<T>(url, config);
  return res.data;
}

export async function post<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await api.post<T>(url, data, config);
  return res.data;
}

export async function put<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await api.put<T>(url, data, config);
  return res.data;
}

export async function patch<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await api.patch<T>(url, data, config);
  return res.data;
}

export async function del<T = void>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await api.delete<T>(url, config);
  return res.data;
}

// ─── Utility: Convert object to FormData for file uploads ────────────────────

export function toFormData(obj: Record<string, unknown>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;
    if (value instanceof File) {
      fd.append(key, value);
    } else {
      fd.append(key, String(value));
    }
  }
  return fd;
}

export default api;
