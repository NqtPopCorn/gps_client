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

const DEFAULT_OPTIONS: GetLocationOptions = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 0,
};

/**
 * Get the user's current position once.
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

    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

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
      mergedOptions,
    );
  });
}

/**
 * Return distance in meters between two lat/lon points.
 */
export async function calcCurrentDistance(
  lat2: number,
  lon2: number,
): Promise<number> {
  // haversine
  const R = 6371000; // Earth radius in meters

  const { latitude: lat1, longitude: lon1 } = await getCurrentLocation();

  // Hàm phụ chuyển đổi từ độ sang radian
  const toRadians = (degrees: number): number => degrees * (Math.PI / 180);

  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const dphi = toRadians(lat2 - lat1);
  const dlambda = toRadians(lon2 - lon1);

  const a =
    Math.sin(dphi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlambda / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * React hook — wraps getCurrentLocation with loading/error state.
 *
 * @example
 * const { coords, loading, error, refetch } = useCurrentLocation();
 */
import { useState, useEffect, useCallback } from "react";

interface UseCurrentLocationState {
  coords: Coordinates | null;
  loading: boolean;
  error: string | null;
}

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...state, refetch: fetch };
}
