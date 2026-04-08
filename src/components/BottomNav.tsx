import { Compass, MapPin, QrCode, Clock, User } from "lucide-react";
import { Screen } from "../types";

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export function BottomNav({ currentScreen, onNavigate }: BottomNavProps) {
  const tabs = [
    { id: "home", icon: Compass, label: "Tours" },
    { id: "places", icon: MapPin, label: "Places" },
    { id: "scan", icon: QrCode, label: "Scan" },
    { id: "history", icon: Clock, label: "History" },
    { id: "profile", icon: User, label: "Profile" },
  ] as const;

  return (
    <div className="bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center pb-safe">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentScreen === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id as Screen)}
            className={`flex flex-col items-center gap-1 ${isActive ? "text-indigo-600" : "text-gray-400 hover:text-gray-600"}`}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
