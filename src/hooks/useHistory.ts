import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { historyService } from "../services/history.service"; // Điều chỉnh đường dẫn
import { LangCode, LogHistoryRequest } from "../types"; // Điều chỉnh đường dẫn

// ─── useHistoryList ───────────────────────────────────────────────────────────

/**
 * Fetch danh sách lịch sử địa điểm đã đến
 */
export function useHistoryList(lang: LangCode) {
  return useQuery({
    queryKey: ["history", "list"],
    queryFn: async () => {
      const res = await historyService.getHistory(lang);
      return res.data; // Trả về mảng HistoryResponse[]
    },
    retry: false,
  });
}

// ─── useLogHistory ────────────────────────────────────────────────────────────

/**
 * Ghi nhận lịch sử mới (POST)
 */
export function useLogHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    // Hàm thực thi gọi API
    mutationFn: (params: LogHistoryRequest) => {
      console.log("on add history");
      return historyService.logHistory(params);
    },

    // Khi gọi API thành công
    onSuccess: () => {
      // 🎯 Báo cho React Query biết data của key ["history", "list"] đã cũ
      queryClient.invalidateQueries({ queryKey: ["history", "list"] });
    },

    onError: (error) => {
      console.error("Lỗi khi lưu lịch sử:", error);
    },
  });
}
