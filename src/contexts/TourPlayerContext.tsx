/**
 * TourPlayerContext — Audio engine + tour state
 *
 * Trách nhiệm DUY NHẤT:
 *   - Quản lý HTMLAudioElement singleton
 *   - Lưu trạng thái tour (currentTour, currentPoiIndex, standalonePoi)
 *   - Cung cấp các hành động điều khiển (play, pause, jump, seek…)
 *
 * KHÔNG biết gì về:
 *   - GPS / vị trí người dùng
 *   - Logic "khi nào tự động phát" — đó là việc của useGPSAutoPlay
 *
 * Effect phân tách:
 *  [E1] Init audio + timeupdate  — chạy một lần
 *  [E2] Lắng nghe "ended"        — đăng ký lại khi activePoi thay đổi
 *  [E3] Đồng bộ src + auto-play  — chạy khi activeAudioUrl thay đổi
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import type { TourDetail, POI } from "../types/api.types";
import { useSettings } from "./SettingsContext";
import { tourPublicService } from "../services";

// ─────────────────────────────────────────────────────────────────────────────
// Contract
// ─────────────────────────────────────────────────────────────────────────────

export interface TourPlayerState {
  /** Tour đang chạy. null = chưa có tour. */
  currentTour: TourDetail | null;
  /** Index của POI đang active trong tour. */
  currentPoiIndex: number;
  /** POI đang nghe lẻ ngoài tour. null = không có. */
  standalonePoi: POI | null;
  /** POI thực sự đang được active (standalone ưu tiên hơn tour). */
  activePoi: POI | undefined;
  /** ID các POI đã nghe xong. */
  playedPoiIds: Set<string>;
  /** Audio đang phát không. */
  isPlaying: boolean;
  /** Tiến trình audio 0–100. */
  progress: number;
}

export interface TourPlayerActions {
  /** Bắt đầu hoặc khởi động lại một tour, bắt đầu từ startIndex. */
  startTour: (tour: TourDetail, startIndex?: number) => void;
  /** Dừng hoàn toàn, reset mọi state. */
  stopTour: () => void;
  /** Nhảy đến POI theo index (dùng bởi GPS auto-play hoặc carousel). */
  jumpToPoi: (index: number) => void;
  /** Next/prev trong tour. Vô hiệu khi đang nghe standalone. */
  nextPoi: () => void;
  prevPoi: () => void;
  /** Toggle play/pause. */
  togglePlayPause: () => void;
  /** Seek đến percent (0–100). */
  seekAudio: (percent: number) => void;
  /** Phát một POI lẻ (ngắt tour, ưu tiên phát ngay). */
  playStandalonePoi: (poi: POI) => void;
  /** Thoát standalone, trả về tour ở trạng thái tạm dừng. */
  resumeTour: () => void;
}

