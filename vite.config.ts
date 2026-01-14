import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],  // ✅ Removeu o plugin Dyad
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {  // ✅ Adicionou configuração de build
    outDir: "dist",
    sourcemap: false,
  },
}));
