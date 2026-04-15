import { get, post } from "../lib/api";
import {
  ApiResponse,
  HistoryResponse,
  LangCode,
  LogHistoryRequest,
} from "../types";

export const historyService = {
  getHistory(lang_code: LangCode): Promise<ApiResponse<HistoryResponse[]>> {
    return get<ApiResponse<HistoryResponse[]>>("/api/history/", {
      params: { lang_code },
    });
  },

  logHistory(params: LogHistoryRequest): Promise<ApiResponse<null>> {
    console.log("log history", { params });
    return post<ApiResponse<null>>(`/api/history/`, params);
  },
};
