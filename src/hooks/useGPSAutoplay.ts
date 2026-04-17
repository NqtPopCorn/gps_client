/**
 * useGPSAutoPlay — GPS scheduler hook
 *
 * Trách nhiệm DUY NHẤT:
 *   - Watch GPS khi tour đang chạy
 *   - Phát hiện khi người dùng bước vào bán kính của một POI
 *   - Gọi jumpToPoi() đúng lúc (với debounce + cooldown)
 *   - Trả về watchedLocation và nearbyPoiIndex để UI render
 *
 * KHÔNG làm:
 *   - Quản lý audio, state tour, progress (đó là TourPlayerContext)
 *   - Render bất kỳ UI nào
 *
 * Cách dùng trong PlacesScreen:
 *   const { watchedLocation, nearbyPoiIndex } = useGPSAutoPlay({
 *     enabled: settings.autoPlayAudio,
 *   });
 */

import { useState, useEffect, useRef, useCallback, use } from "react";
import { gpsService } from "../services/gpsService";
import type { UserLocation } from "../services/gpsService";
import { useTourPlayer } from "../contexts/TourPlayerContext";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface GPSAutoPlayOptions {
  /**
   * Bật/tắt toàn bộ tính năng.
   * Thường lấy từ settings.autoPlayAudio.
   */
  enabled: boolean;

  /**
   * Bán kính tính bằng mét để coi là "đến nơi".
   * Default: 50m
   */
  triggerRadius?: number;

  /**
   * Thời gian cooldown (ms) sau khi đã trigger một POI.
   * Tránh phát lại ngay khi GPS drift.
   * Default: 30_000ms (30 giây)
   */
  cooldownMs?: number;

  /**
   * Nếu true, POI đã nghe xong (trong playedPoiIds) sẽ không tự phát lại.
   * Default: true
   */
  skipPlayed?: boolean;

  /**
   * Nếu true, sẽ yêu cầu GPS có độ chính xác cao hơn (nếu thiết bị hỗ trợ).
   * Có thể giúp tránh trigger nhầm nhưng sẽ tiêu tốn pin hơn.
   * Default: false
   */
  highAccuracyGPS?: boolean;
}

export interface GPSAutoPlayReturn {
  /** Vị trí GPS mới nhất. null nếu chưa có tín hiệu. */
  watchedLocation: UserLocation | null;
  /**
   * Index của POI gần nhất đang trong bán kính trigger.
   * null = không có POI nào gần.
   */
  nearbyPoiIndex: number | null;
  /** Trạng thái của hook (debug / UI badge). */
  autoPlayState: "idle" | "watching" | "triggered" | "cooldown";

