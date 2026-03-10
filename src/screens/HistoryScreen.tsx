import { Clock, PlayCircle, MapPin } from "lucide-react";
import { POI } from "../types";

interface HistoryScreenProps {
  pois: POI[];
  onSelectPOI: (poi: POI) => void;
}

export function HistoryScreen({ pois, onSelectPOI }: HistoryScreenProps) {
  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="px-6 pt-12 pb-6 bg-white shadow-sm z-10">
        <h1 className="text-2xl font-bold text-gray-900">Listening History</h1>
        <p className="text-gray-500 text-sm mt-1">Places you've explored</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {pois.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Clock size={48} className="mb-4 opacity-20" />
            <p>No history yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {pois.map((poi) => (
              <div
                key={poi.id}
                onClick={() => onSelectPOI(poi)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                <img
                  src={poi.image}
                  alt={poi.name}
                  className="w-24 h-24 rounded-xl object-cover"
                />
                <div className="flex flex-col justify-center flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {poi.name}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                    <MapPin size={12} />
                    <span>Visited 2 days ago</span>
                  </div>
                  <div className="flex items-center gap-2 text-indigo-600 font-medium text-sm">
                    <PlayCircle size={16} />
                    <span>Listen again</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
