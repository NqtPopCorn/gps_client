// import { get, post } from "../lib/api";
// import type {
//   Subscription,
//   SubscribeRequest,
//   ApiResponse,
// } from "../types/api.types";

// // ─── Subscription Service ─────────────────────────────────────────────────────

// export const subscriptionService = {
//   /**
//    * Retrieve the latest active subscription for the authenticated user.
//    * Throws ApiError with status 404 if no active subscription found.
//    */
//   getCurrent(): Promise<ApiResponse<Subscription>> {
//     return get<ApiResponse<Subscription>>("/api/subscription/");
//   },

//   /**
//    * Subscribe the authenticated user to a plan.
//    * Subscription expires 30 days from creation.
//    */
//   subscribe(payload: SubscribeRequest): Promise<ApiResponse<Subscription>> {
//     return post<ApiResponse<Subscription>>(
//       "/api/subscription/subscribe",
//       payload,
//     );
//   },
// };
