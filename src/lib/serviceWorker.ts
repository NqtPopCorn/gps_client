/// <reference lib="webworker" />
import { openDB } from "idb";

declare const self: ServiceWorkerGlobalScope;

// ─── Constants ────────────────────────────────────────────────────────────────

const CACHE_NAME = "gps-tour-media-v1";

// Các prefix để nhận biết loại request cần intercept
const API_BASE = "/api";
const TOUR_API_RE = /^\/api\/tours\/([^/?]+)/;
const POI_API_RE = /^\/api\/pois\/([^/?]+)/;

// IndexedDB config (phải đồng bộ với db.ts)
const DB_NAME = "gps-tour-offline";
const DB_VERSION = 1;
const STORE_TOURS = "tours";
const STORE_POIS = "pois";

// ─── Lifecycle ────────────────────────────────────────────────────────────────

self.addEventListener("install", () => {
  // Kích hoạt SW mới ngay lập tức mà không cần chờ tab cũ đóng
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Xóa cache cũ nếu CACHE_NAME thay đổi
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// ─── Fetch Intercept ──────────────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Chỉ xử lý GET request
  if (request.method !== "GET") return;

  // 1. API Request → Network-first, fallback về IDB nếu offline
  if (url.pathname.startsWith(API_BASE)) {
    event.respondWith(handleApiRequest(request, url));
    return;
  }

  // 2. Media Request (image/audio) → Cache-first, fallback về network
  // /\.(jpg|jpeg|png|webp|gif|mp3|wav|ogg|m4a)(\?.*)?$/.test(url.pathname)
  const isMedia =
    /\.(jpg|jpeg|png|webp|gif|mp3|wav|ogg|m4a)(\?.*)?$/.test(url.pathname) ||
    url.pathname.startsWith("/media/") ||
    url.pathname.startsWith("/uploads/");

  if (isMedia) {
    event.respondWith(handleMediaRequest(request));
    return;
  }
});

// ─── Handlers ─────────────────────────────────────────────────────────────────

/**
 * API Handler: Network-first → fallback IDB (offline).
 * Áp dụng cho /api/tours/{id} và /api/pois/{id}.
 */
async function handleApiRequest(request: Request, url: URL): Promise<Response> {
  try {
    // Thử gọi network trước
    const networkResponse = await fetch(request);

    // Nếu thành công, trả về luôn (không cache API JSON)
    return networkResponse;
  } catch {
    // Mất mạng → tìm trong IDB
    console.warn(`[SW] Offline, fallback IDB for: ${url.pathname}`);

    const tourMatch = url.pathname.match(TOUR_API_RE);
    const poiMatch = url.pathname.match(POI_API_RE);

    if (tourMatch) {
      const tourId = tourMatch[1];
      const data = await getFromIDB(STORE_TOURS, tourId);
      if (data) {
        return jsonResponse({ status: 200, message: "cached", data });
      }
    }

    if (poiMatch) {
      const poiId = poiMatch[1];
      const data = await getFromIDB(STORE_POIS, poiId);
      if (data) {
        return jsonResponse({ status: 200, message: "cached", data });
      }
    }

    // Không tìm thấy trong IDB
    return jsonResponse(
      { status: 503, message: "Offline và không có dữ liệu cache." },
      503,
    );
  }
}

/**
 * Media Handler: Cache-first → fallback network → lưu vào cache nếu thành công.
 * Áp dụng cho file ảnh và audio.
 */
async function handleMediaRequest(request: Request): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);

  // Tìm trong cache trước
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    // Không có cache → gọi network
    const networkResponse = await fetch(request);

    // Lưu vào cache để dùng lần sau (chỉ lưu response thành công)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch {
    // Offline và không có cache
    return new Response("Media unavailable offline.", { status: 503 });
  }
}

// ─── IDB Helper (dùng trong SW context) ──────────────────────────────────────

async function getFromIDB(storeName: string, key: string): Promise<unknown> {
  try {
    const db = await openDB(DB_NAME, DB_VERSION);
    return db.get(storeName, key);
  } catch (err) {
    console.error("[SW] IDB read error:", err);
    return undefined;
  }
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ─── Message: Cache media on-demand ──────────────────────────────────────────
// Client gửi message { type: 'CACHE_URLS', urls: string[] } để SW cache các URL media
// (được dùng bởi useDownloadManager khi tải tour offline)

self.addEventListener("message", (event) => {
  if (event.data?.type === "CACHE_URLS") {
    const urls: string[] = event.data.urls ?? [];
    event.waitUntil(cacheMediaUrls(urls));
  }

  if (event.data?.type === "DELETE_URLS") {
    const urls: string[] = event.data.urls ?? [];
    event.waitUntil(deleteMediaUrls(urls));
  }
});

async function cacheMediaUrls(urls: string[]): Promise<void> {
  const cache = await caches.open(CACHE_NAME);

  await Promise.allSettled(
    urls.map(async (url) => {
      // Bỏ qua nếu đã có trong cache
      const existing = await cache.match(url);
      if (existing) return;

      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
        }
      } catch (err) {
        console.warn(`[SW] Failed to cache: ${url}`, err);
      }
    }),
  );
}

async function deleteMediaUrls(urls: string[]): Promise<void> {
  const cache = await caches.open(CACHE_NAME);
  await Promise.allSettled(urls.map((url) => cache.delete(url)));
}
