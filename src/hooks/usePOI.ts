import { useQuery } from "@tanstack/react-query";
import { poiPublicService } from "../services/poi.service";
import type { SearchPOIParams } from "../types/api.types";
import { useSettings } from "../contexts/SettingsContext";

// ─── usePOIDetail ─────────────────────────────────────────────────────────────

export function usePOIDetail(id: string | null) {
  const { settings } = useSettings();

  return useQuery({
    queryKey: ["poi", "detail", id, settings.language],
    queryFn: async () => {
      const res = await poiPublicService.getById(id!, settings.language);
      return res.data;
    },
    enabled: !!id,
    retry: false,
  });
}

// ─── useSearchPOI ─────────────────────────────────────────────────────────────

export function useSearchPOI(name?: string) {
  const { settings } = useSettings();

  const query = useQuery({
    queryKey: ["poi", "search", name, settings.language],
    queryFn: async () => {
      const params: SearchPOIParams = { lang: settings.language, name };
      const res = await poiPublicService.searchPOI(params);
      return res.data;
    },
    retry: false,
  });

  return {
    data: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
}

// export function useNearbyPOI(name?: string) {
//   const { settings } = useSettings();

//   const query = useQuery({
//     queryKey: ["poi", "search", name, settings.language],
//     queryFn: async () => {
//       const params: SearchPOIParams = { lang: settings.language, name };
//       const res = await poiPublicService.(params);
//       return res.data;
//     },
//     retry: false,
//   });

//   return {
//     data: query.data ?? [],
//     loading: query.isLoading,
//     error: query.error ? (query.error as Error).message : null,
//     refetch: query.refetch,
//   };
// }
