// Standalone Vite config for the Electron (CSR) build.
// Produces dist-electron/ with a static index.html that boots the router in the browser.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "node:path";

export default defineConfig({
  base: "./",
  root: path.resolve(process.cwd(), "electron-client"),
  publicDir: path.resolve(process.cwd(), "public"),
  plugins: [react(), tailwindcss(), tsconfigPaths({ root: process.cwd() })],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
    },
  },
  build: {
    outDir: path.resolve(process.cwd(), "dist-electron"),
    emptyOutDir: true,
    target: "es2022",
    sourcemap: false,
  },
});
