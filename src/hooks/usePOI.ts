import { useQuery } from "@tanstack/react-query";
import { poiPublicService } from "../services/poi.service";
import type { NearbyBBoxParams, SearchPOIParams } from "../types/api.types";
import { useSettings } from "../contexts/SettingsContext";
// import { useDebounce, useStableBbox } from "./useDebouce";

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

// ─── useNearbyPOI ─────────────────────────────────────────────────────────────

/**
 * Fetch POIs visible in the current map viewport.
 *
 * @param bbox  Bounding box + zoom derived from the Leaflet map.
 *              Pass `null` until the map has mounted and fired its first bounds event.
 *
 * The query key includes all bbox fields so React Query refetches automatically
 * whenever the user pans or zooms.  `staleTime` is set to 60 s to match the
 * server-side cache TTL, avoiding redundant requests for repeated small pans.
 */
// export function useNearbyPOI(rawBbox: Omit<NearbyBBoxParams, "lang"> | null) {
//   const { settings } = useSettings();

//   const bbox = useStableBbox(rawBbox, 1000);

//   const query = useQuery({
//     queryKey: [
//       "poi",
//       "nearby",
//       bbox?.min_lat,
//       bbox?.min_lng,
//       bbox?.max_lat,
//       bbox?.max_lng,
//       bbox?.zoom,
//       settings.language,
//     ],
//     queryFn: async () => {
//       const res = await poiPublicService.getNearby({
//         ...bbox!,
//         lang: settings.language,
//       });
//       return res.data;
//     },
//     enabled: !!bbox,
//     staleTime: 60 * 1000,
//     retry: false,
//   });

//   return {
//     data: query.data ?? [],
//     loading: query.isLoading || query.isFetching,
//     error: query.error ? (query.error as Error).message : null,
//     refetch: query.refetch,
//   };
// }

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
