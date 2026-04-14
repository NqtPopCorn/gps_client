import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useI18n } from "../contexts/I18nContext";

export function RegisterScreen() {
  const navigate = useNavigate();
  const { register, login, isLoading, error } = useAuth();
  const { t } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    // Validate phía Client
    if (password.length < 8) {
      setValidationError("Mật khẩu phải chứa ít nhất 8 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setValidationError("Mật khẩu xác nhận không khớp.");
      return;
    }

    // Gọi API Đăng ký
    const user = await register({ email, password });

    // Nếu đăng ký thành công, tự động Đăng nhập luôn
    if (user) {
      const loginSuccess = await login({ email, password });
      if (loginSuccess) {
        navigate("/", { replace: true });
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t("auth.register.title")}
          </h1>
          <p className="text-gray-500 text-sm">{t("auth.register.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Lỗi từ Form (Client) hoặc từ API (Server) */}
          {(validationError || error) && (
            <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm text-center">
              {validationError || error || t("auth.register.error")}
            </div>
          )}

          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 ml-1">
              {t("auth.register.emailLabel")}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail size={18} className="text-gray-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-gray-900"
                placeholder="name@example.com"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 ml-1">
              {t("auth.register.passwordLabel")}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-gray-900"
                placeholder={t("auth.register.passwordHint")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 ml-1">
              {t("auth.register.confirmPasswordLabel")}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-gray-900"
                placeholder={t("auth.register.confirmPasswordLabel")}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !email || !password || !confirmPassword}
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none mt-6"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              t("auth.register.submit")
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-8">
          {t("auth.register.cta")}{" "}
          <Link
            to="/login"
            className="font-semibold text-indigo-600 hover:underline"
          >
            {t("auth.register.ctaAction")}
          </Link>
        </p>
      </div>
    </div>
  );
}
