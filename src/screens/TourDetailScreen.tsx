import { useState, useCallback, useRef, useEffect } from "react";
import {
  ChevronLeft,
  Play,
  Navigation,
  Map,
  Loader2,
  Key,
  Check,
  CreditCard,
  Lock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { useTourDetail } from "../hooks/useTour";
import type { TourDetail } from "../types/api.types";
import { useTourPlayer } from "../contexts/TourPlayerContext";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useI18n } from "../contexts/I18nContext";
import { tourPublicService } from "../services/tour.service";
import { paymentService } from "../services/payment.service";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";

type PayState = "idle" | "paying" | "success" | "error";

interface PayPalSectionProps {
  tourId: string;
  onSuccess: () => void;
}

function PayPalSection({ tourId, onSuccess }: PayPalSectionProps) {
  const [payState, setPayState] = useState<PayState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const invoiceIdRef = useRef<string | null>(null);
  const [{ isPending }] = usePayPalScriptReducer();

  const handleCreateOrder = useCallback(async () => {
    setErrorMsg("");
    try {
      const invoiceRes = await paymentService.createStartTourInvoice(tourId);
      invoiceIdRef.current = invoiceRes.id;
      const orderId = await paymentService.createPayPalOrder(invoiceRes.id);
      return orderId;
    } catch (err: any) {
      const msg =
        err?.message || "Không thể khởi tạo thanh toán. Vui lòng thử lại.";
      setErrorMsg(msg);
      setPayState("error");
      throw err;
    }
  }, [tourId]);

  const handleApprove = useCallback(
    async (data: { orderID?: string }) => {
      if (!data.orderID) return;
      setPayState("paying");
      try {
        await paymentService.capturePayPalOrder(
          data.orderID,
          invoiceIdRef.current ?? "",
        );
        setPayState("success");
        toast.success("Thanh toán thành công! Đang bắt đầu tour...");
        setTimeout(onSuccess, 1000);
      } catch (err: any) {
        const msg =
          err?.message || "Capture thất bại. Vui lòng liên hệ hỗ trợ.";
        setErrorMsg(msg);
        setPayState("error");
      }
    },
    [onSuccess],
  );

  if (payState === "success") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-5">
        <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="text-emerald-500" size={28} />
        </div>
        <p className="font-semibold text-emerald-700 text-sm">
          Thanh toán thành công!
        </p>
        <Loader2 className="animate-spin text-indigo-400" size={20} />
      </div>
    );
  }

  if (payState === "error") {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
          <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-600">{errorMsg}</p>
        </div>
        <button
          onClick={() => {
            setPayState("idle");
            setErrorMsg("");
            invoiceIdRef.current = null;
          }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 text-sm font-medium hover:border-indigo-300 hover:text-indigo-600 transition-colors"
        >
          <RefreshCw size={15} />
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between bg-indigo-50 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2">
          <CreditCard size={16} className="text-indigo-500" />
          <span className="text-sm font-semibold text-indigo-700">
            Phí trải nghiệm
          </span>
        </div>
        <span className="text-sm font-bold text-indigo-600">10 000 VND</span>
      </div>

      {isPending && (
        <div className="flex items-center justify-center gap-2 py-4 bg-gray-50 rounded-xl">
          <Loader2 size={18} className="animate-spin text-indigo-500" />
          <span className="text-sm text-gray-500">Đang tải PayPal...</span>
        </div>
      )}

      <div
        className={`rounded-xl overflow-hidden ${isPending ? "hidden" : "block"}`}
      >
        <PayPalButtons
          style={{
            layout: "vertical",
            shape: "rect",
            label: "pay",
            color: "blue",
          }}
          createOrder={handleCreateOrder}
          onApprove={handleApprove}
          onError={(err) => {
            console.error("[PayPal] error:", err);
            setErrorMsg("PayPal gặp lỗi. Vui lòng thử lại.");
            setPayState("error");
          }}
          onCancel={() => {
            setPayState("idle");
            invoiceIdRef.current = null;
            // TODO: update or delete invoice
            toast.info("Đã huỷ thanh toán.");
          }}
        />
      </div>

      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
        <ShieldCheck size={12} />
        <span>Thanh toán an toàn qua PayPal</span>
      </div>
    </div>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export function TourDetailScreen() {
  const { tourId } = useParams<{ tourId: string }>();
  const { startTour, currentTour } = useTourPlayer();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const codeFromUrl = searchParams.get("code") || "";
  const { t } = useI18n();
  const { data: tourDetail, loading, error, refetch } = useTourDetail(tourId);

  // Mở sẵn phần nhập code nếu có code trên URL, nếu không mở phần thanh toán (nếu đã login)
  const [expandedSection, setExpandedSection] = useState<
    "payment" | "code" | null
  >(codeFromUrl ? "code" : isAuthenticated ? "payment" : null);
  const [inputCode, setInputCode] = useState(codeFromUrl);

  const handlePaymentSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleApplyCode = () => {
    if (inputCode.trim()) {
      setSearchParams({ code: inputCode.trim() });
    } else {
      searchParams.delete("code");
      setSearchParams(searchParams);
    }
    toast.success("Đã ghi nhận mã kích hoạt. Vui lòng nhấn Bắt đầu Tour!");
  };

  const onStartTour = (tour: TourDetail) => {
    if (currentTour?.id === tour.id || tour.can_start) {
      startTour(tour);
      navigate("/places");
      return;
    }

    const code = searchParams.get("code");
    if (!code) {
      toast.error(
        t("tourDetail.activationCodeMissing") || "Vui lòng nhập mã kích hoạt!",
      );
      return;
    }

    tourPublicService
      .activateTour(tour.id, code)
      .then((response) => {
        if (response.data) {
          startTour(tour);
          navigate("/places");
        }
      })
      .catch((err) => {
        const errorMessage =
          err.response?.data?.message ||
          "Mã kích hoạt không hợp lệ hoặc đã hết hạn.";
        toast.error(errorMessage);
      });
  };

  const canStart = tourDetail?.can_start ?? false;
  const isCurrentTour = currentTour?.id === tourDetail?.id;
  const hasCode = !!codeFromUrl;

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Back button */}
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={() => navigate(-1)}
          className="bg-white/90 backdrop-blur text-gray-900 p-2 rounded-full shadow-sm hover:bg-white transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
      </div>

      {/* Hero image */}
      <div className="relative h-64 w-full bg-gray-200 shrink-0">
        <img
          src={
            tourDetail?.image ||
            "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
          }
          alt={tourDetail?.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-2xl font-bold text-white mb-2 shadow-sm leading-tight">
            {tourDetail?.name}
          </h1>
          <div className="flex items-center gap-1.5 text-white/90 text-sm">
            <Map size={16} />
            <span>
              {t("tourList.pointsLabel", {
                count: tourDetail?.point_count ?? 0,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-28">
        <div className="p-5 space-y-5">
          {/* ── ACCESS SECTION ─────────────────────────────────────── */}
          {canStart || isCurrentTour ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-800">
                  {isCurrentTour
                    ? "Tour đang được kích hoạt"
                    : "Bạn đã mua tour này"}
                </p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  {isCurrentTour
                    ? "Tiếp tục hành trình của bạn"
                    : "Có thể bắt đầu tour bất cứ lúc nào"}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-gray-50/50 px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <Lock size={15} className="text-gray-500" />
                <h3 className="text-sm font-bold text-gray-800">
                  Mở khoá Tour để trải nghiệm
                </h3>
              </div>

              {/* Lựa chọn 1: PayPal */}
              <div className="border-b border-gray-100">
                <button
                  onClick={() =>
                    setExpandedSection((prev) =>
                      prev === "payment" ? null : "payment",
                    )
                  }
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${expandedSection === "payment" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`}
                    >
                      <CreditCard size={16} />
                    </div>
                    <div className="text-left">
                      <p
                        className={`text-sm font-semibold ${expandedSection === "payment" ? "text-blue-700" : "text-gray-700"}`}
                      >
                        Mua tour qua PayPal
                      </p>
                      <p className="text-xs text-gray-500">
                        Thanh toán an toàn, nhanh chóng
                      </p>
                    </div>
                  </div>
                  {expandedSection === "payment" ? (
                    <ChevronUp size={18} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={18} className="text-gray-400" />
                  )}
                </button>

                {expandedSection === "payment" && (
                  <div className="px-4 pb-4">
                    {isAuthenticated ? (
                      <PayPalSection
                        tourId={tourDetail?.id ?? ""}
                        onSuccess={handlePaymentSuccess}
                      />
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-col gap-2">
                        <p className="text-sm font-medium text-amber-800">
                          Bạn cần đăng nhập để thanh toán
                        </p>
                        <button
                          onClick={() => navigate("/login")}
                          className="bg-amber-500 text-white text-sm font-bold py-2.5 rounded-lg w-full hover:bg-amber-600 transition-colors"
                        >
                          Đăng nhập ngay
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Lựa chọn 2: Activation Code */}
              <div>
                <button
                  onClick={() =>
                    setExpandedSection((prev) =>
                      prev === "code" ? null : "code",
                    )
                  }
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${expandedSection === "code" ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-500"}`}
                    >
                      <Key size={16} />
                    </div>
                    <div className="text-left">
                      <p
                        className={`text-sm font-semibold ${expandedSection === "code" ? "text-indigo-700" : "text-gray-700"}`}
                      >
                        Dùng mã kích hoạt
                      </p>
                      <p className="text-xs text-gray-500">
                        Nhập mã nếu bạn được cấp
                      </p>
                    </div>
                  </div>
                  {expandedSection === "code" ? (
                    <ChevronUp size={18} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={18} className="text-gray-400" />
                  )}
                </button>

                {expandedSection === "code" && (
                  <div className="px-4 pb-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-100 transition-all">
                        <input
                          type="text"
                          placeholder="Nhập mã kích hoạt..."
                          value={inputCode}
                          onChange={(e) => setInputCode(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleApplyCode()
                          }
                          className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-2 py-1 outline-none"
                        />
                        <button
                          onClick={handleApplyCode}
                          className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors shrink-0 text-xs font-semibold flex items-center gap-1"
                        >
                          <Check size={14} /> Áp dụng
                        </button>
                      </div>
                      {codeFromUrl && (
                        <p className="text-xs text-emerald-600 font-medium ml-1">
                          ✓ Đang sử dụng mã: {codeFromUrl}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Start Tour button */}
          <button
            onClick={() => tourDetail && onStartTour(tourDetail)}
            disabled={
              !tourDetail ||
              loading ||
              (!canStart && !isCurrentTour && !hasCode)
            }
            className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-indigo-700 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none mt-2"
          >
            <Play size={20} className="fill-white" />
            {loading
              ? t("tourDetail.startButtonLoading")
              : isCurrentTour
                ? "Tiếp tục Tour"
                : t("tourDetail.startButton")}
          </button>
        </div>

        {/* Description */}
        <div className="px-5 mb-8">
          <p className="text-gray-600 text-[15px] leading-relaxed">
            {tourDetail?.description || t("tourDetail.descriptionFallback")}
          </p>
        </div>

        {/* Route list */}
        <div className="px-5">
          <h3 className="font-bold text-lg text-gray-900 mb-6 flex items-center gap-2">
            <Navigation size={18} className="text-indigo-600" />
            {t("tourDetail.routeTitle")}
          </h3>

          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin text-gray-400" size={24} />
            </div>
          ) : error ? (
            <p className="text-red-500 text-sm">{t("tourDetail.error")}</p>
          ) : tourDetail?.pois && tourDetail.pois.length > 0 ? (
            <div className="relative border-l-2 border-dashed border-gray-200 ml-3 pb-4">
              {tourDetail.pois.map((item, index) => {
                const isLast = index === tourDetail.pois.length - 1;
                return (
                  <div
                    key={item.poi.id}
                    className={`relative pl-6 ${isLast ? "" : "mb-8"}`}
                  >
                    <div className="absolute w-6 h-6 bg-white border-2 border-indigo-500 rounded-full left-[-13px] top-0 flex items-center justify-center text-[10px] font-bold text-indigo-700 shadow-sm">
                      {item.position}
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <h4 className="font-semibold text-gray-900 leading-tight mb-1">
                        {item.poi.name}
                      </h4>
                      <span className="uppercase text-[10px] tracking-wider font-semibold text-gray-400">
                        {item.poi.type || "Địa điểm"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">
              {t("tourDetail.routeEmpty")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
