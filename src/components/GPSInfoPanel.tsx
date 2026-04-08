import { MapPin, Loader } from "lucide-react";
import { useGPSTracking } from "../hooks/useGPSTracking";
import { POI } from "../types";

interface GPSInfoPanelProps {
  pois: POI[];
}

/**
 * Demo component showing GPS tracking usage
 * Displays current location and nearby POIs
 */
export function GPSInfoPanel({ pois }: GPSInfoPanelProps) {
  const { location, error, isWatching, getNearbyPOIs, getDistance } =
    useGPSTracking({
      autoStart: true,
      enableHighAccuracy: true,
    });

  const nearbyPOIs = location ? getNearbyPOIs(pois) : [];

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700 text-sm font-medium">GPS Error</p>
        <p className="text-red-600 text-xs mt-1">{error}</p>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-2">
        <Loader size={16} className="text-blue-600 animate-spin" />
        <p className="text-blue-700 text-sm font-medium">
          Getting your location...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Location */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <MapPin size={16} className="text-green-600" />
          <p className="text-green-700 font-semibold text-sm">Your Location</p>
        </div>
        <div className="text-xs text-green-600 space-y-1">
          <p>
            Latitude:{" "}
            <span className="font-mono">{location.latitude.toFixed(4)}</span>
          </p>
          <p>
            Longitude:{" "}
            <span className="font-mono">{location.longitude.toFixed(4)}</span>
          </p>
          <p>
            Accuracy:{" "}
            <span className="font-mono">{location.accuracy.toFixed(0)}m</span>
          </p>
          <p className="text-xs">
            Status: {isWatching ? "✓ Tracking" : "○ Not tracking"}
          </p>
        </div>
      </div>

      {/* Nearby POIs */}
      {nearbyPOIs.length > 0 ? (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <p className="text-indigo-700 font-semibold text-sm mb-3">
            Nearby POIs ({nearbyPOIs.length})
          </p>
          <div className="space-y-2">
            {nearbyPOIs.slice(0, 5).map((poi) => {
              const distance = getDistance(poi);
              return (
                <div
                  key={poi.id}
                  className="bg-white rounded p-2 text-xs border border-indigo-100"
                >
                  <p className="font-medium text-gray-900">
                    {poi.localizedData.en?.name || "POI"}
                  </p>
                  <p className="text-gray-600">
                    {distance
                      ? `${(distance / 1000).toFixed(2)} km away`
                      : "Calculating..."}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-gray-600 text-sm">No POIs nearby</p>
        </div>
      )}
    </div>
  );
}
