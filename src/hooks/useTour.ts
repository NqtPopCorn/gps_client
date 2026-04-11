import { useQuery } from "@tanstack/react-query";
import { tourPublicService } from "../services/tour.service";
import type { PaginationParams, LangCode } from "../types/api.types";
import { useSettings } from "../contexts/SettingsContext";

// ─── useTourList ──────────────────────────────────────────────────────────────

/**
 * Fetch a paginated list of tours.
 *
 * @example
 * const { data, loading, error, refetch } = useTourList({ page: 1, limit: 10 });
 * // data.results → Tour[]
 * // data.total, data.totalPage for pagination UI
 */
export function useTourList(
  params?: PaginationParams & { name?: string; lang?: LangCode },
) {
  const { settings } = useSettings();
  const query = useQuery({
    queryKey: ["tour", "list", params?.page, params?.limit, settings.language],
    queryFn: async () => {
      const res = await tourPublicService.list(params);
      return res.data;
    },
    retry: false,
  });

  return {
    data: query.data ?? null,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
}

// ─── useTourDetail ────────────────────────────────────────────────────────────

/**
 * Fetch a single tour with its ordered POI list, localized to the given language.
 *
 * @example
 * const { data, loading, error } = useTourDetail("tour-id", "vi");
 * // data.pois → TourPointDetailInline[]  (ordered by position)
 */
export function useTourDetail(id: string | null | undefined, lang: LangCode) {
  const query = useQuery({
    queryKey: ["tour", "detail", id, lang],
    queryFn: async () => {
      const res = await tourPublicService.getById(id!, lang);
      return res.data;
    },
    enabled: !!id,
    retry: false,
  });

  return {
    data: query.data ?? null,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
}
