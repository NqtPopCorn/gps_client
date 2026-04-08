import { useState, useEffect, useCallback } from "react";
import { poiPublicService } from "../services/poi.service";
import type {
  POI,
  NearbyPOIParams,
  LangCode,
  SearchPOIParams,
} from "../types/api.types";
import { useSettings } from "../contexts/SettingsContext";

// ─── usePOIDetail ─────────────────────────────────────────────────────────────

interface UsePOIDetailState {
  data: POI | null;
  loading: boolean;
  error: string | null;
}

export function usePOIDetail(id: string | null) {
  const [state, setState] = useState<UsePOIDetailState>({
    data: null,
    loading: false,
    error: null,
  });
  const { settings } = useSettings();

  const fetchData = useCallback(async () => {
    if (!id) return;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await poiPublicService.getById(id, settings.language);
      setState({ data: res.data, loading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }, [id, settings]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}

interface UseSearchPOIsState {
  data: POI[];
  loading: boolean;
  error: string | null;
}
export function useSearchPOI(name?: string) {
  const [state, setState] = useState<UseSearchPOIsState>({
    data: [],
    loading: false,
    error: null,
  });
  const { settings } = useSettings();

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const params: SearchPOIParams = { lang: settings.language, name };
      const res = await poiPublicService.searchPOI(params);
      setState({ data: res.data, loading: false, error: null });
    } catch (err) {
      setState({
        data: [],
        loading: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }, [name, settings]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}
