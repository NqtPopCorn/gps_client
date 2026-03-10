/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { POI, Screen } from "./types";
import { mockPOIs } from "./data";
import { HomeScreen } from "./screens/HomeScreen";
import { POIDetailScreen } from "./screens/POIDetailScreen";
import { AudioPlayerScreen } from "./screens/AudioPlayerScreen";
import { ScanScreen } from "./screens/ScanScreen";
import { HistoryScreen } from "./screens/HistoryScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { BottomNav } from "./components/BottomNav";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("home");
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [language, setLanguage] = useState<string>("en");
  const [autoPlay, setAutoPlay] = useState<boolean>(false);

  const navigate = (screen: Screen) => setCurrentScreen(screen);

  const handleSelectPOI = (poi: POI) => {
    setSelectedPOI(poi);
    navigate("poi_detail");
  };

  const handlePlayAudio = () => {
    navigate("audio_player");
  };

  return (
    <div className="flex flex-col h-screen w-full max-w-md mx-auto bg-gray-50 overflow-hidden relative shadow-2xl">
      <div className="flex-1 overflow-hidden relative">
        {currentScreen === "home" && (
          <HomeScreen
            pois={mockPOIs}
            onSelectPOI={handleSelectPOI}
            language={language}
            setLanguage={setLanguage}
            autoPlay={autoPlay}
            setAutoPlay={setAutoPlay}
          />
        )}
        {currentScreen === "poi_detail" && selectedPOI && (
          <POIDetailScreen
            poi={selectedPOI}
            onBack={() => navigate("home")}
            onPlay={handlePlayAudio}
            language={language}
          />
        )}
        {currentScreen === "audio_player" && selectedPOI && (
          <AudioPlayerScreen
            poi={selectedPOI}
            onBack={() => navigate("poi_detail")}
          />
        )}
        {currentScreen === "scan" && <ScanScreen />}
        {currentScreen === "history" && (
          <HistoryScreen
            pois={mockPOIs.filter((p) => p.visited)}
            onSelectPOI={handleSelectPOI}
          />
        )}
        {currentScreen === "profile" && <ProfileScreen />}
      </div>

      {/* Bottom Navigation - Only show on main tabs */}
      {["home", "scan", "history", "profile"].includes(currentScreen) && (
        <BottomNav currentScreen={currentScreen} onNavigate={navigate} />
      )}
    </div>
  );
}