  /** Trạng thái enabled từ options, để UI có thể đọc. */
  enabled: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useGPSAutoPlay({
  enabled,
  triggerRadius = 50, // bán kính trigger tối thiểu
  cooldownMs = 30_000, // cool down cho lần phát tiếp theo
  skipPlayed = true,
  highAccuracyGPS = false,
}: GPSAutoPlayOptions): GPSAutoPlayReturn {
  const {
    currentTour,
    currentPoiIndex,
    playedPoiIds,
    standalonePoi,
    jumpToPoi,
    isPlaying,
  } = useTourPlayer();

  const [watchedLocation, setWatchedLocation] = useState<UserLocation | null>(
    null,
  );
  const [nearbyPoiIndex, setNearbyPoiIndex] = useState<number | null>(null);
  const [autoPlayState, setAutoPlayState] =
    useState<GPSAutoPlayReturn["autoPlayState"]>("idle");

  /**
   * Map<poiId, timestamp> — thời điểm lần cuối trigger POI đó.
   * Dùng ref để không trigger re-render khi cooldown cập nhật.
   */
  const lastTriggeredAt = useRef<Map<string, number>>(new Map());

  /**
   * Xử lý vị trí mới — tách ra khỏi useEffect để dễ test và tránh
   * tạo closure mới mỗi lần currentTour / currentPoiIndex thay đổi.
   */
  const handleLocation = useCallback(
    (loc: UserLocation) => {
      // console.log("GPSAutoPlay handleLocation 1");
      setWatchedLocation(loc);

      if (!currentTour || !enabled) return;

      const now = Date.now();
      let foundIndex: number | null = null;
      let closestDistance = Infinity;

      currentTour.pois.forEach(({ poi }, index) => {
        const distance = gpsService.calculateDistance(
          loc.latitude,
          loc.longitude,
          poi.latitude,
          poi.longitude,
        );
        // (10.761713, 106.683191);

        if (poi.radius > 5 ? distance > poi.radius : distance > triggerRadius)
          return;

        // Ưu tiên POI gần nhất trong bán kính
        if (distance < closestDistance) {
          closestDistance = distance;
          foundIndex = index;
        }
      });

      // console.log("GPSAutoPlay handleLocation 8 - foundIndex:", foundIndex);
      setNearbyPoiIndex(foundIndex);

      if (foundIndex === null) return;
      console.log("GPSAutoPlay handleLocation 3");

      const targetPoi = currentTour.pois[foundIndex].poi;

      // Không trigger nếu đây đang là bài đang phát (tránh restart)
      if (!standalonePoi && foundIndex === currentPoiIndex && isPlaying) return;
      console.log("GPSAutoPlay handleLocation 4");

      // Không trigger nếu đang nghe standalone (không ngắt người dùng)
      if (standalonePoi && isPlaying) return;
      console.log("GPSAutoPlay handleLocation 5");

      // Không trigger nếu đã nghe rồi (tuỳ config)
      if (skipPlayed && playedPoiIds.has(targetPoi.id)) return;
      console.log("GPSAutoPlay handleLocation 6");

      // Cooldown check
      const lastTime = lastTriggeredAt.current.get(targetPoi.id) ?? 0;
      if (now - lastTime < cooldownMs) {
        setAutoPlayState("cooldown");
        return;
      }
      console.log(
        "GPSAutoPlay handleLocation 7 - triggering POI:",
        targetPoi.id,
      );

      // ✅ Trigger!
      lastTriggeredAt.current.set(targetPoi.id, now);
      setAutoPlayState("triggered");
      jumpToPoi(foundIndex);

      // Reset về watching sau 2s để UI không "kẹt" ở trạng thái triggered
      const timer = setTimeout(() => setAutoPlayState("watching"), 2_000);
      return () => clearTimeout(timer);
    },
    [
      currentTour,
      currentPoiIndex,
      standalonePoi,
      playedPoiIds,
      enabled,
      triggerRadius,
      cooldownMs,
      skipPlayed,
      jumpToPoi,
    ],
  );

  // ── GPS watch lifecycle ────────────────────────────────────────────────────
  // Bật khi có tour, tắt khi tour dừng hoặc enabled = false.
  // locationCallbackRef giữ reference ổn định để gpsService.removeListener
  // tìm đúng listener khi cleanup.
  //   const locationCallbackRef = useRef(handleLocation);
  //   useEffect(() => {
  //     locationCallbackRef.current = handleLocation;
  //   }, [handleLocation]);

  useEffect(() => {
    const stableCallback = (loc: UserLocation) => {
      console.log("Notify location to GPSAutoPlay:", loc);
      handleLocation(loc);
    };

    if (!currentTour || !enabled) {
      console.log("GPSAutoPlay disabled - no tour or setting off");
      gpsService.removeListener(stableCallback);
      setWatchedLocation(null);
      setNearbyPoiIndex(null);
      setAutoPlayState("idle");
      return;
    }

    setAutoPlayState("watching");
    gpsService.watchLocation(stableCallback, {
      enableHighAccuracy: highAccuracyGPS,
    });

    return () => {
      console.log("Cleaning up GPS listener for GPSAutoPlay");
      gpsService.removeListener(stableCallback);
    };
  }, [currentTour, enabled]);

  useEffect(() => {
    console.log("GPS tracking");
  }, []);

  return { watchedLocation, nearbyPoiIndex, autoPlayState, enabled };
}
