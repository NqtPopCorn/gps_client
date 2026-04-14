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
import { ProfileScreen } from "./screens/ProfileScreen";
import { BottomNav } from "./components/BottomNav";
import {
  TourPlayerProvider,
  useTourPlayer,
} from "./contexts/TourPlayerContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { I18nProvider } from "./contexts/I18nContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginScreen } from "./screens/LoginScreen";
import { RegisterScreen } from "./screens/RegisterScreen";
import { AuthProvider } from "./contexts/AuthContext";
import { OfflineScreen } from "./screens/OfflineScreen";
import { ToastContainer } from "react-toastify";

function AppContent() {
  const [isActivated, setIsActivated] = useState<boolean>(true);

  // Hooks của React Router
  const navigate = useNavigate();
  const location = useLocation();

  const handleActivate = () => {
    setIsActivated(true);
    navigate("/");
  };

  // --- LOGIC CHO BOTTOM NAV ---
  // Định nghĩa các đường dẫn không hiển thị BottomNav
  const hideBottomNavRoutes = ["/login", "register", "/audio-player", ""];
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
          <Route path="/" element={<TourListScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/register" element={<RegisterScreen />} />
          <Route path="/places" element={<PlacesScreen />} />
          <Route path="/poi/:slug" element={<POIDetailScreen />} />
          <Route path="/tour/:tourId" element={<TourDetailScreen />} />
          <Route path="/scan" element={<ScanScreen />} />
          <Route path="/history" element={<OfflineScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Các tuỳ chọn mặc định (nếu muốn)
      staleTime: 5 * 60 * 1000, // Dữ liệu được coi là "tươi" trong 5 phút
      refetchOnWindowFocus: false, // Tắt tự động fetch lại khi chuyển tab trình duyệt
    },
  },
});

// Bọc toàn bộ App trong Router
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <I18nProvider>
          <TourPlayerProvider>
            <Router>
              <AuthProvider>
                <AppContent />
                <ToastContainer
                  position="top-center"
                  autoClose={2500}
                  hideProgressBar
                  newestOnTop
                  closeOnClick
                  pauseOnFocusLoss={false}
                  pauseOnHover={false}
                  draggable
                  draggablePercent={30}
                  theme="dark"
                  toastClassName="!rounded-xl !px-4 !py-3 !text-sm top-4"
                  style={{
                    width: "100%",
                    maxWidth: "420px",
                    margin: "0 auto",
                    top: "env(safe-area-inset-top)", // 🔥 tránh notch iPhone
                  }}
                />
              </AuthProvider>
            </Router>
          </TourPlayerProvider>
        </I18nProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}
