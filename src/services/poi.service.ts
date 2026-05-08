import { get, post } from "../lib/api";
import type {
  POI,
  NearbyPOIParams,
  LangCode,
  ApiResponse,
  SearchPOIParams,
} from "../types/api.types";

// ─────────────────────────────────────────────────────────────────────────────
// Types for H3 batch endpoint
// ─────────────────────────────────────────────────────────────────────────────

export interface H3BatchParams {
  cells: string[];
  lang: LangCode;
}

/**
 * API returns a map of { [h3Index]: POI[] }.
 * Cells with no POIs may be omitted from the response.
 */
export type H3BatchResponse = Record<string, POI[]>;

// ─────────────────────────────────────────────────────────────────────────────
// Public POI endpoints
// ─────────────────────────────────────────────────────────────────────────────

export const poiPublicService = {
  /**
   * Search POIs by name keyword.
   */
  searchPOI(params?: SearchPOIParams): Promise<ApiResponse<POI[]>> {
    return get<ApiResponse<POI[]>>("/api/pois/search/", { params });
  },

  /**
   * Get a single POI by id or slug, localised to the requested language.
   */
  getById(id: string, lang: LangCode): Promise<ApiResponse<POI>> {
    return get<ApiResponse<POI>>(`/api/pois/${id}`, { params: { lang } });
  },

  /**
   * Batch-fetch POIs for a list of H3 cell indexes.
   *
   * POST /api/pois/h3-batch/
   * Body: { cells: string[], lang: LangCode }
   *
   * Response: { "8928308280fffff": [...pois], ... }
   *
   * The server should:
   *   - Accept an array of H3 cell indexes
   *   - Return all POIs whose coordinates fall within those cells
   *   - Group the result by cell index
   *   - Cells with no POIs can be omitted OR returned as empty arrays
   */
  async getPOIByH3Cells(
    params: H3BatchParams,
    signal?: AbortSignal,
  ): Promise<H3BatchResponse> {
    const res = await post<ApiResponse<H3BatchResponse>>(
      "/api/pois/h3-batch/",
      { cells: params.cells, lang: params.lang },
      { signal },
    );
    console.log(res);
    return res.data ?? {};
  },
};
