import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";

// Các import dữ liệu và màn hình của bạn
import { TourListScreen } from "./screens/TourListScreen";
import { PlacesScreen } from "./screens/PlacesScreen";
import { POIDetailScreen } from "./screens/POIDetailScreen";
import { TourDetailScreen } from "./screens/TourDetailScreen";
import { ScanScreen } from "./screens/ScanScreen";
import { HistoryScreen } from "./screens/HistoryScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { ActivationGuardScreen } from "./screens/ActivationGuardScreen";
import { BottomNav } from "./components/BottomNav";
import { LangCode } from "./types";
import { useTourPlayer } from "./contexts/TourPlayerContext";
import { useSettings } from "./contexts/SettingsContext";

function AppContent() {
  const [isActivated, setIsActivated] = useState<boolean>(true);
  const [selectedTour, setSelectedTour] = useState<any | null>(null);
  const { startTour } = useTourPlayer();

  // Hooks của React Router
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Logic khởi tạo...
  }, []);

  const handleActivate = () => {
    setIsActivated(true);
    navigate("/");
  };

  const handleSelectTour = (tour: any) => {
    setSelectedTour(tour);
    navigate("/tour-detail");
  };

  // Guard: Nếu chưa active thì chỉ hiện màn hình Activation
  if (!isActivated) {
    return (
      <div className="flex flex-col h-screen w-full max-w-md mx-auto bg-gray-50 overflow-hidden relative shadow-2xl">
        <ActivationGuardScreen onActivate={handleActivate} />
      </div>
    );
  }

  // --- LOGIC CHO BOTTOM NAV ---
  // Định nghĩa các đường dẫn không hiển thị BottomNav
  const hideBottomNavRoutes = [
    "/poi-detail",
    "/tour-detail",
    "/settings",
    "/audio-player",
  ];
  const showBottomNav = !hideBottomNavRoutes.includes(location.pathname);

  // Map giữa pathname của URL và prop "currentScreen" mà BottomNav của bạn đang cần
  const pathToScreenMap: Record<string, string> = {
    "/": "home",
    "/places": "places",
    "/scan": "scan",
    "/history": "history",
    "/profile": "profile",
  };
  const currentScreenForNav = pathToScreenMap[location.pathname] || "";

  // Map ngược lại khi BottomNav gọi hàm onNavigate(screen)
  const screenToPathMap: Record<string, string> = {
    home: "/",
    places: "/places",
    scan: "/scan",
    history: "/history",
    profile: "/profile",
  };

  return (
    <div className="flex flex-col h-screen w-full max-w-md mx-auto bg-gray-50 overflow-hidden relative shadow-2xl">
      <div className="flex-1 overflow-hidden relative">
        <Routes>
          <Route
            path="/"
            element={<TourListScreen onSelectTour={handleSelectTour} />}
          />
          <Route path="/places" element={<PlacesScreen />} />
          {/* Dùng Navigate để chuyển hướng về trang chủ nếu refresh ở trang chi tiết làm mất selectedPOI */}
          <Route path="/poi/:slug" element={<POIDetailScreen />} />
          <Route
            path="/tour-detail"
            element={
              selectedTour ? (
                <TourDetailScreen
                  initialTour={selectedTour}
                  onBack={() => navigate(-1)}
                  onStartTour={(tour) => {
                    startTour(tour);
                    navigate("/places");
                  }}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route path="/scan" element={<ScanScreen />} />
          <Route path="/history" element={<HistoryScreen />} />
          <Route
            path="/profile"
            element={
              <ProfileScreen
                onNavigateToSettings={() => navigate("/settings")}
              />
            }
          />
          <Route
            path="/settings"
            element={<SettingsScreen onBack={() => navigate(-1)} />}
          />
        </Routes>
      </div>

      {/* Render BottomNav linh hoạt dựa trên đường dẫn hiện tại */}
      {showBottomNav && (
        <BottomNav
          currentScreen={currentScreenForNav}
          onNavigate={(screen) => {
            const targetPath = screenToPathMap[screen];
            if (targetPath) navigate(targetPath);
          }}
        />
      )}
    </div>
  );
}

// Bọc toàn bộ App trong Router
export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
