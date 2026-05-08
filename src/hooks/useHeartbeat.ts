// Cài đặt: npm install @fingerprintjs/fingerprintjs
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { useEffect, useRef } from "react";
import api from "../lib/api";
import { getCurrentLocation } from "../lib/location";
import { LangCode } from "../types";

const HEARTBEAT_INTERVAL_MS = 20_000; // 20 giây — phải nhỏ hơn TTL Redis (45s)

/**
 * Hook gửi heartbeat định kỳ lên server để theo dõi trạng thái online.
 * - Tự động lấy visitorId bằng FingerprintJS
 * - Gửi ngay khi mount, sau đó lặp lại mỗi HEARTBEAT_INTERVAL_MS
 * - Hủy interval khi component unmount
 */
const useHeartbeat = (
  isLoggedIn: boolean,
  userId?: string | null,
  lang?: LangCode,
) => {
  // Lưu visitorId vào ref để tránh gọi FingerprintJS nhiều lần
  const visitorIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const getVisitorId = async (): Promise<string> => {
      if (visitorIdRef.current) return visitorIdRef.current;
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      visitorIdRef.current = result.visitorId;
      return result.visitorId;
    };

    const sendHeartbeat = async () => {
      const visitorId = await getVisitorId();
      let lat, lng;
      try {
        const { latitude, longitude } = await getCurrentLocation();
        lat = latitude;
        lng = longitude;
      } catch (err) {
        // Heartbeat thất bại không nên làm crash app — bỏ qua lỗi
        console.warn("[Heartbeat] Khi lấy được vị trí:", err);
      }

      await api.post("/api/monitor/heartbeat", {
        visitor_id: visitorId,
        user_id: isLoggedIn && userId ? userId : null,
        lang_code: lang ? lang : "other",
        lat,
        lng,
      });
    };

    // Gửi ngay khi hook chạy
    if (isMounted) sendHeartbeat();

    const interval = setInterval(() => {
      if (isMounted) sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isLoggedIn, userId, lang]);
};

export { useHeartbeat };
