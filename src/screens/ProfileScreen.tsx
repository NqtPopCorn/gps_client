import { useState } from "react";
import {
  User,
  CreditCard,
  Download,
  LogOut,
  LogIn,
  UserPlus,
  ChevronRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  X,
  AlertCircle,
  Volume2,
  Zap,
  Moon,
  Globe,
  RotateCcw,
  ShieldCheck,
  Info,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useSettings } from "../contexts/SettingsContext";
import { LANGUAGES, LANG_FLAGS, type LangCode } from "../types/api.types";

// ─── Auth Modal ───────────────────────────────────────────────────────────────

type AuthMode = "login" | "register";

function AuthModal({ onClose }: { onClose: () => void }) {
  const { login, register, isLoading, error, clearError } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const switchMode = (m: AuthMode) => {
    setMode(m);
    clearError();
    setEmail("");
    setPassword("");
  };

  const handleSubmit = async () => {
    if (!email || !password) return;
    const ok =
      mode === "login"
        ? await login({ email, password })
        : await register({ email, password });
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl p-6 pb-10 z-10 animate-[slideUp_0.28s_ease-out]">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
        >
          <X size={16} />
        </button>

        <div className="mb-5">
          <div className="w-11 h-11 bg-indigo-100 rounded-2xl flex items-center justify-center mb-3">
            {mode === "login" ? (
              <LogIn size={20} className="text-indigo-600" />
            ) : (
              <UserPlus size={20} className="text-indigo-600" />
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            {mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {mode === "login"
              ? "Chào mừng trở lại!"
              : "Tham gia để lưu hành trình của bạn"}
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
            <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-3 mb-5">
          <div className="relative">
            <Mail
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>
          <div className="relative">
            <Lock
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type={showPassword ? "text" : "password"}
              placeholder={
                mode === "register"
                  ? "Mật khẩu (tối thiểu 8 ký tự)"
                  : "Mật khẩu"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading || !email || !password}
          className="w-full bg-indigo-600 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-indigo-200"
        >
          {isLoading ? (
            <Loader2 size={17} className="animate-spin" />
          ) : mode === "login" ? (
            <>
              <LogIn size={17} /> Đăng nhập
            </>
          ) : (
            <>
              <UserPlus size={17} /> Tạo tài khoản
            </>
          )}
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          {mode === "login" ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
          <button
            onClick={() => switchMode(mode === "login" ? "register" : "login")}
            className="text-indigo-600 font-semibold hover:underline"
          >
            {mode === "login" ? "Đăng ký ngay" : "Đăng nhập"}
          </button>
        </p>
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }`}</style>
    </div>
  );
}

// ─── Logout Confirm ───────────────────────────────────────────────────────────

function LogoutConfirmModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-xs z-10">
        <div className="w-11 h-11 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <LogOut size={20} className="text-red-500" />
        </div>
        <h3 className="text-base font-bold text-gray-900 text-center mb-1">
          Đăng xuất?
        </h3>
        <p className="text-sm text-gray-500 text-center mb-5">
          Bạn sẽ cần đăng nhập lại để tiếp tục.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
          >
            Huỷ
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium text-sm hover:bg-red-600 transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Shared UI Primitives ─────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 mb-2">
      {children}
    </p>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
      {children}
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  iconBg = "bg-gray-100",
  iconColor = "text-gray-500",
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  icon: React.ElementType;
  iconBg?: string;
  iconColor?: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-3.5 ${disabled ? "opacity-40" : ""}`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}
        >
          <Icon size={17} className={iconColor} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          {description && (
            <p className="text-xs text-gray-400 mt-0.5 leading-tight">
              {description}
            </p>
          )}
        </div>
      </div>
      <label className="relative flex items-center cursor-pointer ml-3 shrink-0">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={() => !disabled && onChange()}
          disabled={disabled}
        />
        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-indigo-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm" />
      </label>
    </div>
  );
}

// ─── ProfileScreen ────────────────────────────────────────────────────────────

export function ProfileScreen() {
  const { user, isAuthenticated, logout } = useAuth();
  const { settings, updateSettings, resetSettings } = useSettings();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <>
      <div className="flex flex-col h-full bg-gray-50">
        {/* Header */}
        <div className="px-6 pt-6 pb-5 bg-white shadow-sm shrink-0">
          <h1 className="text-2xl font-bold text-gray-900">Hồ sơ & Cài đặt</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pt-5 pb-8 space-y-5">
          {/* ══ SECTION 1: Tài khoản ════════════════════════════════════════ */}
          <div>
            <SectionLabel>Tài khoản</SectionLabel>
            <Card>
              {isAuthenticated && user ? (
                <>
                  {/* Avatar + info */}
                  <div className="flex items-center gap-3 px-4 py-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                      <User size={22} className="text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {user.email?.split("@")[0]}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {user.email}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-500 px-2 py-1 rounded-lg shrink-0">
                      {user.role === "admin" ? "Admin" : "Member"}
                    </span>
                  </div>

                  {/* Sub-items — coming soon */}
                  {[
                    {
                      icon: Download,
                      label: "Audio đã tải offline",
                      value: "1.2 GB",
                    },
                    {
                      icon: CreditCard,
                      label: "Phương thức thanh toán",
                      value: "",
                    },
                    {
                      icon: ShieldCheck,
                      label: "Bảo mật tài khoản",
                      value: "",
                    },
                  ].map(({ icon: Icon, label, value }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between px-4 py-3.5 opacity-50 cursor-not-allowed select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                          <Icon size={16} className="text-gray-500" />
                        </div>
                        <span className="text-sm font-medium text-gray-800">
                          {label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {value && (
                          <span className="text-xs text-gray-400">{value}</span>
                        )}
                        <ChevronRight size={14} className="text-gray-300" />
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                /* ── Guest ── */
                <div className="px-4 py-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 bg-gray-100 rounded-full flex items-center justify-center">
                      <User size={20} className="text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-700">Khách</p>
                      <p className="text-xs text-gray-400">
                        Đăng nhập để lưu hành trình
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => setShowAuthModal(true)}
                      className="flex-1 bg-indigo-600 text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
                    >
                      <LogIn size={15} /> Đăng nhập
                    </button>
                    <button
                      onClick={() => setShowAuthModal(true)}
                      className="flex-1 bg-white text-indigo-600 text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 border-2 border-indigo-100 hover:bg-indigo-50 transition-colors"
                    >
                      <UserPlus size={15} /> Đăng ký
                    </button>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* ══ SECTION 2: Ngôn ngữ ═════════════════════════════════════════ */}
          <div>
            <SectionLabel>Ngôn ngữ nội dung</SectionLabel>
            <Card>
              <div className="px-4 py-4">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Globe size={17} className="text-blue-500" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    Ngôn ngữ hiển thị thuyết minh
                  </p>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {(Object.keys(LANGUAGES) as LangCode[]).map((code) => (
                    <button
                      key={code}
                      onClick={() => updateSettings({ language: code })}
                      className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        settings.language === code
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-[1.06]"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100 active:scale-95"
                      }`}
                    >
                      <span className="text-base leading-none">
                        {LANG_FLAGS[code]}
                      </span>
                      <span className="leading-none tracking-wide">
                        {code.toUpperCase()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* ══ SECTION 3: Phát lại & GPS ═══════════════════════════════════ */}
          <div>
            <SectionLabel>Phát lại & GPS</SectionLabel>
            <Card>
              <ToggleRow
                icon={Volume2}
                iconBg="bg-green-50"
                iconColor="text-green-500"
                label="Tự động phát Audio"
                description="Phát thuyết minh khi bước vào bán kính địa điểm"
                checked={settings.autoPlayAudio}
                onChange={() =>
                  updateSettings({ autoPlayAudio: !settings.autoPlayAudio })
                }
              />
              <ToggleRow
                icon={Zap}
                iconBg="bg-amber-50"
                iconColor="text-amber-500"
                label="GPS độ chính xác cao"
                description="Định vị chính xác hơn, tiêu hao pin nhiều hơn"
                checked={settings.highAccuracyGPS}
                onChange={() =>
                  updateSettings({ highAccuracyGPS: !settings.highAccuracyGPS })
                }
              />
            </Card>
          </div>

          {/* ══ SECTION 4: Giao diện ════════════════════════════════════════ */}
          <div>
            <SectionLabel>Giao diện</SectionLabel>
            <Card>
              <ToggleRow
                icon={Moon}
                iconBg="bg-slate-100"
                iconColor="text-slate-400"
                label="Chế độ tối"
                description="Sắp ra mắt"
                checked={settings.darkMode}
                onChange={() =>
                  updateSettings({ darkMode: !settings.darkMode })
                }
                disabled
              />
            </Card>
          </div>

          {/* ══ SECTION 5: Ứng dụng ═════════════════════════════════════════ */}
          <div>
            <SectionLabel>Ứng dụng</SectionLabel>
            <Card>
              <button
                onClick={resetSettings}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-orange-50 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                  <RotateCcw size={16} className="text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Đặt lại cài đặt
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Khôi phục tất cả về mặc định ban đầu
                  </p>
                </div>
              </button>
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                  <Info size={16} className="text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Vibe GPS Visitor
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Phiên bản 1.0.0 · © 2024
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* ══ Logout ══════════════════════════════════════════════════════ */}
          {isAuthenticated && (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full bg-white text-red-500 font-semibold py-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
            >
              <LogOut size={17} />
              Đăng xuất
            </button>
          )}
        </div>
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showLogoutConfirm && (
        <LogoutConfirmModal
          onConfirm={() => {
            logout();
            setShowLogoutConfirm(false);
          }}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </>
  );
}
