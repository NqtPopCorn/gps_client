import { useState } from "react";
import {
  ArrowLeft,
  Heart,
  Star,
  Play,
  Pause,
  FastForward,
  Rewind,
  Globe,
} from "lucide-react";
import { POI } from "../types";

interface POIDetailScreenProps {
  poi: POI;
  onBack: () => void;
  onPlay: () => void;
  language: string;
}

export function POIDetailScreen({
  poi,
  onBack,
  onPlay,
  language,
}: POIDetailScreenProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header Image & Actions */}
      <div className="relative h-72 w-full shrink-0">
        <img
          src={poi.image}
          alt={poi.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-white"></div>

        <div className="absolute top-safe pt-4 px-4 w-full flex justify-between items-center z-10">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white"
          >
            <Heart
              size={20}
              fill={isFavorite ? "currentColor" : "none"}
              className={isFavorite ? "text-red-500" : "text-white"}
            />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pt-4 pb-24 overflow-y-auto -mt-6 bg-white rounded-t-3xl relative z-20">
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            {poi.name}
          </h1>
          <div className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg text-sm font-medium">
            <Star size={14} fill="currentColor" />
            {poi.rating}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
          <div className="flex items-center gap-1">
            <Globe size={14} />
            <span className="uppercase">{language}</span>
          </div>
          <span>•</span>
          <span>{poi.duration} audio</span>
        </div>

        <p className="text-gray-600 text-base leading-relaxed mb-8">
          {poi.description}
        </p>

        {/* Inline Audio Player */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Audio Guide Preview
            </h3>
            <span className="text-xs text-gray-500">0:00 / {poi.duration}</span>
          </div>

          <div
            className="w-full bg-gray-200 rounded-full h-1.5 mb-4 relative cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              setProgress((x / rect.width) * 100);
            }}
          >
            <div
              className="bg-indigo-600 h-1.5 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-indigo-600 rounded-full shadow"
              style={{ left: `calc(${progress}% - 6px)` }}
            ></div>
          </div>

          <div className="flex items-center justify-center gap-6">
            <button className="text-gray-400 hover:text-gray-600">
              <Rewind size={20} />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-200"
            >
              {isPlaying ? (
                <Pause size={24} />
              ) : (
                <Play size={24} className="ml-1" />
              )}
            </button>
            <button className="text-gray-400 hover:text-gray-600">
              <FastForward size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 pb-safe">
        <button
          onClick={onPlay}
          className="w-full bg-indigo-600 text-white font-semibold py-4 rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
        >
          <Play size={20} />
          Listen Full Audio Guide
        </button>
      </div>
    </div>
  );
}
