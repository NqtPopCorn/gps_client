// src/contexts/GPSAutoPlayContext.tsx
import React, { createContext, useContext } from "react";
import { useGPSAutoPlay, GPSAutoPlayReturn } from "../hooks/useGPSAutoplay";
import { useSettings } from "./SettingsContext";

const GPSAutoPlayContext = createContext<GPSAutoPlayReturn | undefined>(
  undefined,
);

export function GPSAutoPlayProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings } = useSettings();

  // Gọi hook ở cấp độ Provider toàn cục.
  // Nó sẽ luôn lắng nghe GPS miễn là App còn mở và có Tour đang chạy.
  const gpsState = useGPSAutoPlay({
    enabled: settings.autoPlayAudio,
    triggerRadius: 50, // mét
    cooldownMs: 30000, // 30 giây
    skipPlayed: true,
    highAccuracyGPS: settings.highAccuracyGPS,
  });

  return (
    <GPSAutoPlayContext.Provider value={gpsState}>
      {children}
    </GPSAutoPlayContext.Provider>
  );
}

// Hook để các Screen truy cập trạng thái GPS mà không cần khởi tạo lại tracking
export const useGPSAutoPlayContext = () => {
  const context = useContext(GPSAutoPlayContext);
  if (!context) {
    throw new Error(
      "useGPSAutoPlayContext phải được bọc trong GPSAutoPlayProvider",
    );
  }
  return context;
};
