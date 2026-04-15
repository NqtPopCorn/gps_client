import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  Star,
  Play,
  Pause,
  FastForward,
  Rewind,
  Globe,
  Loader2,
} from "lucide-react";
import { usePOIDetail } from "../hooks/usePOI"; // Điều chỉnh đường dẫn
import { useTourPlayer } from "../contexts/TourPlayerContext"; // Điều chỉnh đường dẫn
import type { LangCode } from "../types/api.types"; // Điều chỉnh đường dẫn
import { useSettings } from "../contexts/SettingsContext";
import { useI18n } from "../contexts/I18nContext";
import { useLogHistory } from "../hooks/useHistory";

export function POIDetailScreen() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { t } = useI18n();

  // Lấy dữ liệu POI từ API (giả định hook dùng slug hoặc id đều được)
  const { data: poi, isLoading, error } = usePOIDetail(slug || null);

  // Móc nối với Global Audio Player
  const {
    playStandalonePoi,
    standalonePoi,
    isPlaying: globalIsPlaying,
    progress: globalProgress,
    togglePlayPause,
    seekAudio,
  } = useTourPlayer();
  const logHistory = useLogHistory();

  const [isFavorite, setIsFavorite] = useState(false);

  // Xử lý UI Đang tải hoặc Lỗi
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <span className="sr-only">{t("poi.loading")}</span>
      </div>
    );
  }

  if (error || !poi) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 bg-gray-50 text-center">
        <p className="text-gray-600 mb-4">{t("poi.error")}</p>
        <button
          onClick={() => navigate(-1)}
          className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-medium"
        >
          {t("poi.back")}
        </button>
      </div>
    );
  }

  // Logic kiểm tra xem POI này CÓ PHẢI là bài đang được phát trong Player không
  const isThisPoiActive = standalonePoi?.audio === poi.audio;
  const displayIsPlaying = isThisPoiActive && globalIsPlaying;
  const displayProgress = isThisPoiActive ? globalProgress : 0;

  // Xử lý Play/Pause
  const handlePlayToggle = () => {
    if (isThisPoiActive) {
      togglePlayPause(); // Nếu đang là bài này rồi thì chỉ Pause/Play
    } else {
      console.log(poi);
      playStandalonePoi(poi); // Nếu chưa, thì đẩy bài này vào làm bài Lẻ (Interrupt)
    }
    // Ghi nhận lịch sử nghe nếu bắt đầu phát mới
    if (!displayIsPlaying) {
      logHistory.mutate({
        poi_id: poi.id,
        device_id: localStorage.getItem("device_id") || "",
      });
    }
  };

  // Xử lý tua âm thanh
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isThisPoiActive) {
      playStandalonePoi(poi);
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    seekAudio((x / rect.width) * 100);
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Nút điều hướng trên ảnh */}
      <div className="absolute top-safe pt-4 px-4 w-full flex justify-between items-center z-20">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/40 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <button
          onClick={() => setIsFavorite(!isFavorite)}
          className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/40 transition-colors"
        >
          <Heart
            size={20}
            fill={isFavorite ? "currentColor" : "none"}
            className={isFavorite ? "text-red-500" : "text-white"}
          />
        </button>
      </div>

      {/* Ảnh bìa (Header Image) */}
      <div className="relative h-72 w-full shrink-0 bg-gray-200">
        <img
          src={
            poi.image ||
            "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800"
          }
          alt={poi.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-white/10"></div>
      </div>

      {/* Nội dung chi tiết (Content) */}
      <div className="flex-1 px-6 pt-6 pb-28 overflow-y-auto -mt-6 bg-white rounded-t-3xl relative z-10 shadow-[0_-8px_20px_-10px_rgba(0,0,0,0.1)]">
        <div className="flex justify-between items-start mb-2 gap-4">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            {poi.name}
          </h1>
          <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1.5 rounded-lg text-sm font-medium shrink-0">
            <Star size={14} fill="currentColor" />
            4.9
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-500 mb-6">
          <div className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-md text-gray-700">
            <Globe size={14} />
            <span className="uppercase font-semibold text-xs">
              {settings.language}
            </span>
          </div>
          <span>•</span>
          <span className="uppercase text-xs font-bold tracking-wider text-indigo-600">
            {poi.type || "Địa điểm"}
          </span>
        </div>

        <p className="text-gray-600 text-[15px] leading-relaxed mb-8 whitespace-pre-line">
          {poi.description || t("poi.descriptionFallback")}
        </p>

        {/* Khung Audio Player nội bộ */}
        {poi.audio && (
          <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900">
                {t("poi.audio.title")}
              </h3>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-md ${
                  displayIsPlaying
                    ? "bg-indigo-100 text-indigo-700 animate-pulse"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {isThisPoiActive && globalIsPlaying
                  ? t("poi.audio.status.playing")
                  : t("poi.audio.status.ready")}
              </span>
            </div>

            <div
              className="w-full bg-gray-200 rounded-full h-2 mb-5 relative cursor-pointer group"
              onClick={handleSeek}
            >
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-200 ease-out"
                style={{ width: `${displayProgress}%` }}
              ></div>
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-[3px] border-indigo-600 rounded-full shadow-md transition-transform group-hover:scale-110"
                style={{ left: `calc(${displayProgress}% - 8px)` }}
              ></div>
            </div>

            <div className="flex items-center justify-center gap-8">
              <button className="text-gray-400 hover:text-indigo-600 transition-colors">
                <Rewind size={22} />
              </button>
              <button
                onClick={handlePlayToggle}
                className="w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all"
              >
                {displayIsPlaying ? (
                  <Pause size={28} />
                ) : (
                  <Play size={28} className="ml-1" />
                )}
              </button>
              <button className="text-gray-400 hover:text-indigo-600 transition-colors">
                <FastForward size={22} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Thanh Action dưới đáy (Bottom Action Bar) */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 pb-safe z-30">
        <button
          onClick={handlePlayToggle}
          disabled={!poi?.audio}
          className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
        >
          {displayIsPlaying ? (
            <>
              <Pause size={20} />
              {t("poi.buttons.primary.pause")}
            </>
          ) : (
            <>
              <Play size={20} />
              {poi?.audio
                ? t("poi.buttons.primary.play")
                : t("poi.audio.unavailable")}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
