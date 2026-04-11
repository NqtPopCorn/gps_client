import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        // Báo cho Vite biết mình sẽ dùng file SW tự viết
        strategies: "injectManifest",

        // Trỏ đúng vào thư mục và tên file TS của bạn
        srcDir: "src",
        filename: "lib/serviceWorker.ts",

        // Tự động update SW khi có phiên bản mới
        registerType: "autoUpdate",

        injectManifest: {
          // Mặc định Workbox bắt buộc file SW phải có biến self.__WB_MANIFEST
          // Vì bạn tự viết logic cache riêng (không dùng Workbox precache),
          // ta set undefined để tắt cảnh báo/lỗi lúc build.
          injectionPoint: undefined,
        },

        // CẤU HÌNH QUAN TRỌNG NHẤT ĐỂ TEST OFFLINE LÚC DEV
        devOptions: {
          enabled: true, // Bật SW kể cả khi chạy localhost (npm run dev)
          type: "module", // Trình duyệt hiện đại hỗ trợ SW dạng ES Module
        },

        // Cấu hình file manifest (Cài đặt app ra màn hình chính)
        manifest: {
          name: "GPS Tour App",
          short_name: "TourOffline",
          theme_color: "#ffffff",
          // Bạn có thể bổ sung mảng icons vào đây sau...
        },
      }),
    ],
    define: {
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== "true",
    },
  };
});
