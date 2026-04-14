import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
  useCallback,
} from "react";
import { useSettings } from "./SettingsContext";
import type { LangCode } from "../types";
import { getCatalog, translate, type TranslationKey } from "../i18n/messages";

export interface I18nContextValue {
  lang: LangCode;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  catalog: Record<string, string>;
  setLanguage: (lang: LangCode) => void;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const { settings, updateSettings } = useSettings();

  const setLanguage = useCallback(
    (lang: LangCode) => updateSettings({ language: lang }),
    [updateSettings],
  );

  const value = useMemo<I18nContextValue>(() => {
    const selectedLang = settings.language;
    const catalog = getCatalog(selectedLang);
    return {
      lang: selectedLang,
      catalog,
      setLanguage,
      t: (key, vars) => translate(selectedLang, key, vars),
    };
  }, [settings.language, setLanguage]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
