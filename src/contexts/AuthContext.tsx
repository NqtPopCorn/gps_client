import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { get, post } from "../lib/api";
import { tokenStorage } from "../lib/api";
import type {
  LoginRequest,
  RegisterRequest,
  UserResponse,
  LoginData,
} from "../types/api.types";
import type { ApiError } from "../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthState {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<boolean>;
  register: (payload: RegisterRequest) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });

  // Restore session on mount
  useEffect(() => {
    const token = tokenStorage.get();
    if (!token) return;

    get<{ status: number; data: UserResponse }>("/api/auth/me")
      .then((res) => {
        setState((s) => ({ ...s, user: res.data, isAuthenticated: true }));
      })
      .catch(() => {
        tokenStorage.clear();
      });
  }, []);

  // Listen for 401 events
  useEffect(() => {
    const onUnauthorized = () => {
      tokenStorage.clear();
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    };
    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () =>
      window.removeEventListener("auth:unauthorized", onUnauthorized);
  }, []);

  // ─── Login ──────────────────────────────────────────────────────────────────

  const login = useCallback(
    async (credentials: LoginRequest): Promise<boolean> => {
      setState((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const res = await post<{ status: number; data: LoginData }>(
          "/api/auth/login",
          credentials,
        );
        tokenStorage.set(res.data.access_token);
        setState({
          user: res.data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return true;
      } catch (err) {
        const apiErr = err as ApiError;
        setState((s) => ({
          ...s,
          isLoading: false,
          error: apiErr.message || "Đăng nhập thất bại. Vui lòng thử lại.",
        }));
        return false;
      }
    },
    [],
  );

  // ─── Register ───────────────────────────────────────────────────────────────

  const register = useCallback(
    async (payload: RegisterRequest): Promise<boolean> => {
      setState((s) => ({ ...s, isLoading: true, error: null }));
      try {
        await post("/api/auth/register", payload);
        // Auto-login after register
        return await login(payload);
      } catch (err) {
        const apiErr = err as ApiError;
        setState((s) => ({
          ...s,
          isLoading: false,
          error:
            apiErr.message || "Đăng ký thất bại. Email có thể đã được sử dụng.",
        }));
        return false;
      }
    },
    [login],
  );

  // ─── Logout ─────────────────────────────────────────────────────────────────

  const logout = useCallback(() => {
    tokenStorage.clear();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }, []);

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, logout, clearError }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
