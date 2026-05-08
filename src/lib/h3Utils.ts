/**
 * h3Utils.ts
 *
 * Helpers for H3-based viewport POI fetching:
 *   - zoomToResolution  : Leaflet zoom level → H3 resolution
 *   - bboxToH3Cells     : Leaflet bounds → array of H3 cell indexes
 *
 * Resolution guide (approximate edge length):
 *   res 5  ≈ 253 km  (very zoomed-out, overview)
 *   res 6  ≈ 96 km
 *   res 7  ≈ 36 km
 *   res 8  ≈ 14 km   (city-level)
 *   res 9  ≈ 5 km    (neighbourhood-level)
 *   res 10 ≈ 1.5 km  (street-level)
 */

import { polygonToCells } from "h3-js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

// ─── Zoom → H3 resolution ────────────────────────────────────────────────────

/**
 * Maps a Leaflet zoom level to an H3 resolution.
 * Coarser resolution at low zoom prevents fetching thousands of cells.
 */
export function zoomToResolution(zoom: number): number {
  if (zoom >= 17) return 10;
  if (zoom >= 15) return 9;
  if (zoom >= 13) return 8;
  if (zoom >= 11) return 7;
  if (zoom >= 9) return 6;
  return 5;
}

// ─── BBox → H3 cells ─────────────────────────────────────────────────────────

/**
 * Converts a Leaflet-style BBox to the list of H3 cells that cover it
 * at the resolution appropriate for the given zoom level.
 *
 * h3-js `polygonToCells` expects outer ring as [[lat, lng], ...] (non-GeoJSON mode).
 * We close the ring by repeating the first vertex.
 */
export function bboxToH3Cells(bbox: BBox, zoom: number): string[] {
  const res = zoomToResolution(zoom);

  const { north, south, east, west } = bbox;

  // Build a closed ring: NW → NE → SE → SW → NW
  const outerRing: [number, number][] = [
    [north, west],
    [north, east],
    [south, east],
    [south, west],
    [north, west], // close
  ];

  try {
    return polygonToCells(outerRing, res);
  } catch (err) {
    console.warn("[h3Utils] polygonToCells failed:", err);
    return [];
  }
}

// ─── Cache key helpers ────────────────────────────────────────────────────────

/** Stable key for a (cell, lang) pair stored in the module cache */
export function cellLangKey(cell: string, lang: string): string {
  return `${cell}:${lang}`;
}
