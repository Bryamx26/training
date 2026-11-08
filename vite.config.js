import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || "http://localhost:4000";

// Cache des données de l'API (lectures uniquement) : réseau d'abord, cache si
// le réseau ne répond pas. Une séance déjà ouverte reste consultable et
// lançable hors connexion. Vidé à la déconnexion (voir AuthContext).
const API_CACHE = "api-data";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/apple-touch-icon.png"],
      manifest: {
        name: "Sport Track",
        short_name: "Sport Track",
        description: "Séances, suivi et progression entre coachs et sportifs.",
        lang: "fr",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#161b26",
        theme_color: "#161b26",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Polices auto-hébergées comprises, pour un affichage correct hors ligne.
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: ({ url, request }) =>
              request.method === "GET" &&
              url.pathname.startsWith("/api/") &&
              !url.pathname.startsWith("/api/auth/") &&
              // Export RGPD : données complètes du compte, jamais gardées en cache.
              url.pathname !== "/api/me/export",
            handler: "NetworkFirst",
            options: {
              cacheName: API_CACHE,
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    host: true,
    proxy: {
      "/api": {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
  test: {
    include: ["src/**/*.test.js"],
  },
});
