import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

const isGitHubPages = !!process.env.GITHUB_PAGES;
const basePath = isGitHubPages ? '/meu-calend-rio-brasil/' : '/';

export default defineConfig(({ mode }) => ({
  base: basePath,
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "icon-192.png", "icon-512.png"],
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        navigateFallbackDenylist: [/^\/~oauth/],
      },
      manifest: {
        name: "Calendario do Zaqueu",
        short_name: "ZaqueuCal",
        description: "Seu calendário brasileiro completo com feriados e fases da lua",
        theme_color: "#16a34a",
        background_color: "#fefdf8",
        display: "standalone",
        orientation: "portrait",
        start_url: basePath,
        scope: basePath,
        icons: [
          {
            src: `${basePath}icon-192.png`,
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: `${basePath}icon-512.png`,
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: `${basePath}icon-512.png`,
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));