import { useState, useEffect, useRef, useCallback } from "react";
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
  Navigation,
  Play,
  Pause,
  LocateFixed, // Import thêm icon này
} from "lucide-react";
import L from "leaflet";
import { useSearchPOI } from "../hooks/usePOI";
import { LANGUAGES, type LangCode, type POI } from "../types/api.types";
import { NavLink } from "react-router-dom";
import { useTourPlayer } from "../contexts/TourPlayerContext";
import { blueIcon } from "../lib/leafletIcon";
import { useSettings } from "../contexts/SettingsContext";
// Import hook lấy vị trí người dùng từ location.ts
import { useCurrentLocation } from "../lib/location";

// Xóa cấu hình Icon default cũ
delete (L.Icon.Default.prototype as any)._getIconUrl;

// 1. Hàm tạo Icon tùy chỉnh cho POI
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

// 2. Icon cho vị trí người dùng (Blue Dot)
const userLocationIcon = L.divIcon({
  className: "custom-user-marker",
  html: `<div class="user-location-dot"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

// Component điều khiển Map
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

// Component xử lý bay về vị trí người dùng
function UserLocationController({
  userCoords,
  flyTrigger,
}: {
  userCoords: { lat: number; lng: number } | null;
  flyTrigger: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (userCoords && flyTrigger > 0) {
      map.flyTo([userCoords.lat, userCoords.lng], 16, { duration: 1 });
    }
  }, [userCoords, flyTrigger, map]);
  return null;
}

export function PlacesScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [flyToUserTrigger, setFlyToUserTrigger] = useState(0); // Trigger để gọi map.flyTo
  const { settings, updateSettings } = useSettings();

  // Lấy vị trí người dùng (polling mỗi 10s hoặc khi cần thiết tùy hook của bạn)
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

  const center: [number, number] = [10.776889, 106.695305];

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const allPoisState = useSearchPOI();
  const searchState = useSearchPOI(debouncedQuery);

  const allData: POI[] = allPoisState.data || [];

  const tourPath =
    currentTour?.pois.map(
      ({ poi: p }) => [p.latitude, p.longitude] as [number, number],
    ) || [];

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
      return "Gần bạn";
    if (distanceInMeters < 1000) return `${Math.round(distanceInMeters)} m`;
    return `${(distanceInMeters / 1000).toFixed(1)} km`;
  };

  const handleLocateMe = () => {
    setFlyToUserTrigger((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header & Search Layer */}
      <div className="px-4 py-4 bg-white relative z-50 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Bản đồ</h1>
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
            placeholder="Tìm kiếm địa điểm..."
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
      </div>

      {/* Map Content Layer */}
      <div className="flex-1 relative z-0">
        <MapContainer
          center={center}
          zoom={13}
          className="h-[calc(100vh-180px)] w-full"
          zoomControl={false}
        >
          <TileLayer
            url="https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution="&copy; OpenStreetMap"
          />

          <MapController selectedPoi={selectedPoi} />

          {/* Component điều khiển bay về vị trí người dùng */}
          <UserLocationController
            userCoords={
              userLocation
                ? { lat: userLocation.latitude, lng: userLocation.longitude }
                : null
            }
            flyTrigger={flyToUserTrigger}
          />

          {/* Vẽ Marker vị trí người dùng */}
          {userLocation && (
            <Marker
              position={[userLocation.latitude, userLocation.longitude]}
              icon={userLocationIcon}
              zIndexOffset={2000} // Cực cao để luôn nổi lên trên
            >
              <Popup>Bạn đang ở đây</Popup>
            </Marker>
          )}

          {tourPath.length > 1 && (
            <Polyline
              positions={tourPath}
              color="#4f46e5"
              weight={4}
              opacity={0.8}
            />
          )}

          {allData.map((poi) => {
            const tourIndex =
              currentTour?.pois.findIndex((tp) => tp.poi.id === poi.id) ?? -1;
            const isTourPoi = tourIndex !== -1;

            const isActivePlaying =
              (isTourPoi && !standalonePoi && currentPoiIndex === tourIndex) ||
              standalonePoi?.id === poi.id;

            return (
              <div key={`group-${poi.id}`}>
                {/* 1. Vẽ vòng tròn bán kính (Radius) mờ */}
                {currentTour?.pois.find((p) => p.poi.id === poi.id) &&
                  poi.radius &&
                  poi.radius > 0 && (
                    <Circle
                      center={[poi.latitude, poi.longitude]}
                      radius={poi.radius}
                      pathOptions={{
                        color: isActivePlaying ? "#ef4444" : "#4f46e5", // Màu viền: Đỏ nếu active, xanh nếu thường
                        fillColor: isActivePlaying ? "#ef4444" : "#4f46e5", // Màu nền
                        fillOpacity: 0.1, // Nền mờ 10%
                        weight: 1, // Độ dày viền mỏng
                        opacity: 0.3, // Độ mờ viền
                      }}
                    />
                  )}

                {/* 2. Vẽ Marker cho POI */}
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
                            Xem chi tiết
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

        {/* Nút bấm nổi "Định vị vị trí của tôi" */}
        <button
          onClick={handleLocateMe}
          className="absolute bottom-40 right-4 z-1000 bg-white p-3 rounded-full shadow-lg text-gray-700 hover:text-indigo-600 focus:outline-none transition-all active:scale-95 border border-gray-100"
          title="Đến vị trí hiện tại"
        >
          {isLocating ? (
            <Loader2 className="animate-spin text-indigo-500" size={24} />
          ) : (
            <LocateFixed size={24} />
          )}
        </button>

        {/* Floating POI Cards (Carousel) */}
        {currentTour && currentTour.pois.length > 0 && (
          <div className="absolute bottom-[20px] left-0 right-0 px-4 overflow-x-auto flex gap-4 pb-2 snap-x z-[1000] scrollbar-hide scroll-smooth">
            {/* ... Code Carousel Card giữ nguyên không đổi ... */}
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
