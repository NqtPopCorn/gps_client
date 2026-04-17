/**
 * location.ts
 *
 * Tiện ích GPS một lần (getCurrentLocation) và React hook bọc nó.
 * Tọa độ real-time (watchPosition) do `gpsService` quản lý —
 * xem `src/services/gpsService.ts`.
 */

import { useState, useEffect, useCallback } from "react";

// ─── Kiểu dữ liệu ─────────────────────────────────────────────────────────────

/** Tọa độ trả về từ Geolocation API. */
export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface GetLocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

// ─── Hằng số ──────────────────────────────────────────────────────────────────

const DEFAULT_OPTIONS: Required<GetLocationOptions> = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 0,
};

// ─── Hàm lấy vị trí một lần ──────────────────────────────────────────────────

/**
 * Lấy vị trí hiện tại của người dùng một lần (Promise-based).
 *
 * @example
 * const coords = await getCurrentLocation();
 * console.log(coords.latitude, coords.longitude);
 */
export function getCurrentLocation(
  options: GetLocationOptions = {},
): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Trình duyệt không hỗ trợ Geolocation API."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error("Người dùng từ chối quyền truy cập vị trí."));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error("Không thể xác định vị trí hiện tại."));
            break;
          case error.TIMEOUT:
            reject(new Error("Quá thời gian chờ lấy vị trí."));
            break;
          default:
            reject(new Error("Lỗi không xác định khi lấy vị trí."));
        }
      },
      { ...DEFAULT_OPTIONS, ...options },
    );
  });
}

// ─── React hook ───────────────────────────────────────────────────────────────

interface UseCurrentLocationState {
  coords: Coordinates | null;
  loading: boolean;
  error: string | null;
}

/**
 * React hook bọc `getCurrentLocation` với trạng thái loading/error.
 * Chỉ lấy vị trí **một lần** khi mount (hoặc khi `refetch` được gọi).
 * Để theo dõi vị trí liên tục, dùng `gpsService.watchLocation()`.
 *
 * @example
 * const { coords, loading, error, refetch } = useCurrentLocation();
 */
export function useCurrentLocation(options: GetLocationOptions = {}) {
  const [state, setState] = useState<UseCurrentLocationState>({
    coords: null,
    loading: true,
    error: null,
  });

  const fetch = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const coords = await getCurrentLocation(options);
      setState({ coords, loading: false, error: null });
    } catch (err) {
      setState({
        coords: null,
        loading: false,
        error: err instanceof Error ? err.message : "Lỗi không xác định.",
      });
    }
    // options object reference thay đổi mỗi render nên bỏ khỏi dep list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...state, refetch: fetch };
}
