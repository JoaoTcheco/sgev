// PharmaSys Desktop - Vite SPA build (sem TanStack Start / SSR).
// Output: electron/dist/. Carregado por Electron via file://.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import path from "node:path";

export default defineConfig({
  base: "./",
  root: path.resolve(__dirname, "electron/spa"),
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: false,
      routesDirectory: path.resolve(__dirname, "src/routes"),
      generatedRouteTree: path.resolve(__dirname, "src/routeTree.gen.ts"),
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    "process.env": "{}",
  },
  build: {
    outDir: path.resolve(__dirname, "electron/dist"),
    emptyOutDir: true,
    target: "chrome120",
    sourcemap: false,
    rollupOptions: {
      // Browser-only build — exclude server-only modules
      external: [],
    },
  },
});
