const CACHE_NAME = 'gps-tour-cache-v1';
const API_URL_PREFIX = '/api/';
const DB_NAME = "gps_tour_db";
const DB_VERSION = 1;

// --- Helper: IndexedDB for SW ---
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("pois")) {
        db.createObjectStore("pois", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("assets")) {
        db.createObjectStore("assets", { keyPath: "url" });
      }
      if (!db.objectStoreNames.contains("outbox")) {
        db.createObjectStore("outbox", { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

async function getAllFromStore(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// --- Lifecycle Events ---
self.addEventListener('install', (event) => {
  self.skipWaiting();
  console.log('[SW] Installed');
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
  console.log('[SW] Activated');
});

// --- Intercept Fetch ---
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only intercept API calls
  if (url.pathname.startsWith(API_URL_PREFIX)) {
    event.respondWith(handleApiRequest(event.request, url));
  }
});

async function handleApiRequest(request, url) {
  try {
    // 1. Try fetching from network (Simulating backend)
    // NOTE: Because we don't have a real backend, we mock the success response if it fails.
    // In a real app, we literally do:
    const networkResponse = await fetch(request.clone());
    return networkResponse;
  } catch (error) {
    // 2. NETWORK FAILED (Offline mode detected)
    console.warn(`[SW] Offline! Falling back to IndexedDB for ${url.pathname}`);
    
    // Simulate reading tours from offline DB
    if (url.pathname === '/api/tours/') {
      // In a real app, we'd query the 'tours' store.
      // But since we only stored POIs in 'pois' store from `downloadTourOffline`, 
      // let's just return a simulated JSON derived from POIs or a cached Mock response.
      // We'll return dummy data or empty if nothing found.
      const pois = await getAllFromStore('pois');
      const dummyTours = [
        {
          id: "fake-offline-tour",
           name: "Offline Cached Tours",
           description: `You are offline viewing ${pois.length} saved places.`,
           point_count: pois.length
        }
      ];
      return new Response(JSON.stringify(dummyTours), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (url.pathname === '/api/tours/visited' && request.method === 'POST') {
      // Offline mutation! Save to outbox
      const clone = await request.clone().json();
      await saveToOutbox({
        url: url.pathname,
        method: request.method,
        body: clone,
        timestamp: Date.now()
      });

      // Register background sync if supported
      if ('sync' in self.registration) {
        await self.registration.sync.register('sync-outbox');
      }

      return new Response(JSON.stringify({ 
        offline: true, 
        message: "Saved offline. Will sync when connection is restored."
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 202
      });
    }

    // Default offline fallback
    return new Response(JSON.stringify({ error: "Offline." }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
    });
  }
}

// --- Background Sync ---
async function saveToOutbox(action) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("outbox", "readwrite");
    const store = tx.objectStore("outbox");
    const request = store.add(action);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-outbox') {
    console.log('[SW] Background Sync Triggered!');
    event.waitUntil(processOutbox());
  }
});

async function processOutbox() {
  const db = await openDB();
  const tx = db.transaction("outbox", "readonly");
  const store = tx.objectStore("outbox");
  const request = store.getAll();

  request.onsuccess = async () => {
    const outboxItems = request.result;
    if (outboxItems.length === 0) return;

    console.log(`[SW] Found ${outboxItems.length} items to sync...`);

    for (const item of outboxItems) {
      try {
        console.log(`[SW] Syncing: ${item.method} ${item.url}`);
        // Simulate sending to Server:
        // await fetch(item.url, { method: item.method, body: JSON.stringify(item.body) })
        
        // Cleanup after successful send
        const delTx = db.transaction("outbox", "readwrite");
        delTx.objectStore("outbox").delete(item.id);
      } catch (e) {
        console.error(`[SW] Sync failed for item ${item.id}`, e);
        // Will be retried on next sync event natively
      }
    }
  };
}
