import { useState, useEffect, useCallback } from "react";
import { tourPublicService } from "../services/tour.service";
import type {
  Tour,
  TourDetail,
  PaginationParams,
  LangCode,
  PaginatedData,
} from "../types/api.types";

// ─── useTourList ──────────────────────────────────────────────────────────────

interface UseTourListState {
  data: PaginatedData<Tour> | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetch a paginated list of tours.
 *
 * @example
 * const { data, loading, error, refetch } = useTourList({ page: 1, limit: 10 });
 * // data.results → Tour[]
 * // data.total, data.totalPage for pagination UI
 */
export function useTourList(params?: PaginationParams & { name: string }) {
  const [state, setState] = useState<UseTourListState>({
    data: null,
    loading: false,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await tourPublicService.list(params);
      setState({ data: res.data, loading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.page, params?.limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}

// ─── useTourDetail ────────────────────────────────────────────────────────────

interface UseTourDetailState {
  data: TourDetail | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetch a single tour with its ordered POI list, localized to the given language.
 *
 * @example
 * const { data, loading, error } = useTourDetail("tour-id", "vi");
 * // data.pois → TourPointDetailInline[]  (ordered by position)
 */
export function useTourDetail(id: string | null, lang: LangCode) {
  const [state, setState] = useState<UseTourDetailState>({
    data: null,
    loading: false,
    error: null,
  });

  const fetchData = useCallback(async () => {
    if (!id) return;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await tourPublicService.getById(id, lang);
      setState({ data: res.data, loading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }, [id, lang]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}