export type TourPlayerContextType = TourPlayerState & TourPlayerActions;

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const TourPlayerContext = createContext<TourPlayerContextType | undefined>(
  undefined,
);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function TourPlayerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // ── Core state ─────────────────────────────────────────────────────────────
  const [currentTour, setCurrentTour] = useState<TourDetail | null>(null);
  const [currentPoiIndex, setCurrentPoiIndex] = useState<number>(0);
  const [standalonePoi, setStandalonePoi] = useState<POI | null>(null);
  const [playedPoiIds, setPlayedPoiIds] = useState<Set<string>>(new Set());
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const { settings } = useSettings();

  // ── Audio singleton ────────────────────────────────────────────────────────
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /**
   * Ref mirrors — đọc giá trị mới nhất trong useEffect/callback
   * mà không cần khai báo chúng làm dependency (tránh stale-closure).
   */
  const isPlayingRef = useRef(false);
  const standalonePoiRef = useRef<POI | null>(null);
  const currentTourRef = useRef<TourDetail | null>(null);
  const currentPoiIndexRef = useRef(0);

  const activePoi: POI | undefined =
    standalonePoi ?? currentTour?.pois[currentPoiIndex]?.poi;
  const activeAudioUrl = activePoi?.audio ?? null;

  useEffect(() => {
    const audio = audioRef.current;
    // console.log("TourPlayer activeAudioUrl changed:", activeAudioUrl);

    // console.log({
    //   audio,
    //   src: audio?.src,
    //   activeAudioUrl,
    //   isPlaying,
    //   standalonePoi,
    // });

    if (!audio || !activeAudioUrl) {
      // console.log("TourPlayer no active audio, pausing");
      return;
    }
    if (audio.src === activeAudioUrl) {
      // console.log(
      //   "TourPlayer audio src already set, skipping",
      //   audio.src,
      //   activeAudioUrl,
      // );
      return; // URL không đổi → bỏ qua
    }
    // console.log("TourPlayer activeAudioUrl changedb 131313:", activeAudioUrl);

    if (audio.src !== "") {
      audio.src = activeAudioUrl;
      // console.error("Set audio src:", audio.src);
      setProgress(0);
    }

    if (isPlaying || standalonePoi) {
      audio.src = activeAudioUrl;
      audio.play().catch((e) => console.error("[TourPlayer] play error:", e));
      setIsPlaying(true);
    }

    // console.error("???", { isPlaying, standalonePoi });
  }, [activeAudioUrl, currentPoiIndex, standalonePoi, isPlaying]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  useEffect(() => {
    standalonePoiRef.current = standalonePoi;
  }, [standalonePoi]);
  useEffect(() => {
    currentTourRef.current = currentTour;
  }, [currentTour]);
  useEffect(() => {
    currentPoiIndexRef.current = currentPoiIndex;
  }, [currentPoiIndex]);

  // ── [E1] Init audio & timeupdate — chạy một lần ───────────────────────────
  useEffect(() => {
    audioRef.current = new Audio();
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      if (audio.duration > 0) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.pause();
    };
  }, []);

  // ── [E2] Lắng nghe "ended" ─────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activePoi) return;

    const handleEnded = () => {
      // Ghi nhận POI vừa nghe xong
      setPlayedPoiIds((prev) => {
        const next = new Set(prev);
        next.add(activePoi.id);
        return next;
      });

      if (standalonePoiRef.current) {
        // Bài lẻ kết thúc → tắt, trả về tour (tạm dừng)
        setStandalonePoi(null);
        setIsPlaying(false);
        setProgress(0);
      } else {
        setIsPlaying(false);
        setProgress(0);
      }
    };

    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [activePoi]);

  useEffect(() => {
    const fetchTourWithLanguage = async () => {
      if (!currentTour) return;
      try {
        const res = await tourPublicService.getById(
          currentTour.id,
          settings.language,
        );
        setCurrentTour(res.data);
      } catch (error) {
        console.error("Failed to fetch tour with language:", error);
      }
    };
    fetchTourWithLanguage();
  }, [settings.language]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const startTour = useCallback((tour: TourDetail, startIndex = 0) => {
    setCurrentTour(tour);
    setPlayedPoiIds(new Set());
    setStandalonePoi(null);
  }, []);

  /**
   * jumpToPoi — nhảy đến bất kỳ POI nào trong tour hiện tại.
   * Được gọi bởi: carousel click, GPS auto-play, user chọn POI trên map.
   */
  const jumpToPoi = useCallback((index: number) => {
    const tour = currentTourRef.current;
    if (!tour) return;
    if (index < 0 || index >= tour.pois.length) return;

    setStandalonePoi(null); // Thoát standalone nếu đang có
    setCurrentPoiIndex(index);
    setIsPlaying(true);
    console.log("jumpToPoi:", index, tour.pois[index].poi.name);
  }, []);

  const nextPoi = useCallback(() => {
    if (standalonePoiRef.current) return;
    const tour = currentTourRef.current;
    const idx = currentPoiIndexRef.current;
    if (tour && idx < tour.pois.length - 1) {
      setCurrentPoiIndex((prev) => prev + 1);
      setIsPlaying(true);
    }
  }, []);

  const prevPoi = useCallback(() => {
    if (standalonePoiRef.current) return;
    const idx = currentPoiIndexRef.current;
    if (currentTourRef.current && idx > 0) {
      setCurrentPoiIndex((prev) => prev - 1);
      setIsPlaying(true);
    }
  }, []);

  const stopTour = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setCurrentTour(null);
    setCurrentPoiIndex(0);
    setStandalonePoi(null);
    setIsPlaying(false);
    setProgress(0);
  }, []);

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !activePoi) return;

    if (isPlayingRef.current) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch((e) => console.error("[TourPlayer] toggle error:", e));
      setIsPlaying(true);
    }
  }, [activePoi]);

  const seekAudio = useCallback((percent: number) => {
    const audio = audioRef.current;
    if (audio && audio.duration > 0) {
      audio.currentTime = (percent / 100) * audio.duration;
      setProgress(percent);
    }
  }, []);

  /**
   * playStandalonePoi — phát một POI lẻ, ngắt tour hiện tại.
   * Nếu đúng URL đang phát thì bỏ qua (không restart).
   */
  const playStandalonePoi = useCallback((poi: POI) => {
    if (audioRef.current?.src === poi.audio) return;
    setStandalonePoi(poi);
    setIsPlaying(true); // [E3] sẽ load và play
  }, []);

  const resumeTour = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setStandalonePoi(null);
    setIsPlaying(false);
    setProgress(0);
  }, []);

  // ── Context value ──────────────────────────────────────────────────────────
  const value = useMemo<TourPlayerContextType>(
    () => ({
      currentTour,
      currentPoiIndex,
      standalonePoi,
      activePoi,
      playedPoiIds,
      isPlaying,
      progress,
      startTour,
      stopTour,
      jumpToPoi,
      nextPoi,
      prevPoi,
      togglePlayPause,
      seekAudio,
      playStandalonePoi,
      resumeTour,
    }),
    [
      currentTour,
      currentPoiIndex,
      standalonePoi,
      activePoi,
      playedPoiIds,
      isPlaying,
      progress,
      startTour,
      stopTour,
      jumpToPoi,
      nextPoi,
      prevPoi,
      togglePlayPause,
      seekAudio,
      playStandalonePoi,
      resumeTour,
    ],
  );

  return (
    <TourPlayerContext.Provider value={value}>
      {children}
    </TourPlayerContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useTourPlayer(): TourPlayerContextType {
  const context = useContext(TourPlayerContext);
  if (!context) {
    throw new Error("useTourPlayer phải được bọc trong <TourPlayerProvider>");
  }
  return context;
}
