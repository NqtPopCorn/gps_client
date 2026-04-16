import { useState, useEffect } from "react";
import {
  ChevronLeft,
  Play,
  Navigation,
  Map,
  Loader2,
  Key, // Thêm icon Key
  Check, // Thêm icon Check
} from "lucide-react";
import { useTourDetail } from "../hooks/useTour";
import type { TourDetail } from "../types/api.types";
import { useSettings } from "../contexts/SettingsContext";
import { useTourPlayer } from "../contexts/TourPlayerContext";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useI18n } from "../contexts/I18nContext";
import { tourPublicService } from "../services/tour.service";
import { toast } from "react-toastify";

export function TourDetailScreen() {
  const { tourId } = useParams<{ tourId: string }>();
  const { startTour } = useTourPlayer();
  const navigate = useNavigate();

  // 1. Khởi tạo useSearchParams để lấy và cập nhật URL
  const [searchParams, setSearchParams] = useSearchParams();
  const codeFromUrl = searchParams.get("code") || "";

  const { t } = useI18n();
  const { data: tourDetail, loading, error } = useTourDetail(tourId);

  // 2. State quản lý giao diện nhập code
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [inputCode, setInputCode] = useState(codeFromUrl);

  // Đồng bộ inputCode nếu URL thay đổi (ví dụ user back/forward trình duyệt)
  useEffect(() => {
    setInputCode(codeFromUrl);
  }, [codeFromUrl]);

  // 3. Xử lý khi nhấn nút Lưu code
  const handleApplyCode = () => {
    if (inputCode.trim()) {
      setSearchParams({ code: inputCode.trim() });
      setShowCodeInput(false);
    } else {
      searchParams.delete("code");
      setSearchParams(searchParams);
      setShowCodeInput(false);
    }
  };

  const onStartTour = (tour: TourDetail) => {
    // Lấy code trực tiếp từ search params mới nhất
    const code = searchParams.get("code");
    if (!code) {
      toast.error(
        t("tourDetail.activationCodeMissing") || "Vui lòng nhập mã kích hoạt!",
      );
      return;
    }

    // Gọi API validate
    tourPublicService.activateTour(tour.id, code).then((response) => {
      const { data } = response;
      if (data) {
        startTour(tour);
        navigate("/places");
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Nút Back */}
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={() => navigate(-1)}
          className="bg-white/90 backdrop-blur text-gray-900 p-2 rounded-full shadow-sm hover:bg-white transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
      </div>

      {/* Ảnh bìa */}
      <div className="relative h-64 w-full bg-gray-200 shrink-0">
        <img
          src={
            tourDetail?.image ||
            "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
          }
          alt={tourDetail?.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-2xl font-bold text-white mb-2 shadow-sm leading-tight">
            {tourDetail?.name}
          </h1>
          <div className="flex items-center gap-1.5 text-white/90 text-sm">
            <Map size={16} />
            <span>
              {t("tourList.pointsLabel", {
                count: tourDetail?.point_count ?? 0,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Nội dung chi tiết */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Khu vực Nhập Code & Start Tour */}
        <div className="p-5 flex flex-col gap-4">
          {/* 4. Giao diện nhập Code */}
          <div>
            {!showCodeInput ? (
              <button
                onClick={() => setShowCodeInput(true)}
                className="flex items-center gap-2 text-indigo-600 font-medium text-sm bg-indigo-50 px-4 py-2 rounded-xl w-fit hover:bg-indigo-100 transition-colors"
              >
                <Key size={16} />
                {codeFromUrl
                  ? `Mã kích hoạt: ${codeFromUrl} (Đổi)`
                  : t("tourDetail.enterCode") || "Nhập mã kích hoạt"}
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
                <input
                  type="text"
                  placeholder="Nhập mã của bạn..."
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-2 outline-none"
                  autoFocus
                />
                <button
                  onClick={handleApplyCode}
                  className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Check size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Nút Start Tour */}
          <button
            onClick={() => tourDetail && onStartTour(tourDetail)}
            disabled={!tourDetail}
            className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            <Play size={20} className="fill-white" />
            {loading
              ? t("tourDetail.startButtonLoading")
              : t("tourDetail.startButton")}
          </button>
        </div>

        {/* Mô tả Tour */}
        <div className="px-5 mb-8">
          <p className="text-gray-600 text-[15px] leading-relaxed">
            {tourDetail?.description || t("tourDetail.descriptionFallback")}
          </p>
        </div>

        {/* Danh sách POI (Route) */}
        <div className="px-5">
          <h3 className="font-bold text-lg text-gray-900 mb-6 flex items-center gap-2">
            <Navigation size={18} className="text-indigo-600" />
            {t("tourDetail.routeTitle")}
          </h3>

          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin text-gray-400" size={24} />
            </div>
          ) : error ? (
            <p className="text-red-500 text-sm">{t("tourDetail.error")}</p>
          ) : tourDetail?.pois && tourDetail.pois.length > 0 ? (
            <div className="relative border-l-2 border-dashed border-gray-200 ml-3 pb-4">
              {tourDetail.pois.map((item, index) => {
                const isLast = index === tourDetail.pois.length - 1;

                return (
                  <div
                    key={item.id}
                    className={`relative pl-6 ${isLast ? "" : "mb-8"}`}
                  >
                    {/* Circle đánh số */}
                    <div className="absolute w-6 h-6 bg-white border-2 border-indigo-500 rounded-full left-[-13px] top-0 flex items-center justify-center text-[10px] font-bold text-indigo-700 shadow-sm">
                      {item.position}
                    </div>

                    {/* Thẻ thông tin POI */}
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <h4 className="font-semibold text-gray-900 leading-tight mb-1">
                        {item.poi.name}
                      </h4>
                      <span className="uppercase text-[10px] tracking-wider font-semibold text-gray-400">
                        {item.poi.type || "Địa điểm"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">
              {t("tourDetail.routeEmpty")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
