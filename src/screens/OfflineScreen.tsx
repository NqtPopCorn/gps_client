import { useEffect, useState } from "react";
import { Download, Clock } from "lucide-react";
import { useI18n } from "../contexts/I18nContext";
import type { TranslationKey } from "../i18n/messages";

type Tab = "download" | "history";

const TABS: { id: Tab; labelKey: TranslationKey; icon: typeof Download }[] = [
  { id: "history", labelKey: "nav.history", icon: Clock },
  { id: "download", labelKey: "offline.tabs.download", icon: Download },
];

export function OfflineScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("history");
  const { t } = useI18n();

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* ── Header + Tab Bar ── */}
      <div className="bg-white shadow-sm sticky top-0 z-20 px-5 pt-6 pb-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {activeTab === "download"
            ? t("offline.tabs.download")
            : t("nav.history")}
        </h1>

        {/* Tab pills */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {TABS.map(({ id, labelKey, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === id
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon size={15} />
              {t(labelKey)}
            </button>
          ))}
        </div>

        {/* Active tab indicator line */}
        <div className="flex mt-0">
          {TABS.map(({ id }) => (
            <div
              key={id}
              className={`h-0.5 flex-1 transition-all duration-300 mt-3 ${
                activeTab === id ? "bg-indigo-600" : "bg-transparent"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="flex-1 overflow-hidden relative">
        {/* Download tab — luôn mounted để giữ state download progress */}
        <div
          className={`absolute inset-0 transition-opacity duration-200 ${
            activeTab === "download"
              ? "opacity-100 pointer-events-auto z-10"
              : "opacity-0 pointer-events-none z-0"
          }`}
        >
          {/* Ẩn header của DownloadPage vì đã có header chung ở trên */}
          <DownloadPageContent />
        </div>

        {/* History tab */}
        <div
          className={`absolute inset-0 transition-opacity duration-200 ${
            activeTab === "history"
              ? "opacity-100 pointer-events-auto z-10"
              : "opacity-0 pointer-events-none z-0"
          }`}
        >
          <HistoryContent />
        </div>
      </div>
    </div>
  );
}

// ─── Wrapped versions without their own top headers ──────────────────────────

import {
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  WifiOff,
  HardDrive,
  Map,
} from "lucide-react";
import { useTourList } from "../hooks/useTour";
import { useSettings } from "../contexts/SettingsContext";
import { getAllTours } from "../lib/db";
import type { Tour, TourDetail } from "../types/api.types";
import { useDownloadManager } from "../hooks/usePoiDownload";
import { Clock as ClockIcon, PlayCircle, MapPin, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useHistoryList } from "../hooks/useHistory";
import { useTourPlayer } from "../contexts/TourPlayerContext";

// ── Progress Bar ──────────────────────────────────────────────────────────────

function ProgressBar({
  progress,
  status,
}: {
  progress: number;
  status: "downloading" | "done" | "error" | "idle";
}) {
  const colors = {
    downloading: "bg-indigo-500",
    done: "bg-emerald-500",
    error: "bg-red-400",
    idle: "bg-gray-300",
  };
  return (
    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-300 ease-out ${colors[status]}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({
  status,
  progress,
}: {
  status: "downloading" | "done" | "error" | "idle";
  progress: number;
}) {
  const { t } = useI18n();
  if (status === "downloading")
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
        <Loader2 size={12} className="animate-spin" />
        {progress}%
      </span>
    );
  if (status === "done")
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
        <CheckCircle2 size={12} />
        {t("offline.download.card.status.done")}
      </span>
    );
  if (status === "error")
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-red-500 bg-red-50 px-2.5 py-1 rounded-full">
        <AlertCircle size={12} />
        {t("offline.download.card.status.error")}
      </span>
    );
  return null;
}

// ── Tour Download Card ────────────────────────────────────────────────────────

function TourDownloadCard({
  tour,
  onDownload,
  onDelete,
  state,
}: {
  tour: Tour;
  onDownload: () => void;
  onDelete: () => void;
  state: {
    status: "downloading" | "done" | "error" | "idle";
    progress: number;
    error?: string;
  };
}) {
  const isDownloading = state.status === "downloading";
  const isDone = state.status === "done";
  const { t } = useI18n();

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
        isDone
          ? "border-emerald-200 shadow-sm"
          : isDownloading
            ? "border-indigo-200 shadow-md"
            : "border-gray-100 shadow-sm hover:shadow-md"
      }`}
    >
      <div className="flex gap-3 p-3">
        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
          <img
            src={
              tour.image ||
              "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=400"
            }
            alt={tour.name}
            className="w-full h-full object-cover"
          />
          {isDownloading && (
            <div className="absolute inset-0 bg-indigo-900/50 flex items-center justify-center">
              <Loader2 size={20} className="text-white animate-spin" />
            </div>
          )}
          {isDone && (
            <div className="absolute inset-0 bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle2 size={20} className="text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 leading-tight">
              {tour.name}
            </h3>
            <StatusBadge status={state.status} progress={state.progress} />
          </div>
          <p className="text-xs text-gray-500 line-clamp-2 mb-2">
            {tour.description || t("offline.download.card.descriptionFallback")}
          </p>
          <div className="flex items-center gap-1 text-xs font-medium text-indigo-600">
            <Map size={12} />
            <span>
              {t("tourList.pointsLabel", { count: tour.point_count })}
            </span>
          </div>
        </div>
      </div>

      {(isDownloading || state.status === "error") && (
        <div className="px-3 pb-2">
          <ProgressBar progress={state.progress} status={state.status} />
          {state.error && (
            <p className="text-xs text-red-500 mt-1">{state.error}</p>
          )}
        </div>
      )}

      <div className="flex border-t border-gray-50">
        {isDone ? (
          <button
            onClick={onDelete}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
            {t("offline.download.card.action.delete")}
          </button>
        ) : (
          <button
            onClick={onDownload}
            disabled={isDownloading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isDownloading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {t("offline.download.card.action.downloading")}
              </>
            ) : state.status === "error" ? (
              <>
                <Download size={14} />
                {t("offline.download.card.action.retry")}
              </>
            ) : (
              <>
                <Download size={14} />
                {t("offline.download.card.action.download")}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Download Tab Content (no header) ─────────────────────────────────────────

function DownloadPageContent() {
  const { settings } = useSettings();
  const { data, loading: listLoading } = useTourList();
  const { downloadTour, removeTour, getState, downloadedMeta } =
    useDownloadManager();
  const { t } = useI18n();

  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showDownloadedOnly, setShowDownloadedOnly] = useState(false);
  const [idbTours, setIdbTours] = useState<TourDetail[]>([]);

  useEffect(() => {
    const on = () => setIsOffline(false);
    const off = () => setIsOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
    getAllTours().then(setIdbTours).catch(console.error);
  }, [downloadedMeta]);

  const apiTours: Tour[] = data?.results ?? [];
  const apiIds = new Set(apiTours.map((t) => t.id));
  const offlineOnlyTours: Tour[] = idbTours
    .filter((t) => !apiIds.has(t.id))
    .map((t) => ({
      id: t.id,
      name: t.name,
      image: t.image,
      description: t.description,
      point_count: t.point_count,
      status: t.status,
      created_at: t.created_at,
      updated_at: t.updated_at,
    }));
  const allTours: Tour[] = [...offlineOnlyTours, ...apiTours];
  const downloadedCount = downloadedMeta.filter(
    (m) => m.type === "tour",
  ).length;
  const displayedTours = showDownloadedOnly
    ? allTours.filter((t) => getState(`tour-${t.id}`).status === "done")
    : allTours;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sub-header: stats + filter */}
      <div className="bg-white px-5 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <HardDrive size={15} className="text-indigo-500" />
            <span className="font-bold text-indigo-600">
              {downloadedCount}
            </span>{" "}
            <span>{t("offline.download.stats.label")}</span>
          </div>
          {isOffline && (
            <span className="flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full border border-orange-100">
              <WifiOff size={11} />
              {t("common.status.offline")}
            </span>
          )}
          <button
            onClick={() => setShowDownloadedOnly((v) => !v)}
            className={`ml-auto flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              showDownloadedOnly
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
            }`}
          >
            <CheckCircle2 size={11} />
            {t("offline.download.filterButton")}
          </button>
        </div>
      </div>

      {isOffline && (
        <div className="mx-4 mt-3 p-3 bg-orange-50 border border-orange-100 rounded-xl flex items-start gap-2.5">
          <WifiOff size={15} className="text-orange-500 shrink-0 mt-0.5" />
          <p className="text-xs text-orange-700 leading-relaxed">
            {t("offline.download.offlineNotice")}
          </p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {listLoading && allTours.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 p-3 animate-pulse"
            >
              <div className="flex gap-3">
                <div className="w-20 h-20 rounded-xl bg-gray-200" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))
        ) : displayedTours.length > 0 ? (
          displayedTours.map((tour) => {
            const key = `tour-${tour.id}`;
            return (
              <TourDownloadCard
                key={tour.id}
                tour={tour}
                state={getState(key)}
                onDownload={() => downloadTour(tour.id, settings.language)}
                onDelete={() => removeTour(tour.id)}
              />
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Download className="text-gray-400" size={24} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">
              {showDownloadedOnly
                ? t("offline.download.empty.title.downloadedOnly")
                : t("offline.download.empty.title.all")}
            </h3>
            <p className="text-sm text-gray-500">
              {showDownloadedOnly
                ? t("offline.download.empty.subtitle.downloadedOnly")
                : t("offline.download.empty.subtitle.all")}
            </p>
            {showDownloadedOnly && (
              <button
                onClick={() => setShowDownloadedOnly(false)}
                className="mt-4 text-sm text-indigo-600 font-medium hover:underline"
              >
                {t("offline.download.empty.showAll")}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-gray-100 bg-white">
        <p className="text-xs text-center text-gray-400">
          {t("offline.download.footerNote")}
        </p>
      </div>
    </div>
  );
}

// ── History Tab Content (no header) ──────────────────────────────────────────

function HistoryContent() {
  const navigate = useNavigate();
  const { data: historyList, isLoading, error } = useHistoryList();
  const { t } = useI18n();

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <LogIn size={36} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {t("profile.guest.notLoggedIn.title")}
        </h2>

        <p className="text-gray-500 text-sm mb-8 leading-relaxed max-w-xs">
          {t("profile.guest.notLoggedIn.subtitle")}
        </p>

        <button
          onClick={() => navigate("/login")}
          className="w-full max-w-xs bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all"
        >
          <LogIn size={20} />
          {t("profile.guest.notLoggedIn.cta")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 h-full">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 text-indigo-500">
          <Loader2 className="animate-spin mb-2" size={32} />
          <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>
        </div>
      ) : !historyList || historyList.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <ClockIcon size={48} className="mb-4 opacity-20" />
          <p className="text-sm">Chưa có lịch sử nào.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 pb-20">
          {historyList.map((item) => (
            <div
              key={item.poi.id}
              onClick={() => navigate(`/poi/${item.poi.slug}`)}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
            >
              <img
                src={
                  item.poi.image ||
                  "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=200"
                }
                alt={item.poi.name}
                className="w-24 h-24 rounded-xl object-cover bg-gray-200 shrink-0"
              />
              <div className="flex flex-col justify-center flex-1 overflow-hidden">
                <h3 className="font-semibold text-gray-900 mb-1 truncate">
                  {item.poi.name}
                </h3>
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                  <MapPin size={12} className="shrink-0" />
                  <span className="truncate">
                    Đã đến: {formatDate(item.created_at)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-indigo-600 font-medium text-sm mt-auto">
                  <PlayCircle size={16} />
                  <span>Nghe lại</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
