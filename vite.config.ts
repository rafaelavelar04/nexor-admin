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
      registerType: 'autoUpdate', // Atualiza automaticamente em segundo plano
      workbox: {
        skipWaiting: true, // Ativa o novo service worker imediatamente
        clientsClaim: true, // Assume o controle da página imediatamente
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
            src: '/branding/nexor-icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/branding/nexor-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/branding/nexor-icon-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
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