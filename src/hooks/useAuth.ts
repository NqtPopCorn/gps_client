// import { useState, useCallback, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { authService } from "../services/auth.service";
// import { tokenStorage } from "../lib/api";
// import type {
//   LoginRequest,
//   RegisterRequest,
//   UserResponse,
// } from "../types/api.types";
// import type { ApiError } from "../lib/api";

// interface AuthState {
//   user: UserResponse | null;
//   isAuthenticated: boolean;
//   isLoading: boolean;
//   error: ApiError | null;
// }

// /**
//  * useAuth
//  *
//  * Manages authentication state: login, register, logout.
//  * Listens to `auth:unauthorized` events dispatched by the API interceptor
//  * and redirects to /login automatically.
//  *
//  * @example
//  * const { login, isLoading, error } = useAuth();
//  * await login({ email, password });
//  */
// export function useAuth() {
//   const navigate = useNavigate();

//   const [state, setState] = useState<AuthState>({
//     user: null,
//     isAuthenticated: authService.isAuthenticated(),
//     isLoading: false,
//     error: null,
//   });

//   // ─── Listen for 401 events from the API interceptor ────────────────────────
//   useEffect(() => {
//     const onUnauthorized = () => {
//       setState((s) => ({ ...s, user: null, isAuthenticated: false }));
//       navigate("/login", { replace: true });
//     };
//     window.addEventListener("auth:unauthorized", onUnauthorized);
//     return () =>
//       window.removeEventListener("auth:unauthorized", onUnauthorized);
//   }, [navigate]);

//   // ─── Login ─────────────────────────────────────────────────────────────────
//   const login = useCallback(
//     async (credentials: LoginRequest): Promise<boolean> => {
//       setState((s) => ({ ...s, isLoading: true, error: null }));
//       try {
//         const response = await authService.login(credentials);
//         setState({
//           user: response.data.user,
//           isAuthenticated: true,
//           isLoading: false,
//           error: null,
//         });
//         return true;
//       } catch (err) {
//         setState((s) => ({
//           ...s,
//           isLoading: false,
//           error: err as ApiError,
//         }));
//         return false;
//       }
//     },
//     [],
//   );

//   // ─── Register ──────────────────────────────────────────────────────────────
//   const register = useCallback(
//     async (payload: RegisterRequest): Promise<UserResponse | null> => {
//       setState((s) => ({ ...s, isLoading: true, error: null }));
//       try {
//         const response = await authService.register(payload);
//         setState((s) => ({ ...s, isLoading: false }));
//         return response.data;
//       } catch (err) {
//         setState((s) => ({
//           ...s,
//           isLoading: false,
//           error: err as ApiError,
//         }));
//         return null;
//       }
//     },
//     [],
//   );

//   // ─── Logout ────────────────────────────────────────────────────────────────
//   const logout = useCallback(() => {
//     authService.logout();
//     setState({
//       user: null,
//       isAuthenticated: false,
//       isLoading: false,
//       error: null,
//     });
//     navigate("/login", { replace: true });
//   }, [navigate]);

//   return {
//     ...state,
//     login,
//     register,
//     logout,
//   };
// }
