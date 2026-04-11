import { useState, useCallback, useEffect } from "react";
import type { TourDetail, POI, LangCode } from "../types/api.types";
import {
  saveTour,
  savePoi,
  saveMeta,
  getMeta,
  getAllMeta,
  deleteTour,
  deletePoi,
  deleteMeta,
  type DownloadMeta,
} from "../lib/db";
import { poiPublicService, tourPublicService } from "../services";
// import { getMapTileUrls } from "../lib/mapUtils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DownloadStatus = "idle" | "downloading" | "done" | "error";

export interface DownloadState {
  status: DownloadStatus;
  progress: number; // 0 – 100
  error?: string;
}

// Map: key = "tour-{id}" | "poi-{id}"
type DownloadMap = Record<string, DownloadState>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Trích xuất tất cả URL media (image + audio) từ danh sách POI */
function extractMediaUrls(pois: POI[]): string[] {
  const urls = new Set<string>();
  pois.forEach((poi) => {
    if (poi.image) urls.add(poi.image);
    if (poi.audio) urls.add(poi.audio);
  });
  return Array.from(urls);
}

/** Gửi danh sách URL cần cache cho Service Worker */
async function sendUrlsToSW(
  type: "CACHE_URLS" | "DELETE_URLS",
  urls: string[],
): Promise<void> {
  if (!navigator.serviceWorker.controller) {
    console.warn("[DM] Service Worker chưa active, bỏ qua cache media.");
    return;
  }
  navigator.serviceWorker.controller.postMessage({ type, urls });
}

/**
 * Tải và cache từng URL, gọi onProgress sau mỗi URL hoàn thành.
 * Hàm này chạy tuần tự để progress bar mượt mà hơn.
 */
