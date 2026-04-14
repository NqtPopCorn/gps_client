import { get, post, put, del } from "../lib/api";
import type {
  Tour,
  TourDetail,
  TourPointDetailInline,
  PaginationParams,
  LangCode,
  ApiResponse,
  PaginatedResponse,
  TourActivationResponse,
} from "../types/api.types";

// ─── Public Tour endpoints ────────────────────────────────────────────────────

export const tourPublicService = {
  /**
   * List all tours with pagination.
   */
  list(params?: PaginationParams): Promise<PaginatedResponse<Tour>> {
    return get<PaginatedResponse<Tour>>("/api/tours/", { params });
  },

  /**
   * Get a tour with its ordered list of POIs, localized to the requested language.
   */
  getById(id: string, lang: LangCode): Promise<ApiResponse<TourDetail>> {
    return get<ApiResponse<TourDetail>>(`/api/tours/${id}`, {
      params: { lang },
    });
  },

  activateTour(
    tourId: string,
    code: string,
  ): Promise<ApiResponse<TourActivationResponse>> {
    return get<ApiResponse<TourActivationResponse>>(
      `/api/tours/${tourId}/activate/`,
      { params: { code } },
    );
  },
};
