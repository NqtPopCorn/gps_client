import { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import { Search, Globe, PlayCircle, MapPin } from "lucide-react";
import { POI } from "../types";
import L from "leaflet";

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface HomeScreenProps {
  pois: POI[];
  onSelectPOI: (poi: POI) => void;
  language: string;
  setLanguage: (lang: string) => void;
  autoPlay: boolean;
  setAutoPlay: (play: boolean) => void;
}

export function HomeScreen({
  pois,
  onSelectPOI,
  language,
  setLanguage,
  autoPlay,
  setAutoPlay,
}: HomeScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Bangkok center
  const center: [number, number] = [13.7563, 100.5018];

  // Create line connecting POIs for "Tour performance"
  const tourPath = pois.map((p) => [p.lat, p.lng] as [number, number]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 bg-white shadow-sm z-10 relative">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Discover</h1>
          <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5">
            <Globe size={16} className="text-gray-500" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-sm font-medium text-gray-700 outline-none"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="zh">中文</option>
            </select>
          </div>
        </div>

        <div className="relative mb-4">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search tours, places..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-100 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center justify-between bg-indigo-50 rounded-xl p-3 border border-indigo-100">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full ${autoPlay ? "bg-indigo-500 text-white" : "bg-white text-indigo-500"}`}
            >
              <PlayCircle size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Automated Play
              </p>
              <p className="text-xs text-gray-500">
                Play audio via GPS tracking
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={autoPlay}
              onChange={() => setAutoPlay(!autoPlay)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative z-0">
        <MapContainer
          center={center}
          zoom={12}
          className="h-full w-full"
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          <Polyline
            positions={tourPath}
            color="#6366f1"
            weight={3}
            dashArray="5, 10"
          />

          {pois.map((poi) => (
            <Marker key={poi.id} position={[poi.lat, poi.lng]}>
              <Popup className="rounded-xl overflow-hidden">
                <div className="p-0 m-0 w-48">
                  <img
                    src={poi.image}
                    alt={poi.name}
                    className="w-full h-24 object-cover"
                  />
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">
                      {poi.name}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                      {poi.description}
                    </p>
                    <button
                      onClick={() => onSelectPOI(poi)}
                      className="w-full bg-indigo-600 text-white text-xs py-2 rounded-lg font-medium"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Floating POI Cards (Horizontal Scroll) */}
        <div className="absolute bottom-4 left-0 right-0 px-4 overflow-x-auto flex gap-4 pb-2 snap-x z-[1000]">
          {pois.map((poi) => (
            <div
              key={poi.id}
              onClick={() => onSelectPOI(poi)}
              className="flex-shrink-0 w-64 bg-white rounded-2xl shadow-lg overflow-hidden snap-center cursor-pointer"
            >
              <div className="flex p-3 gap-3">
                <img
                  src={poi.image}
                  alt={poi.name}
                  className="w-20 h-20 rounded-xl object-cover"
                />
                <div className="flex flex-col justify-center">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {poi.name}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <MapPin size={12} />
                    <span>0.5 km away</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-indigo-600 font-medium mt-2">
                    <PlayCircle size={14} />
                    <span>{poi.duration} audio</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
