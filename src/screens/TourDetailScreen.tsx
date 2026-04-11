import { ChevronLeft, Play, Navigation, Map, Loader2 } from "lucide-react";
import { useTourDetail } from "../hooks/useTour"; // Điều chỉnh lại đường dẫn
import type { Tour, TourDetail, LangCode } from "../types/api.types"; // Điều chỉnh lại đường dẫn
import { useSettings } from "../contexts/SettingsContext";
import { useTourPlayer } from "../contexts/TourPlayerContext";
import { useNavigate, useParams } from "react-router-dom";

export function TourDetailScreen() {
  // Gọi API lấy chi tiết tour kèm danh sách POI, tự động dịch theo 'language'
  const { tourId } = useParams<{ tourId: string }>();
  const { startTour } = useTourPlayer();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const {
    data: tourDetail,
    loading,
    error,
  } = useTourDetail(tourId, settings.language);

  const onStartTour = (tour: TourDetail) => {
    startTour(tour);
    navigate("/places");
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
            <span>{tourDetail?.point_count} điểm dừng</span>
          </div>
        </div>
      </div>

      {/* Nội dung chi tiết */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Nút Start Tour */}
        <div className="p-5">
          <button
            onClick={() => tourDetail && onStartTour(tourDetail)}
            disabled={!tourDetail}
            className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            <Play size={20} className="fill-white" />
            {loading ? "Đang tải dữ liệu..." : "Bắt đầu Tour"}
          </button>
        </div>

        {/* Mô tả Tour */}
        <div className="px-5 mb-8">
          <p className="text-gray-600 text-[15px] leading-relaxed">
            {tourDetail?.description || "Chưa có mô tả cho tour này."}
          </p>
        </div>

        {/* Danh sách POI (Route) */}
        <div className="px-5">
          <h3 className="font-bold text-lg text-gray-900 mb-6 flex items-center gap-2">
            <Navigation size={18} className="text-indigo-600" />
            Lộ trình Tour
          </h3>

          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin text-gray-400" size={24} />
            </div>
          ) : error ? (
            <p className="text-red-500 text-sm">{error}</p>
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
              Tour này hiện chưa có điểm dừng nào.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
