import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
      },
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: 'Nexor Admin',
        short_name: 'Nexor',
        description: 'Painel administrativo da Nexor Technology.',
        theme_color: '#091126',
        background_color: '#091126',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/branding/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/branding/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
}));