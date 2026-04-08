import { POIWithMeta, Tour } from "../types";

const DB_NAME = "gps_tour_db";
const DB_VERSION = 1;
const STORE_POIS = "pois";
const STORE_ASSETS = "assets";

// Cached memory map of created object URLs to prevent creating too many
const objectUrlCache = new Map<string, string>();

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_POIS)) {
        db.createObjectStore(STORE_POIS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_ASSETS)) {
        db.createObjectStore(STORE_ASSETS, { keyPath: "url" });
      }
    };

    request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
    request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
  });
}

export const indexedDbService = {
  /** Initialize the DB definitions */
  async initDB(): Promise<void> {
    const db = await openDB();
    db.close();
  },

  /** Save POI metadata */
  async savePOI(poi: POIWithMeta): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_POIS, "readwrite");
      const store = transaction.objectStore(STORE_POIS);
      const request = store.put(poi);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => db.close();
    });
  },

  /** Retrieve POI metadata */
  async getPOI(id: string): Promise<POIWithMeta | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_POIS, "readonly");
      const store = transaction.objectStore(STORE_POIS);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => db.close();
    });
  },

  /** Check if asset exists locally */
  async hasAsset(url: string): Promise<boolean> {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_ASSETS, "readonly");
      const store = transaction.objectStore(STORE_ASSETS);
      const request = store.count(url);
      request.onsuccess = () => resolve(request.result > 0);
      request.onerror = () => resolve(false);
      transaction.oncomplete = () => db.close();
    });
  },

  /** Save binary Blob asset keyed by its original remote URL */
  async saveAsset(url: string, blob: Blob): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_ASSETS, "readwrite");
      const store = transaction.objectStore(STORE_ASSETS);
      const request = store.put({ url, blob });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => db.close();
    });
  },

  /** Fetch a specific Asset (if cached), returning a Blob */
  async getAsset(url: string): Promise<Blob | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_ASSETS, "readonly");
      const store = transaction.objectStore(STORE_ASSETS);
      const request = store.get(url);
      request.onsuccess = () => {
        resolve(request.result ? request.result.blob : null);
      };
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => db.close();
    });
  },

  /** 
   * Convenient helper: Returns an existing local objectURL if found.
   * Otherwise returns the original URL.
   */
  async getOrFallbackURL(url: string): Promise<string> {
    if (!url) return url;
    
    // Checked if already parsed natively in memory
    if (objectUrlCache.has(url)) {
      return objectUrlCache.get(url)!;
    }

    try {
      const blob = await this.getAsset(url);
      if (blob) {
        const objectUrl = URL.createObjectURL(blob);
        objectUrlCache.set(url, objectUrl);
        return objectUrl;
      }
    } catch (e) {
      console.error("IndexedDB error retrieving asset:", e);
    }
    return url;
  },

  /**
   * Main feature entry logic: Download tour completely offline
   */
  async downloadTourOffline(
    tour: Tour,
    pois: POIWithMeta[],
    onProgress: (percent: number) => void
  ): Promise<void> {
    // Collect all URLs to fetch (assuming tour.image and poi.images and audios)
    const urlsToDownload = new Set<string>();

    if (tour.image) urlsToDownload.add(tour.image);

    pois.forEach((poi) => {
      if (poi.image) urlsToDownload.add(poi.image);

      // Collect audio from localizedData
      Object.keys(poi.localizedData).forEach((lang) => {
        const audioUrl = poi.localizedData[lang]?.description?.audio;
        if (audioUrl) {
          urlsToDownload.add(audioUrl);
        }
      });
    });

    const totalTasks = urlsToDownload.size + pois.length;
    let completedTasks = 0;

    const reportProgress = () => {
      completedTasks++;
      const percent = Math.round((completedTasks / totalTasks) * 100);
      onProgress(percent);
    };

    // 1. Save all POI metadata
    for (const poi of pois) {
      await this.savePOI(poi);
      reportProgress();
    }

    // 2. Download and save all binary assets (images, audios)
    for (const url of Array.from(urlsToDownload)) {
      try {
        const isCached = await this.hasAsset(url);
        if (!isCached) {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
          const blob = await res.blob();
          await this.saveAsset(url, blob);
        }
      } catch (err) {
        console.warn(`Failed to offline cache asset: ${url}`, err);
      } finally {
        reportProgress();
      }
    }
  },
};
