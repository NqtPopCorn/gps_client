/**
 * useBboxPOI
 *
 * Implements the viewport-driven H3 POI fetching algorithm:
 *
 *   1.  bbox + zoom  →  H3 cells at the right resolution
 *   2.  Filter cells not yet in the module-level cache
 *   3.  If nothing missing → return data straight from cache (no API call)
 *   4.  Otherwise → batch-fetch missing cells from the API
 *   5.  Write results into cache
 *   6.  Collect & deduplicate POIs across all viewport cells
 *
 * The module-level `h3PoiCache` is intentionally outside React:
 *   – Survives component unmount/remount
 *   – Shared across all hook consumers
 *   – Never causes re-renders by itself
 *
 * react-query is used only for the actual network requests, giving us
 * loading states, deduplication, and background refetch for free.
 */

import { useMemo, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { POI, LangCode } from "../types/api.types";
import { poiPublicService } from "../services/poi.service";
import { bboxToH3Cells, cellLangKey, type BBox } from "../lib/h3Utils";
import { useDebounce } from "./useDebouce";

// ─────────────────────────────────────────────────────────────────────────────
// Module-level H3 cache
// key   = cellLangKey(h3Index, lang)  e.g. "8928308280fffff:vi"
// value = POI[]  (empty array means "fetched, no POIs here")
// ─────────────────────────────────────────────────────────────────────────────

const h3PoiCache = new Map<string, POI[]>();

/** Expose for debugging / testing only */
export function getH3Cache() {
  return h3PoiCache;
}

export function clearH3Cache() {
  h3PoiCache.clear();
}

// ─────────────────────────────────────────────────────────────────────────────
// Collect distinct helpers
// ─────────────────────────────────────────────────────────────────────────────

function collectFromCache(cells: string[], lang: LangCode): POI[] {
  const seen = new Set<string>();
  const result: POI[] = [];

  for (const cell of cells) {
    const pois = h3PoiCache.get(cellLangKey(cell, lang)) ?? [];
    for (const poi of pois) {
      if (!seen.has(poi.id)) {
        seen.add(poi.id);
        result.push(poi);
      }
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export interface UseBboxPOIOptions {
  /** Current map bbox. null = map not ready yet. */
  bbox: BBox | null;
  /** Current Leaflet zoom level. */
  zoom: number;
  /** Content language (determines cache key + API param). */
  lang: LangCode;
  /**
   * Minimum zoom before we start fetching.
   * Prevents fetching thousands of cells when user is very zoomed-out.
   * Default: 11
   */
  minZoom?: number;
}

export interface UseBboxPOIResult {
  /** Deduplicated POIs for the current viewport (from cache + latest fetch). */
  pois: POI[];
  /** True while a network request for missing cells is in-flight. */
  isLoading: boolean;
  /** Error from the most recent failed fetch (null otherwise). */
  error: string | null;
  /** How many H3 cells cover the current viewport. */
  cellCount: number;
  /** How many of those cells were already in cache (cache hit count). */
  cacheHits: number;
}

export function useBboxPOI({
  bbox,
  zoom,
  lang,
  minZoom = 11,
}: UseBboxPOIOptions): UseBboxPOIResult {
  const queryClient = useQueryClient();

  // DEBOUNCE BBOX AND ZOOM
  const debouncedBbox = useDebounce(bbox, 300);
  const debouncedZoom = useDebounce(zoom, 300);

  // ── 1. Compute H3 cells for viewport ──────────────────────────────────────
  // Sử dụng debounced values thay vì raw values
  const h3Cells = useMemo<string[]>(() => {
    if (!debouncedBbox || debouncedZoom < minZoom) return [];
    return bboxToH3Cells(debouncedBbox, debouncedZoom);
  }, [debouncedBbox, debouncedZoom, minZoom]);

  // ── 2. Find cells missing from cache ──────────────────────────────────────
  const missingCells = useMemo(
    () => h3Cells.filter((cell) => !h3PoiCache.has(cellLangKey(cell, lang))),
    // Re-run when h3Cells, lang, or cache content changes.
    // We use a string key so useMemo re-runs when the list changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [h3Cells.join(","), lang],
  );

  const cacheHits = h3Cells.length - missingCells.length;

  // ── 3. Fetch missing cells ─────────────────────────────────────────────────
  // Query key includes the sorted missing cells + lang so:
  //   – Same request in-flight → deduplicated automatically
  //   – New viewport that uncovers new cells → new query
  const queryKey = useMemo(
    () => ["pois", "h3", [...missingCells].sort(), lang],
    [missingCells, lang],
  );

  const { isFetching, error: queryError } = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const data = await poiPublicService.getPOIByH3Cells(
        { cells: missingCells, lang },
        signal,
      );

      // ── 5 & 6. Write into module-level cache ─────────────────────────────
      for (const [cell, pois] of Object.entries(data)) {
        h3PoiCache.set(cellLangKey(cell, lang), pois as POI[]);
      }

      // Mark any cells the API didn't return as empty (fetched, no POIs)
      for (const cell of missingCells) {
        if (!h3PoiCache.has(cellLangKey(cell, lang))) {
          h3PoiCache.set(cellLangKey(cell, lang), []);
        }
      }

      return data;
    },
    enabled: missingCells.length > 0,
    // Don't re-fetch cached cells on window focus
    staleTime: 5 * 60 * 1000,
    // Keep previous data so map doesn't flash empty
    placeholderData: (prev) => prev,
  });

  // ── 4 & 7. Collect from cache (re-runs after query updates cache) ─────────
  // We trigger a local re-render by tracking a "cache version" counter
  // that we bump inside the queryFn via a ref + state pair.
  const [cacheVersion, setCacheVersion] = useState(0);
  const prevMissingRef = useRef(missingCells);

  useEffect(() => {
    if (!isFetching && prevMissingRef.current !== missingCells) {
      prevMissingRef.current = missingCells;
    }
  }, [isFetching, missingCells]);

  // Bump version when query finishes fetching (cache was written)
  useEffect(() => {
    if (!isFetching) {
      setCacheVersion((v) => v + 1);
    }
  }, [isFetching]);

  // ── Build POI list from cache ─────────────────────────────────────────────
  const pois = useMemo(
    () => collectFromCache(h3Cells, lang),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [h3Cells.join(","), lang, cacheVersion],
  );

  return {
    pois,
    isLoading: isFetching && missingCells.length > 0,
    error: queryError ? (queryError as Error).message : null,
    cellCount: h3Cells.length,
    cacheHits,
  };
}
