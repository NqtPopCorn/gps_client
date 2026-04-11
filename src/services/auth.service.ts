import { get, post } from "../lib/api";
import { tokenStorage } from "../lib/api";
import type {
  LoginRequest,
  ApiResponse,
  RegisterRequest,
  UserResponse,
  LoginData,
} from "../types/api.types";

// ─── Auth Service ─────────────────────────────────────────────────────────────

export const authService = {
  /**
   * Authenticate and receive a JWT token.
   * Token is automatically persisted to localStorage.
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginData>> {
    const response = await post<ApiResponse<LoginData>>(
      "/api/auth/login",
      credentials,
    );
    if (response.data?.access_token) {
      tokenStorage.set(response.data.access_token);
    }
    return response;
  },

  /**
   * Register a new user account.
   */
  async register(payload: RegisterRequest): Promise<ApiResponse<UserResponse>> {
    return post<ApiResponse<UserResponse>>("/api/auth/register", payload);
  },

  /**
   * Clear local token – no server call needed (stateless JWT).
   */
  logout(): void {
    tokenStorage.clear();
  },

  /**
   * Returns true when a token exists in storage.
   * Does NOT validate expiry – pair with a /me endpoint if available.
   */
  isAuthenticated(): boolean {
    return tokenStorage.get() !== null;
  },

  async fetchProfile(): Promise<ApiResponse<UserResponse>> {
    return get<ApiResponse<UserResponse>>("/api/auth/profile");
  },
};
