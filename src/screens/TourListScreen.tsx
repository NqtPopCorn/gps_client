import { useState, useMemo } from "react";
import { Search, MapPin, Globe, Loader2, Map } from "lucide-react";
import { useTourList } from "../hooks/useTour"; // Điều chỉnh lại đường dẫn nếu cần
import { type Tour, type LangCode, LANGUAGES } from "../types/api.types"; // Điều chỉnh lại đường dẫn
import { useSettings } from "../contexts/SettingsContext";
import { useI18n } from "../contexts/I18nContext";
import { useNavigate } from "react-router-dom";

export function TourListScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const { settings, updateSettings } = useSettings();
  const { t } = useI18n();
  const navigate = useNavigate();

  // Gọi API lấy danh sách Tour
  const { data, loading, error } = useTourList();

  // Lọc tour ở client dựa trên dữ liệu API trả về
  const filteredTours = useMemo(() => {
    if (!data?.results) return [];
    if (!searchQuery) return data.results;

    const lowerQuery = searchQuery.toLowerCase();
    return data.results.filter(
      (tour) =>
        tour.name.toLowerCase().includes(lowerQuery) ||
        (tour.description &&
          tour.description.toLowerCase().includes(lowerQuery)),
    );
  }, [data?.results, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header & Search */}
      <div className="px-4 pt-6 pb-4 bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {t("tourList.title")}
          </h2>
          <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5">
            <Globe size={16} className="text-gray-500" />
            <select
              value={settings.language}
              onChange={(e) => {
                updateSettings({ language: e.target.value as LangCode });
              }}
              className="bg-transparent text-sm font-medium text-gray-700 outline-none"
            >
              {(Object.keys(LANGUAGES) as LangCode[]).map((code) => (
                <option key={code} value={code}>
                  {LANGUAGES[code]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-100 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-colors"
            placeholder={t("tourList.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">
            <p>
              {t("tourList.error")}: {error}
            </p>
          </div>
        ) : filteredTours.length > 0 ? (
          filteredTours.map((tour) => (
            <button
              key={tour.id}
              onClick={() => navigate(`/tour/${tour.id}`)}
              className="w-full bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow text-left group border border-gray-100"
            >
              <div className="relative h-40 w-full overflow-hidden bg-gray-200">
                <img
                  src={
                    tour.image ||
                    "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  }
                  alt={tour.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 text-lg line-clamp-1 mb-1">
                  {tour.name}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                  {tour.description || t("tourList.defaultDescription")}
                </p>
                <div className="flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 w-fit px-2.5 py-1 rounded-md">
                  <Map size={14} />
                  <span>
                    {t("tourList.pointsLabel", {
                      count: tour.point_count,
                    })}
                  </span>
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="text-gray-400" size={24} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {t("tourList.emptyTitle")}
            </h3>
            <p className="text-sm text-gray-500">
              {t("tourList.emptySubtitle")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
