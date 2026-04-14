// ─────────────────────────────────────────────────────────────────────────────
// Shared / primitives
// ─────────────────────────────────────────────────────────────────────────────

export type LangCode = "vi" | "en" | "fr" | "zh" | "ja";
export enum LangCodeEnum {
  vi,
  en,
  fr,
  zh,
  ja,
}
export const LANGUAGES: Record<LangCode, string> = {
  vi: "Tiếng Việt",
  en: "English",
  fr: "Français",
  zh: "中文",
  ja: "日本語",
};
export const LANG_FLAGS: Record<LangCode, string> = {
  vi: "🇻🇳",
  en: "🇺🇸",
  fr: "🇫🇷",
  zh: "🇨🇳",
  ja: "🇯🇵",
};

// ─────────────────────────────────────────────────────────────────────────────
// API Response Wrappers
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

export interface PaginatedData<T> {
  results: T[];
  total: number;
  totalPage: number;
}

export type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>;

// ─────────────────────────────────────────────────────────────────────────────
// Pagination & Query Parameters
// ─────────────────────────────────────────────────────────────────────────────

export interface PaginationParams {
  page?: number;
  limit?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  /** Minimum 8 characters */
  password: string;
}

export interface UserResponse {
  id: string;
  email: string;
  role: string;
  date_joined: string;
  is_active: boolean;
}

export interface LoginData {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

export interface LoginResponse {
  status: number;
  message: string;
  data: LoginData;
}

// ─────────────────────────────────────────────────────────────────────────────
// POI – Public
// ─────────────────────────────────────────────────────────────────────────────

export interface POI {
  id: string;
  name: string;
  description: string;
  audio: string;
  image: string | null;
  latitude: number;
  longitude: number;
  type: string;
  slug: string;
  /** Distance in metres (float). Read-only, computed by the server. */
  distance: number;
  /** ISO language codes for which a localization exists. Read-only. */
  supported_languages: string[];
  radius: number;
}

export interface NearbyPOIParams {
  lat: number;
  lng: number;
  lang: LangCode;
  radius?: number;
  limit?: number;
}
export interface SearchPOIParams {
  name?: string;
  lang?: LangCode;
}
export interface POIDetail extends POI {
  radius: number;
  status: string;
  default_lang: LangCode;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Localization
// ─────────────────────────────────────────────────────────────────────────────

export interface LocalizationResponse {
  id: string;
  poi_id: string;
  lang_code: LangCode;
  name: string;
  description: string | null;
  audio: string | null;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tour – Tour point shapes
// ─────────────────────────────────────────────────────────────────────────────

export interface TourPointDetailInline {
  /** Server-assigned tour-point record id (used for delete/reorder). */
  id: string;
  position: number;
  poi: POI;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tour
// ─────────────────────────────────────────────────────────────────────────────

/** List-level tour object (no `pois` array). Matches Swagger `Tour`. */
export interface Tour {
  id: string;
  name: string;
  image: string | null;
  description: string | null;
  point_count: number;
  status?: string;
  created_at: string;
  updated_at: string;
}

export interface TourDetail extends Tour {
  /** Ordered list of tour points with embedded POI data. Read-only. */
  pois: TourPointDetailInline[];
}

export interface TourActivationResponse {
  tour_id: string | number;
  code: string;
  expires_in: number;
  expired_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// History
// ─────────────────────────────────────────────────────────────────────────────

export interface HistoryResponse {
  poi: POI;
  // ISO timestamp
  created_at: string;
}

export interface LogHistoryRequest {
  poi_id: string;
  // user_id: string;
}
