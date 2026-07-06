import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  const apiPort = env.API_PORT || env.PORT || "3000";
  const apiTarget = env.VITE_API_PROXY_TARGET || `http://localhost:${apiPort}`;

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@/": `${resolve(__dirname, "src")}/`,
      },
    },
    server: {
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
