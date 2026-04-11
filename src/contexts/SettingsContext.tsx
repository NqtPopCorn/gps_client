import React, { createContext, useContext, useState, useEffect } from "react";
import { LangCode } from "../types";

export interface Settings {
  autoPlayAudio: boolean;
  darkMode: boolean;
  highAccuracyGPS: boolean;
  language: LangCode;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  resetSettings: () => void;
}

let DEFAULT_SETTINGS: Settings = {
  autoPlayAudio: true,
  darkMode: false,
  highAccuracyGPS: true,
  language: "vi",
};

const STORAGE_KEY = "vibe-gps-settings";

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

const savedSettings = localStorage.getItem(STORAGE_KEY);
if (savedSettings) {
  try {
    const parsed = JSON.parse(savedSettings);
    DEFAULT_SETTINGS = parsed;
  } catch (error) {
    console.error("Failed to parse settings:", error);
  }
}

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  // Load settings from localStorage on mount
  // useEffect(() => {
  //   const savedSettings = localStorage.getItem(STORAGE_KEY);
  //   if (savedSettings) {
  //     try {
  //       const parsed = JSON.parse(savedSettings);
  //       setSettings({ ...DEFAULT_SETTINGS, ...parsed });
  //     } catch (error) {
  //       console.error("Failed to parse settings:", error);
  //     }
  //   }
  // }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <SettingsContext.Provider
      value={{ settings, updateSettings, resetSettings }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
};
