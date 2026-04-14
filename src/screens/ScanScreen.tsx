import { useEffect, useRef, useState, useCallback } from "react";
import {
  Camera,
  QrCode,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import QrScanner from "qr-scanner";

type ScanState =
  | "starting"
  | "scanning"
  | "success"
  | "error"
  | "permission_denied";

function extractRoute(raw: string): string | null {
  try {
    const url = new URL(raw);
    return url.pathname + url.search;
  } catch {
    if (raw.startsWith("/")) return raw;
    return null;
  }
}

export function ScanScreen() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);

  const [scanState, setScanState] = useState<ScanState>("starting");
  const [resultText, setResultText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // 🔥 Stop + destroy scanner
  const stopScanner = useCallback(() => {
    scannerRef.current?.destroy(); // 🔥 quan trọng
    scannerRef.current = null;
  }, []);

  const handleSuccess = useCallback(
    (decoded: string) => {
      if (!isMountedRef.current) return;

      stopScanner(); // 🔥 camera tắt ngay

      setResultText(decoded);
      setScanState("success");

      const route = extractRoute(decoded);
      if (route) {
        setTimeout(() => navigate(route), 500);
      }
    },
    [navigate, stopScanner],
  );

  const startCamera = useCallback(async () => {
    if (!videoRef.current) return;

    setScanState("starting");
    setErrorMsg("");

    stopScanner();

    try {
      const scanner = new QrScanner(
        videoRef.current,
        (result) => handleSuccess(result.data),
        {
          preferredCamera: "environment",
          highlightScanRegion: false,
          highlightCodeOutline: false,
        },
      );

      scannerRef.current = scanner;

      await scanner.start();
      if (isMountedRef.current) setScanState("scanning");
    } catch (err: any) {
      const msg = String(err?.message ?? err ?? "").toLowerCase();

      if (msg.includes("permission") || msg.includes("notallowed")) {
        setScanState("permission_denied");
      } else {
        setScanState("error");
        setErrorMsg("Không thể khởi động camera.");
      }
    }
  }, [handleSuccess, stopScanner]);

  useEffect(() => {
    isMountedRef.current = true;
    startCamera();

    return () => {
      isMountedRef.current = false;
      stopScanner(); // 🔥 đảm bảo tắt khi rời trang
    };
  }, [startCamera, stopScanner]);

  // 📂 Scan từ ảnh
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    stopScanner();
    setScanState("starting");

    try {
      const result = await QrScanner.scanImage(file);
      handleSuccess(result);
    } catch {
      if (!isMountedRef.current) return;
      setScanState("error");
      setErrorMsg("Không tìm thấy QR trong ảnh.");
      setTimeout(() => {
        if (isMountedRef.current) startCamera();
      }, 2000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black relative overflow-hidden">
      {/* 🎥 Camera */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay tối */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-[calc(50%-120px)] bg-black/55" />
        <div className="absolute bottom-0 left-0 right-0 h-[calc(50%-120px)] bg-black/55" />
        <div className="absolute top-[calc(50%-120px)] bottom-[calc(50%-120px)] left-0 w-[calc(50%-120px)] bg-black/55" />
        <div className="absolute top-[calc(50%-120px)] bottom-[calc(50%-120px)] right-0 w-[calc(50%-120px)] bg-black/55" />
      </div>

      {/* Khung QR */}
      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
        <div className="relative w-60 h-60">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-2xl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-2xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-2xl" />

          {scanState === "scanning" && (
            <div className="w-full h-0.5 bg-indigo-400 absolute left-0 shadow-[0_0_12px_#818cf8] animate-[scan_2s_ease-in-out_infinite]" />
          )}
        </div>
      </div>

      {/* Header */}
      <div className="absolute top-0 pt-safe pt-6 px-6 w-full z-30 text-center">
        <h1 className="text-2xl font-bold text-white">Quét QR Code</h1>
        <p className="text-white/70 text-sm mt-1">
          {scanState === "scanning"
            ? "Hướng camera vào mã QR"
            : scanState === "starting"
              ? "Đang khởi động camera…"
              : scanState === "success"
                ? "Đang chuyển trang…"
                : ""}
        </p>
      </div>

      {/* Success */}
      {scanState === "success" && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/70 gap-4 px-8">
          <CheckCircle2 size={40} className="text-green-400" />
          <p className="text-white">{resultText}</p>
        </div>
      )}

      {/* Error */}
      {(scanState === "error" || scanState === "permission_denied") && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-gray-950 gap-5 px-8">
          <AlertCircle size={40} className="text-red-400" />
          <p className="text-white">
            {scanState === "permission_denied" ? "Camera bị từ chối" : errorMsg}
          </p>
          {scanState === "error" && (
            <button
              onClick={startCamera}
              className="bg-indigo-600 text-white px-6 py-3 rounded-full"
            >
              <RefreshCw size={18} /> Thử lại
            </button>
          )}
        </div>
      )}

      {/* Upload */}
      <div className="absolute bottom-28 left-0 right-0 z-30 flex justify-center">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-white/10 text-white px-6 py-3 rounded-full flex items-center gap-2"
        >
          <QrCode size={20} />
          Chọn ảnh
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
