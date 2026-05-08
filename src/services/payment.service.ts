import { get, post } from "../lib/api";
import type { ApiResponse } from "../types/api.types";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface Invoice {
  id: string;
  invoice_type: "POI_CREDIT" | "START_TOUR";
  reason: string;
  amount: number;
  status: "PENDING" | "SUCCESS" | "FAILED";
  paid_at: string | null;
  transaction_code: string | null;
  created_at: string;
}

export interface PayPalOrderResult {
  id: string;
  status: string;
}

// ─── Service ────────────────────────────────────────────────────────────────────

export const paymentService = {
  /**
   * Tạo Invoice để thanh toán lượt start tour.
   * POST /api/payments/pay-to-start-tour/
   */
  createStartTourInvoice(tourId: string): Promise<Invoice> {
    return post<Invoice>("/api/payments/pay-to-start-tour/", {
      tourId,
    });
  },

  /**
   * Tạo PayPal Order từ invoiceId.
   * POST /api/payments/paypal/create-order/
   */
  async createPayPalOrder(invoiceId: string): Promise<string> {
    const result = await post<PayPalOrderResult>(
      "/api/payments/paypal/create-order/",
      { invoiceId },
    );
    return result.id;
  },

  /**
   * Capture PayPal Order sau khi user approve.
   * POST /api/payments/paypal/capture-order/{orderId}/
   */
  capturePayPalOrder(orderId: string, invoiceId: string): Promise<unknown> {
    return post(`/api/payments/paypal/capture-order/${orderId}/`, {
      invoiceId,
    });
  },

  /**
   * Lấy danh sách hóa đơn của user.
   */
  getInvoices(): Promise<ApiResponse<Invoice[]>> {
    return get<ApiResponse<Invoice[]>>("/api/payments/invoices/");
  },

  checkInvoiceStatus(
    invoiceId: string,
  ): Promise<{ status: Invoice["status"] }> {
    return get<{ status: Invoice["status"] }>(
      `/api/payments/invoices/${invoiceId}/`,
    );
  },
};
