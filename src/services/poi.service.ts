import { get, post, patch, del, toFormData } from "../lib/api";
import type {
  POI,
  POIDetail,
  NearbyPOIParams,
  LangCode,
  ApiResponse,
  PaginatedResponse,
  SearchPOIParams,
} from "../types/api.types";

// ─── Public POI endpoints ─────────────────────────────────────────────────────

export const poiPublicService = {
  // /**
  //  * Get nearby POIs sorted by distance.
  //  */
  // getNearby(params: NearbyPOIParams): Promise<POI[]> {
  //   return get<POI[]>("/api/pois/nearby/", { params });
  // },

  searchPOI(params?: SearchPOIParams): Promise<ApiResponse<POI[]>> {
    return get<ApiResponse<POI[]>>("/api/pois/search/", { params });
  },

  /**
   * Get single POI detail in the requested language.
   */
  getById(id: string, lang: LangCode): Promise<ApiResponse<POI>> {
    return get<ApiResponse<POI>>(`/api/pois/${id}`, { params: { lang } });
  },
};
