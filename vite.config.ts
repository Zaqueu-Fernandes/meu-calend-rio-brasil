import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  // Se estiver em produção (build), usa o caminho do github. 
  // Se estiver em desenvolvimento (dev), usa a raiz '/'.
  base: mode === 'production' ? '/meu-calend-rio-brasil/' : '/',
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
      includeAssets: ["favicon.ico"],
      manifest: {
        name: "Calendario do Zaqueu",
        short_name: "ZaqueuCal", // Nome curto para não cortar no ícone do celular
        description: "Seu calendário brasileiro completo com feriados e fases da lua",
        theme_color: "#16a34a",
        background_color: "#fefdf8",
        display: "standalone",
        orientation: "portrait",
        // Ajustado para o subdiretório do GitHub Pages
        start_url: "/meu-calend-rio-brasil/",
        icons: [
          {
            src: "/meu-calend-rio-brasil/favicon.ico",
            sizes: "64x64",
            type: "image/x-icon",
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