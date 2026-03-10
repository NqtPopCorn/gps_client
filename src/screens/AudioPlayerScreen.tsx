import { useState, useEffect } from "react";
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Settings2,
} from "lucide-react";
import { POI } from "../types";

interface AudioPlayerScreenProps {
  poi: POI;
  onBack: () => void;
}

export function AudioPlayerScreen({ poi, onBack }: AudioPlayerScreenProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(30);
  const [speed, setSpeed] = useState<1 | 1.5 | 2>(1);

  const toggleSpeed = () => {
    if (speed === 1) setSpeed(1.5);
    else if (speed === 1.5) setSpeed(2);
    else setSpeed(1);
  };

  // Mock subtitle sync
  const subtitles = [
    "Welcome to the Grand Palace.",
    "Built in 1782, this stunning complex...",
    "Served as the official residence of the Kings of Siam.",
    "Notice the intricate details on the golden stupas.",
  ];
  const [currentSub, setCurrentSub] = useState(0);

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setProgress((p) => (p >= 100 ? 0 : p + 1));
        setCurrentSub((s) => (s + 1) % subtitles.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white relative overflow-hidden">
      {/* Blurred Background */}
      <div
        className="absolute inset-0 opacity-30 blur-3xl scale-110"
        style={{
          backgroundImage: `url(${poi.image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="relative z-10 flex flex-col h-full p-6 pt-safe">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={onBack}
            className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition"
          >
            <ChevronDown size={24} />
          </button>
          <span className="text-xs font-medium tracking-widest uppercase text-gray-300">
            Now Playing
          </span>
          <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition">
            <Settings2 size={20} />
          </button>
        </div>

        {/* Artwork */}
        <div className="flex-1 flex items-center justify-center mb-8">
          <div className="w-64 h-64 md:w-80 md:h-80 rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
            <img
              src={poi.image}
              alt={poi.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">{poi.name}</h2>
          <p className="text-gray-400 text-sm">Official Audio Guide</p>
        </div>

        {/* Subtitles Area */}
        <div className="h-16 flex items-center justify-center mb-6">
          <p className="text-lg text-center font-medium text-indigo-200 transition-all duration-500">
            "{subtitles[currentSub]}"
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div
            className="w-full bg-white/20 rounded-full h-1.5 mb-2 relative cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              setProgress((x / rect.width) * 100);
            }}
          >
            <div
              className="bg-indigo-500 h-1.5 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow"
              style={{ left: `calc(${progress}% - 8px)` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-400 font-medium">
            <span>0:45</span>
            <span>{poi.duration}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={toggleSpeed}
            className="w-12 text-sm font-bold text-gray-400 hover:text-white transition"
          >
            {speed}x
          </button>

          <div className="flex items-center gap-6">
            <button className="text-white/70 hover:text-white transition">
              <SkipBack size={32} fill="currentColor" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-20 h-20 bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30 hover:scale-105 transition"
            >
              {isPlaying ? (
                <Pause size={36} fill="currentColor" />
              ) : (
                <Play size={36} fill="currentColor" className="ml-2" />
              )}
            </button>
            <button className="text-white/70 hover:text-white transition">
              <SkipForward size={32} fill="currentColor" />
            </button>
          </div>

          <button className="w-12 flex justify-end text-gray-400 hover:text-white transition">
            <Volume2 size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
