import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import type { TourDetail, POI } from "../types/api.types";
import { useSettings } from "./SettingsContext";

interface TourPlayerContextType {
  // Trạng thái (Getters)
  currentTour: TourDetail | null;
  currentPoiIndex: number;
  standalonePoi: POI | null; // Điểm đang nghe lẻ (ngoài Tour)
  playedPoiIds: Set<string>; // Lưu ID các POI đã nghe xong
  isPlaying: boolean;
  progress: number; // Phần trăm chạy audio (0 - 100)

  // Hành động (Setters)
  startTour: (tour: TourDetail, startIndex?: number) => void;
  togglePlayPause: () => void;
  nextPoi: () => void;
  prevPoi: () => void;
  stopTour: () => void;
  seekAudio: (percent: number) => void;

  // Hành động cho điểm lẻ
  playStandalonePoi: (poi: POI) => void;
  resumeTour: () => void; // Xóa điểm lẻ, quay lại Tour
}

const TourPlayerContext = createContext<TourPlayerContextType | undefined>(
  undefined,
);

export function TourPlayerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // State cốt lõi
  const [currentTour, setCurrentTour] = useState<TourDetail | null>(null);
  const [currentPoiIndex, setCurrentPoiIndex] = useState<number>(0);
  const [standalonePoi, setStandalonePoi] = useState<POI | null>(null);

  // State phụ trợ
  const [playedPoiIds, setPlayedPoiIds] = useState<Set<string>>(new Set());
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const { settings } = useSettings();

  // Tham chiếu Audio HTML
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 1. KHỞI TẠO AUDIO & CẬP NHẬT PROGRESS
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.pause();
    };
  }, []);

  // Xác định POI đang được Active (Ưu tiên Standalone > Tour)
  const activePoi = standalonePoi || currentTour?.pois[currentPoiIndex]?.poi;

  // 2. LẮNG NGHE SỰ KIỆN ENDED (HẾT BÀI)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activePoi) return;

    const handleEnded = () => {
      // 1. Lưu bài vừa phát vào danh sách "Đã nghe"
      setPlayedPoiIds((prev) => {
        const newSet = new Set(prev);
        newSet.add(activePoi.id);
        return newSet;
      });

      // 2. Xử lý điều hướng
      if (standalonePoi) {
        // Đang nghe bài lẻ -> Hết bài -> Tắt bài lẻ, trả về Tour nhưng ở trạng thái TẠM DỪNG
        setStandalonePoi(null);
        setIsPlaying(false);
        setProgress(0);
      } else if (currentTour && currentPoiIndex < currentTour.pois.length - 1) {
        // Đang nghe Tour -> Hết bài -> Tự động qua bài tiếp theo
        setCurrentPoiIndex((prev) => prev + 1);
      } else {
        // Hết trọn bộ Tour
        setIsPlaying(false);
        setProgress(0);
      }
    };

    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [activePoi, standalonePoi, currentTour, currentPoiIndex]);

  // 3. ĐỒNG BỘ SOURCE AUDIO & PLAY NGAY KHI CÓ THAY ĐỔI
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activePoi?.audio) return;

    // Chỉ thay source và load lại nếu URL thực sự khác biệt
    if (audio.src !== activePoi.audio) {
      audio.src = activePoi.audio;
      setProgress(0);

      // Auto-play bài mới nếu đang trong trạng thái play, HOẶC nếu user vừa chủ động chọn bài lẻ
      if (isPlaying || standalonePoi) {
        audio.play().catch((e) => console.error("Audio play error:", e));
        setIsPlaying(true);
      }
    }
  }, [activePoi, isPlaying, standalonePoi]);

  // ---- CÁC HÀM ĐIỀU KHIỂN (ACTIONS) ----

  const startTour = useCallback((tour: TourDetail, startIndex: number = 0) => {
    setCurrentTour(tour);
    setCurrentPoiIndex(startIndex);
    setStandalonePoi(null); // Reset mọi bài lẻ đang nghe
    setIsPlaying(true);

    // Ép play ngay lập tức cho bài đầu tiên
    if (audioRef.current && tour.pois[startIndex]?.poi.audio) {
      audioRef.current.src = tour.pois[startIndex].poi.audio;
      audioRef.current.play().catch(console.error);
    }
  }, []);

  const playStandalonePoi = useCallback(
    (poi: POI) => {
      // Nếu đang nghe chính bài đó rồi thì không làm gì cả
      if (audioRef.current?.src === poi.audio) {
        return;
      }
      setStandalonePoi(poi);
      setIsPlaying(true); // Cờ này sẽ kích hoạt play ở useEffect (3)
    },
    [standalonePoi, currentTour, currentPoiIndex, settings],
  );

  const resumeTour = useCallback(() => {
    setStandalonePoi(null);
    // Lưu ý: Không auto-play (setIsPlaying(false)) để tránh làm người dùng giật mình
    // Họ sẽ tự bấm nút Play trên MiniPlayer nếu muốn đi Tour tiếp
    setIsPlaying(false);
    setProgress(0); // Progress reset về 0 cho bài Tour hiện tại
  }, []);

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current || !activePoi) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  }, [isPlaying, activePoi]);

  const nextPoi = useCallback(() => {
    if (standalonePoi) return; // Đang nghe bài lẻ thì vô hiệu hoá nút Next của Tour
    if (currentTour && currentPoiIndex < currentTour.pois.length - 1) {
      setCurrentPoiIndex((prev) => prev + 1);
      setIsPlaying(true);
    }
  }, [currentTour, currentPoiIndex, standalonePoi]);

  const prevPoi = useCallback(() => {
    if (standalonePoi) return; // Đang nghe bài lẻ thì vô hiệu hoá nút Prev của Tour
    if (currentTour && currentPoiIndex > 0) {
      setCurrentPoiIndex((prev) => prev - 1);
      setIsPlaying(true);
    }
  }, [currentTour, currentPoiIndex, standalonePoi]);

  const stopTour = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setCurrentTour(null);
    setCurrentPoiIndex(0);
    setStandalonePoi(null);
    setIsPlaying(false);
    setProgress(0);
  }, []);

  const seekAudio = useCallback((percent: number) => {
    if (audioRef.current && audioRef.current.duration) {
      const timeToSeek = (percent / 100) * audioRef.current.duration;
      audioRef.current.currentTime = timeToSeek;
      setProgress(percent);
    }
  }, []);

  return (
    <TourPlayerContext.Provider
      value={{
        currentTour,
        currentPoiIndex,
        standalonePoi,
        playedPoiIds,
        isPlaying,
        progress,
        startTour,
        togglePlayPause,
        nextPoi,
        prevPoi,
        stopTour,
        seekAudio,
        playStandalonePoi,
        resumeTour,
      }}
    >
      {children}
    </TourPlayerContext.Provider>
  );
}

// Hook để sử dụng nhanh trong các component
export function useTourPlayer() {
  const context = useContext(TourPlayerContext);
  if (context === undefined) {
    throw new Error("useTourPlayer phải được bọc bên trong TourPlayerProvider");
  }
  return context;
}
