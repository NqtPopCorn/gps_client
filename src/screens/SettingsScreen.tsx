import { ArrowLeft, Volume2, Moon, Zap, Globe } from "lucide-react";
import { useSettings } from "../contexts/SettingsContext";
import { type LangCode } from "../types";
import { LANGUAGES } from "../types/api.types";

export function SettingsScreen() {
  const { settings, updateSettings } = useSettings();

  const handleToggle = (key: keyof typeof settings) => {
    updateSettings({ [key]: !settings[key] });
  };

  const handleLanguageChange = (lang: LangCode) => {
    updateSettings({ language: lang });
  };

  const settingItems = [
    {
      icon: Volume2,
      label: "Auto Play Audio",
      description: "Automatically play audio when entering POI radius",
      key: "autoPlayAudio" as const,
      type: "toggle",
    },
    {
      icon: Zap,
      label: "High Precision GPS",
      description: "Use high accuracy GPS for better location tracking",
      key: "highAccuracyGPS" as const,
      type: "toggle",
    },
    {
      icon: Moon,
      label: "Dark Mode",
      description: "Use dark theme (coming soon)",
      key: "darkMode" as const,
      type: "toggle",
      disabled: true,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Toggles */}
        <div className="space-y-4 mb-8">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide px-2">
            Features
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {settingItems.map((item, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-4 ${
                  index !== settingItems.length - 1
                    ? "border-b border-gray-100"
                    : ""
                } ${item.disabled ? "opacity-50" : ""}`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                    <item.icon size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.description}
                    </p>
                  </div>
                </div>
                <label className="relative flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings[item.key]}
                    onChange={() => !item.disabled && handleToggle(item.key)}
                    disabled={item.disabled}
                  />
                  <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Language Selection */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide px-2">
            Language
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-3 p-4 border-b border-gray-100">
              <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                <Globe size={20} />
              </div>
              <span className="font-semibold text-gray-900 text-sm">
                Display Language
              </span>
            </div>
            {/* Language Options */}
            <div className="flex">
              {(Object.keys(LANGUAGES) as LangCode[]).map((langCode) => (
                <button
                  key={langCode}
                  onClick={() => handleLanguageChange(langCode)}
                  className={`flex-1 py-4 border-r border-gray-100 text-sm font-medium transition-all ${
                    settings.language === langCode
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  } ${langCode === "en" ? "border-r-0" : ""}`}
                >
                  {LANGUAGES[langCode]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center text-xs text-gray-500 space-y-2">
            <p>Vibe GPS Visitor v1.0.0</p>
            <p>© 2024 Vibe GPS</p>
          </div>
        </div>
      </div>
    </div>
  );
}
