import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  Circle,
} from "react-leaflet";
import {
  Search,
  Globe,
  MapPin,
  Loader2,
  Play,
  Pause,
  LocateFixed,
} from "lucide-react";
import L from "leaflet";
import { useSearchPOI } from "../hooks/usePOI";
import { LANGUAGES, type LangCode, type POI } from "../types/api.types";
import { NavLink } from "react-router-dom";
import { useTourPlayer } from "../contexts/TourPlayerContext";
import { blueIcon } from "../lib/leafletIcon";
import { useSettings } from "../contexts/SettingsContext";
import { useI18n } from "../contexts/I18nContext";
import { useCurrentLocation } from "../lib/location";

// ─── POI Type Filter Config ────────────────────────────────────────────────

export type POIType =
  | "food"
  | "drink"
  | "museum"
  | "park"
  | "historical"
  | "shopping"
  | "other";

type TypeConfig = { label: string; emoji: string; activeColor: string };

const POI_TYPE_CONFIG: Record<POIType, TypeConfig> = {
  food: {
    label: "Ẩm thực",
    emoji: "🍜",
    activeColor: "bg-orange-500 border-orange-500",
  },
  drink: {
    label: "Đồ uống",
    emoji: "☕",
    activeColor: "bg-amber-500 border-amber-500",
  },
  museum: {
    label: "Bảo tàng",
    emoji: "🏛️",
    activeColor: "bg-purple-500 border-purple-500",
  },
  park: {
    label: "Công viên",
    emoji: "🌿",
    activeColor: "bg-green-500 border-green-500",
  },
  historical: {
    label: "Lịch sử",
    emoji: "🏯",
    activeColor: "bg-red-500 border-red-500",
  },
  shopping: {
    label: "Mua sắm",
    emoji: "🛍️",
    activeColor: "bg-pink-500 border-pink-500",
  },
  other: {
    label: "Khác",
    emoji: "📍",
    activeColor: "bg-gray-600 border-gray-600",
  },
};

const ALL_POI_TYPES = Object.keys(POI_TYPE_CONFIG) as POIType[];

// ─────────────────────────────────────────────────────────────────────────────

delete (L.Icon.Default.prototype as any)._getIconUrl;

