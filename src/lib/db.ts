import { openDB, type IDBPDatabase } from "idb";
import type { TourDetail, POI } from "../types/api.types";

// ─── Constants ────────────────────────────────────────────────────────────────

const DB_NAME = "gps-tour-offline";
const DB_VERSION = 1;

// Tên các Object Store
export const STORE = {
  TOURS: "tours", // Lưu toàn bộ TourDetail (bao gồm mảng pois)
  POIS: "pois", // Lưu các POI riêng lẻ (dành cho tải POI đơn)
  META: "download-meta", // Lưu metadata: trạng thái tải, timestamp, ngôn ngữ
} as const;

// ─── Schema ───────────────────────────────────────────────────────────────────

export interface DownloadMeta {
  id: string; // tour-{id} hoặc poi-{id}
  type: "tour" | "poi";
  downloadedAt: number; // timestamp (Date.now())
  lang: string;
  assetCount: number; // tổng số file media đã cache
}

export interface OfflineDB {
  [STORE.TOURS]: {
    key: string; // tour.id
    value: TourDetail;
  };
  [STORE.POIS]: {
    key: string; // poi.id
    value: POI;
  };
  [STORE.META]: {
    key: string; // "tour-{id}" | "poi-{id}"
    value: DownloadMeta;
  };
}

// ─── Khởi tạo DB ─────────────────────────────────────────────────────────────

let _db: IDBPDatabase<OfflineDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<OfflineDB>> {
  if (_db) return _db;

  _db = await openDB<OfflineDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Tạo các store nếu chưa tồn tại
      if (!db.objectStoreNames.contains(STORE.TOURS)) {
        db.createObjectStore(STORE.TOURS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE.POIS)) {
        db.createObjectStore(STORE.POIS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE.META)) {
        db.createObjectStore(STORE.META, { keyPath: "id" });
      }
    },
  });

  return _db;
}

// ─── Tour Helpers ─────────────────────────────────────────────────────────────

/** Lưu toàn bộ TourDetail (bao gồm pois) vào IDB */
export async function saveTour(tour: TourDetail): Promise<void> {
  const db = await getDB();
  await db.put(STORE.TOURS, tour);
}

/** Lấy TourDetail từ IDB theo id */
export async function getTour(id: string): Promise<TourDetail | undefined> {
  const db = await getDB();
  return db.get(STORE.TOURS, id);
}

/** Lấy tất cả Tour đã tải xuống */
export async function getAllTours(): Promise<TourDetail[]> {
  const db = await getDB();
  return db.getAll(STORE.TOURS);
}

/** Xóa Tour khỏi IDB */
export async function deleteTour(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE.TOURS, id);
}

// ─── POI Helpers ──────────────────────────────────────────────────────────────

/** Lưu một POI riêng lẻ vào IDB */
export async function savePoi(poi: POI): Promise<void> {
  const db = await getDB();
  await db.put(STORE.POIS, poi);
}

/** Lấy POI từ IDB theo id */
export async function getPoi(id: string): Promise<POI | undefined> {
  const db = await getDB();
  return db.get(STORE.POIS, id);
}

/** Xóa POI khỏi IDB */
export async function deletePoi(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE.POIS, id);
}

// ─── Download Meta Helpers ────────────────────────────────────────────────────

/** Lưu metadata của một lần tải xuống */
export async function saveMeta(meta: DownloadMeta): Promise<void> {
  const db = await getDB();
  await db.put(STORE.META, meta);
}

/** Lấy metadata của một tour hoặc poi theo key dạng "tour-{id}" | "poi-{id}" */
export async function getMeta(key: string): Promise<DownloadMeta | undefined> {
  const db = await getDB();
  return db.get(STORE.META, key);
}

/** Lấy tất cả metadata (để hiển thị danh sách đã tải) */
export async function getAllMeta(): Promise<DownloadMeta[]> {
  const db = await getDB();
  return db.getAll(STORE.META);
}

/** Xóa metadata */
export async function deleteMeta(key: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE.META, key);
}