async function fetchAndCacheUrls(
  urls: string[],
  onProgress: (done: number, total: number) => void,
): Promise<void> {
  let done = 0;

  for (const url of urls) {
    try {
      // Thử cache trực tiếp từ luồng chính (fallback nếu SW chưa sẵn sàng)
      const cache = await caches.open("gps-tour-media-v1");
      const existing = await cache.match(url);

      if (!existing) {
        const response = await fetch(url, {
          mode: "cors",
          credentials: "omit",
        });
        if (response.ok) {
          await cache.put(url, response);
        }
      }
    } catch (err) {
      console.warn(`[DM] Không cache được: ${url}`, err);
    } finally {
      done++;
      onProgress(done, urls.length);
    }
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDownloadManager() {
  // Trạng thái tải xuống theo từng item (tour hoặc poi)
  const [downloads, setDownloads] = useState<DownloadMap>({});
  // Danh sách metadata của các tour/poi đã tải xong
  const [downloadedMeta, setDownloadedMeta] = useState<DownloadMeta[]>([]);

  // ── Load danh sách đã tải khi mount ──────────────────────────────────────
  useEffect(() => {
    getAllMeta().then(setDownloadedMeta).catch(console.error);
  }, []);

  // ── Helper: cập nhật state của một item ──────────────────────────────────
  const setItemState = useCallback(
    (key: string, patch: Partial<DownloadState>) => {
      setDownloads((prev) => ({
        ...prev,
        [key]: { ...(prev[key] ?? { status: "idle", progress: 0 }), ...patch },
      }));
    },
    [],
  );

  // ── Tải Tour ─────────────────────────────────────────────────────────────
  const downloadTour = useCallback(
    async (tourId: string, lang: LangCode = "vi") => {
      const key = `tour-${tourId}`;

      setItemState(key, {
        status: "downloading",
        progress: 0,
        error: undefined,
      });

      try {
        // BƯỚC 1: Fetch chi tiết Tour từ API
        const res = await tourPublicService.getById(tourId, lang);
        const tour = res.data;

        // BƯỚC 2: Lưu JSON vào IndexedDB
        await saveTour(tour);

        // Đồng thời lưu từng POI riêng lẻ để tra cứu nhanh
        await Promise.all(tour.pois.map(({ poi }) => savePoi(poi)));

        setItemState(key, { progress: 10 });

        // BƯỚC 3: Trích xuất toàn bộ URL media (ảnh + audio)
        const poiList = tour.pois.map(({ poi }) => poi);
        const mediaUrls = extractMediaUrls(poiList);

        // Thêm ảnh bìa của tour
        if (tour.image) mediaUrls.push(tour.image);

        // BƯỚC 4: Tải và cache media, cập nhật progress từ 10% → 100%
        await fetchAndCacheUrls(mediaUrls, (done, total) => {
          // Progress: 10% dành cho JSON, 90% còn lại cho media
          const mediaProgress = total > 0 ? (done / total) * 90 : 90;
          setItemState(key, { progress: Math.round(10 + mediaProgress) });
        });

        // BƯỚC 5: Lưu metadata
        const meta: DownloadMeta = {
          id: key,
          type: "tour",
          downloadedAt: Date.now(),
          lang,
          assetCount: mediaUrls.length,
        };
        await saveMeta(meta);

        // BƯỚC 6: Cập nhật state hoàn thành
        setItemState(key, { status: "done", progress: 100 });
        setDownloadedMeta((prev) => [
          ...prev.filter((m) => m.id !== key),
          meta,
        ]);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Tải xuống thất bại.";
        console.error(`[DM] downloadTour error:`, err);
        setItemState(key, { status: "error", error: message });
      }
    },
    [setItemState],
  );

  // ── Tải POI đơn lẻ ───────────────────────────────────────────────────────
  const downloadPoi = useCallback(
    async (poiId: string, lang: LangCode = "vi") => {
      const key = `poi-${poiId}`;

      setItemState(key, {
        status: "downloading",
        progress: 0,
        error: undefined,
      });

      try {
        // BƯỚC 1: Fetch chi tiết POI
        const res = await poiPublicService.getById(poiId, lang);
        const poi = res.data;

        // BƯỚC 2: Lưu vào IDB
        await savePoi(poi);
        setItemState(key, { progress: 20 });

        // BƯỚC 3: Cache media
        const mediaUrls = extractMediaUrls([poi]);
        await fetchAndCacheUrls(mediaUrls, (done, total) => {
          const mediaProgress = total > 0 ? (done / total) * 80 : 80;
          setItemState(key, { progress: Math.round(20 + mediaProgress) });
        });

        // BƯỚC 4: Lưu metadata
        const meta: DownloadMeta = {
          id: key,
          type: "poi",
          downloadedAt: Date.now(),
          lang,
          assetCount: mediaUrls.length,
        };
        await saveMeta(meta);

        setItemState(key, { status: "done", progress: 100 });
        setDownloadedMeta((prev) => [
          ...prev.filter((m) => m.id !== key),
          meta,
        ]);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Tải xuống thất bại.";
        console.error(`[DM] downloadPoi error:`, err);
        setItemState(key, { status: "error", error: message });
      }
    },
    [setItemState],
  );

  // ── Xóa Tour đã tải ──────────────────────────────────────────────────────
  const removeTour = useCallback(async (tourId: string) => {
    const key = `tour-${tourId}`;
    try {
      // Lấy tour để biết danh sách media URLs cần xóa
      const db = await import("../lib/db").then((m) => m.getTour(tourId));

      if (db) {
        const mediaUrls = extractMediaUrls(db.pois.map(({ poi }) => poi));
        if (db.image) mediaUrls.push(db.image);

        // Yêu cầu SW xóa các URL media khỏi cache
        await sendUrlsToSW("DELETE_URLS", mediaUrls);
      }

      await deleteTour(tourId);
      await deleteMeta(key);

      setDownloads((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setDownloadedMeta((prev) => prev.filter((m) => m.id !== key));
    } catch (err) {
      console.error(`[DM] removeTour error:`, err);
    }
  }, []);

  // ── Xóa POI đơn lẻ ───────────────────────────────────────────────────────
  const removePoi = useCallback(async (poiId: string) => {
    const key = `poi-${poiId}`;
    try {
      const poi = await import("../lib/db").then((m) => m.getPoi(poiId));

      if (poi) {
        const mediaUrls = extractMediaUrls([poi]);
        await sendUrlsToSW("DELETE_URLS", mediaUrls);
      }

      await deletePoi(poiId);
      await deleteMeta(key);

      setDownloads((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setDownloadedMeta((prev) => prev.filter((m) => m.id !== key));
    } catch (err) {
      console.error(`[DM] removePoi error:`, err);
    }
  }, []);

  // ── Getters tiện ích ──────────────────────────────────────────────────────

  /** Kiểm tra xem tour/poi (theo key) đã được tải xuống chưa */
  const isDownloaded = useCallback(
    (key: string) => downloadedMeta.some((m) => m.id === key),
    [downloadedMeta],
  );

  /** Lấy trạng thái tải của một item */
  const getState = useCallback(
    (key: string): DownloadState =>
      downloads[key] ?? {
        status: isDownloaded(key) ? "done" : "idle",
        progress: isDownloaded(key) ? 100 : 0,
      },
    [downloads, isDownloaded],
  );

  return {
    downloadTour,
    downloadPoi,
    removeTour,
    removePoi,
    getState,
    isDownloaded,
    downloadedMeta,
  };
}