const createCustomIcon = (
  tourIndex: number | null,
  isActive: boolean = false,
) => {
  if (tourIndex !== null) {
    const bgColor = isActive ? "#ef4444" : "#4f46e5";
    const size = isActive ? 34 : 28;
    return L.divIcon({
      className: "custom-tour-marker",
      html: `<div style="background-color: ${bgColor}; color: white; width: ${size}px; height: ${size}px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); transition: all 0.3s ease;">${
        tourIndex + 1
      }</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  } else {
    return blueIcon;
  }
};

const userLocationIcon = L.divIcon({
  className: "custom-user-marker",
  html: `<div class="user-location-dot"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function MapController({ selectedPoi }: { selectedPoi: POI | null }) {
  const map = useMap();
  useEffect(() => {
    if (selectedPoi) {
      map.flyTo([selectedPoi.latitude, selectedPoi.longitude], 16, {
        duration: 0.8,
      });
    }
  }, [selectedPoi, map]);
  return null;
}

function LocationController({
  userCoords,
  poiCoords,
  flyTrigger,
}: {
  userCoords: { lat: number; lng: number } | null;
  poiCoords: { lat: number; lng: number } | null;
  flyTrigger: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (poiCoords && flyTrigger == 1) {
      map.flyTo([poiCoords.lat, poiCoords.lng], 16, {
        duration: 0.8,
      });
    } else if (userCoords && flyTrigger > 1) {
      map.flyTo([userCoords.lat, userCoords.lng], 16, { duration: 1 });
    }
  }, [flyTrigger]);

  return null;
}

export function PlacesScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);

  // 1. Chuyển sang Set<string> để hỗ trợ filter "current_tour"
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());

  const [flyToUserTrigger, setFlyToUserTrigger] = useState(0);
  const { settings, updateSettings } = useSettings();
  const { t } = useI18n();

  const { coords: userLocation, loading: isLocating } = useCurrentLocation({
    enableHighAccuracy: true,
    maximumAge: 10000,
  });

  const {
    currentTour,
    currentPoiIndex,
    isPlaying,
    standalonePoi,
    togglePlayPause,
    startTour,
  } = useTourPlayer();
  const currentTourPoi = currentTour?.pois[currentPoiIndex]?.poi || null;

  const center: [number, number] = [10.776889, 106.695305];

  useEffect(() => {
    if (userLocation) {
      setFlyToUserTrigger((prev) => prev + 1);
    }
  }, [userLocation]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const allPoisState = useSearchPOI();
  const searchState = useSearchPOI(debouncedQuery);

  const allData: POI[] = allPoisState.data || [];

  // Hàm toggle filter chung
  const toggleType = (type: string) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  // 2. Logic lọc dữ liệu mới
  const filteredData: POI[] =
    selectedTypes.size === 0
      ? allData
      : allData.filter((poi) => {
          const isTourPoi =
            currentTour?.pois.some((tp) => tp.poi.id === poi.id) ?? false;
          const hasTourFilter = selectedTypes.has("current_tour");
          const hasTypeFilter = selectedTypes.has(poi.type);

          // Lấy POI nếu nó thỏa điều kiện filter type HOẶC thỏa điều kiện filter tour hiện tại
          return hasTypeFilter || (hasTourFilter && isTourPoi);
        });

  // const tourPath =
  //   currentTour?.pois.map(
  //     ({ poi: p }) => [p.latitude, p.longitude] as [number, number],
  //   ) || [];

  useEffect(() => {
    if (currentTour && !standalonePoi) {
      const activeCard = document.getElementById(
        `tour-card-${currentPoiIndex}`,
      );
      if (activeCard) {
        activeCard.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [currentPoiIndex, currentTour, standalonePoi]);

  const formatDistance = (distanceInMeters: number | undefined) => {
    if (distanceInMeters === undefined || distanceInMeters === null)
      return t("places.distance.nearby");
    if (distanceInMeters < 1000)
      return t("places.distance.meters", {
        value: Math.round(distanceInMeters),
      });
    return t("places.distance.kilometers", {
      value: (distanceInMeters / 1000).toFixed(1),
    });
  };

  const handleLocateMe = () => {
    setFlyToUserTrigger((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header & Search Layer */}
      <div className="px-4 py-4 bg-white relative z-50 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {t("places.title")}
          </h1>
          <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5">
            <Globe size={16} className="text-gray-500" />
            <select
              value={settings.language}
              onChange={(e) =>
                updateSettings({ language: e.target.value as LangCode })
              }
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
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder={t("places.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-100 rounded-xl py-2.5 pl-10 pr-10 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          {searchState.loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="animate-spin text-indigo-500" size={18} />
            </div>
          )}
        </div>

        {/* Search Results Overlay */}
        {debouncedQuery.trim().length > 0 && (
          <div className="absolute left-4 right-4 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden max-h-80 overflow-y-auto">
            {searchState.loading ? (
              <div className="flex items-center justify-center py-8 gap-2 text-gray-500">
                <Loader2 className="animate-spin" size={18} />
                <span className="text-sm">Đang tìm kiếm...</span>
              </div>
            ) : searchState.error ? (
              <div className="py-6 text-center text-sm text-red-500 px-4">
                Lỗi tìm kiếm: {searchState.error}
              </div>
            ) : searchState.data && searchState.data.length > 0 ? (
              <ul>
                {searchState.data.map((poi, index) => (
                  <li key={poi.id}>
                    <button
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 transition-colors text-left ${
                        index !== searchState.data.length - 1
                          ? "border-b border-gray-100"
                          : ""
                      }`}
                      onClick={() => {
                        setSelectedPoi(poi);
                        setSearchQuery("");
                        setDebouncedQuery("");
                      }}
                    >
                      <img
                        src={
                          poi.image ||
                          "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=400"
                        }
                        alt={poi.name}
                        className="w-12 h-12 rounded-xl object-cover shrink-0"
                      />
                      <div className="flex-1 overflow-hidden">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {poi.name}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin
                            size={11}
                            className="text-indigo-400 shrink-0"
                          />
                          <span className="text-xs text-gray-500 truncate">
                            {formatDistance(poi.distance)}
                          </span>
                          {poi.type && (
                            <>
                              <span className="text-gray-300 text-xs">•</span>
                              <span className="text-xs text-indigo-600 font-medium uppercase tracking-wide">
                                {POI_TYPE_CONFIG[poi.type as POIType]?.label ??
                                  poi.type}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                <Search size={28} className="text-gray-300 mb-2" />
                <p className="text-sm font-medium text-gray-500">
                  Không tìm thấy địa điểm nào
                </p>
                <p className="text-xs text-gray-400 mt-1">Thử từ khóa khác</p>
              </div>
            )}
          </div>
        )}

        {/* POI Type Filter Chips */}
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-0.5">
          {/* 3. Filter Tour Hiện Tại (Chỉ hiện khi có currentTour) */}
          {currentTour && (
            <button
              onClick={() => toggleType("current_tour")}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all active:scale-95 ${
                selectedTypes.has("current_tour")
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                  : "bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100"
              }`}
            >
              <span>🗺️</span>
              <span>{t("places.filter.currentTour") || "Tour hiện tại"}</span>
              {selectedTypes.has("current_tour") && (
                <span className="ml-0.5 opacity-80 text-[10px] leading-none">
                  ✕
                </span>
              )}
            </button>
          )}

          {/* Các filter Type mặc định */}
          {ALL_POI_TYPES.map((type) => {
            const cfg = POI_TYPE_CONFIG[type];
            const isActive = selectedTypes.has(type);
            return (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all active:scale-95 ${
                  isActive
                    ? `${cfg.activeColor} text-white shadow-sm`
                    : "bg-gray-100 border-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span>{cfg.emoji}</span>
                <span>{cfg.label}</span>
                {isActive && (
                  <span className="ml-0.5 opacity-80 text-[10px] leading-none">
                    ✕
                  </span>
                )}
              </button>
            );
          })}

          {selectedTypes.size > 0 && (
            <button
              onClick={() => setSelectedTypes(new Set())}
              className="flex-shrink-0 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 transition-all"
            >
              Xóa lọc
            </button>
          )}
        </div>
      </div>

      {/* Map Content Layer */}
      <div className="flex-1 relative z-0">
        <MapContainer
          center={center}
          zoom={13}
          className="h-full w-full"
          zoomControl={false}
        >
          <TileLayer
            url="https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution="&copy; OpenStreetMap"
          />

          <MapController selectedPoi={selectedPoi} />

          <LocationController
            userCoords={
              userLocation
                ? { lat: userLocation.latitude, lng: userLocation.longitude }
                : null
            }
            poiCoords={
              currentTourPoi
                ? {
                    lat: currentTourPoi.latitude,
                    lng: currentTourPoi.longitude,
                  }
                : null
            }
            flyTrigger={flyToUserTrigger}
          />

          {userLocation && (
            <Marker
              position={[userLocation.latitude, userLocation.longitude]}
              icon={userLocationIcon}
              zIndexOffset={2000}
            >
              <Popup>{t("places.location.youAreHere")}</Popup>
            </Marker>
          )}

          {/* {tourPath.length > 1 && (
            <Polyline
              positions={tourPath}
              color="#4f46e5"
              weight={4}
              opacity={0.8}
            />
          )} */}

          {filteredData.map((poi) => {
            const tourIndex =
              currentTour?.pois.findIndex((tp) => tp.poi.id === poi.id) ?? -1;
            const isTourPoi = tourIndex !== -1;

            const isActivePlaying =
              (isTourPoi && !standalonePoi && currentPoiIndex === tourIndex) ||
              standalonePoi?.id === poi.id;

            return (
              <div key={`group-${poi.id}`}>
                {currentTour?.pois.find((p) => p.poi.id === poi.id) &&
                  poi.radius &&
                  poi.radius > 0 && (
                    <Circle
                      center={[poi.latitude, poi.longitude]}
                      radius={poi.radius}
                      pathOptions={{
                        color: isActivePlaying ? "#ef4444" : "#4f46e5",
                        fillColor: isActivePlaying ? "#ef4444" : "#4f46e5",
                        fillOpacity: 0.1,
                        weight: 1,
                        opacity: 0.3,
                      }}
                    />
                  )}

                <Marker
                  position={[poi.latitude, poi.longitude]}
                  icon={createCustomIcon(
                    isTourPoi ? tourIndex : null,
                    isActivePlaying,
                  )}
                  zIndexOffset={isActivePlaying ? 1000 : isTourPoi ? 500 : 0}
                  eventHandlers={{
                    click: () => setSelectedPoi(poi),
                  }}
                >
                  <Popup
                    className="rounded-xl overflow-hidden shadow-lg p-0"
                    closeButton={true}
                  >
                    <div className="p-0 m-0 w-56">
                      <img
                        src={
                          poi.image ||
                          "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800"
                        }
                        alt={poi.name}
                        className="w-full h-28 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 text-sm mb-1">
                          {poi.name}
                        </h3>
                        <NavLink to={"/poi/" + poi.slug}>
                          <span className="w-full block text-center bg-indigo-600 text-white text-xs py-2 mt-3 rounded-lg font-medium hover:bg-indigo-700">
                            {t("places.popup.button")}
                          </span>
                        </NavLink>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </div>
            );
          })}
        </MapContainer>

        <button
          onClick={handleLocateMe}
          className="absolute bottom-35 right-4 z-[1000] bg-white p-3 rounded-full shadow-lg text-gray-700 hover:text-indigo-600 focus:outline-none transition-all active:scale-95 border border-gray-100"
          title="Đến vị trí hiện tại"
        >
          {isLocating ? (
            <Loader2 className="animate-spin text-indigo-500" size={24} />
          ) : (
            <LocateFixed size={24} />
          )}
        </button>

        {currentTour && currentTour.pois.length > 0 && (
          <div className="absolute bottom-3 left-0 right-0 px-4 overflow-x-auto flex gap-4 pb-2 snap-x z-[1000] scrollbar-hide scroll-smooth">
            {currentTour.pois.map(({ poi }, index) => {
              const isThisCardPlaying =
                !standalonePoi && currentPoiIndex === index;
              const isCurrentlyPlaying = isThisCardPlaying && isPlaying;

              const handlePlayClick = (e: React.MouseEvent) => {
                e.stopPropagation();
                if (isThisCardPlaying) {
                  togglePlayPause();
                } else {
                  startTour(currentTour, index);
                }
              };

              return (
                <div
                  id={`tour-card-${index}`}
                  key={`card-${poi.id}`}
                  onClick={(e) => {
                    e.currentTarget.scrollIntoView();
                    setSelectedPoi(poi);
                  }}
                  className={`flex-shrink-0 w-72 bg-white rounded-2xl shadow-lg overflow-hidden snap-center cursor-pointer transition-all border-2 scroll-hide ${
                    selectedPoi?.id === poi.id
                      ? "border-indigo-500 scale-100"
                      : isThisCardPlaying
                        ? "border-red-400 scale-100"
                        : "border-transparent hover:shadow-xl scale-[0.98]"
                  }`}
                >
                  <div className="flex p-3 gap-3 relative">
                    <div className="absolute top-2 left-2 z-10 w-5 h-5 bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center text-xs font-bold border border-white/20">
                      {index + 1}
                    </div>

                    <img
                      src={
                        poi.image ||
                        "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800"
                      }
                      alt={poi.name}
                      className="w-20 h-20 rounded-xl object-cover shrink-0"
                    />

                    <div className="flex flex-col justify-center flex-1 overflow-hidden pr-8">
                      <h3
                        className={`font-semibold text-sm line-clamp-2 ${isThisCardPlaying ? "text-red-500" : "text-gray-900"}`}
                      >
                        {poi.name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1 font-medium">
                        <MapPin size={12} className="text-indigo-500" />
                        <span>{formatDistance(poi.distance)}</span>
                      </div>
                    </div>

                    <button
                      onClick={handlePlayClick}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-colors ${
                        isCurrentlyPlaying
                          ? "bg-red-50 text-red-500 hover:bg-red-100"
                          : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                      }`}
                    >
                      {isCurrentlyPlaying ? (
                        <Pause size={18} fill="currentColor" />
                      ) : (
                        <Play size={18} fill="currentColor" className="ml-1" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
