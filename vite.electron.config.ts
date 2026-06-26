import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import path from "node:path";

// Standalone SPA build for Electron desktop bundle.
// Bypasses TanStack Start / Nitro and produces a static dist-spa/index.html
// that Electron can load via file://.
export default defineConfig({
  base: "./",
  plugins: [
    TanStackRouterVite({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: "src/routes",
      generatedRouteTree: "src/routeTree.gen.ts",
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "src") },
      {
        find: /^@\/integrations\/supabase\/client$/,
        replacement: path.resolve(__dirname, "src/integrations/local/client.ts"),
      },
      {
        find: /^@\/lib\/admin-users\.functions$/,
        replacement: path.resolve(__dirname, "src/electron-stubs/admin-users.ts"),
      },
      {
        find: /^@tanstack\/react-start$/,
        replacement: path.resolve(__dirname, "src/electron-stubs/tanstack-start.ts"),
      },
      {
        find: /^@tanstack\/start-server-core$/,
        replacement: path.resolve(__dirname, "src/electron-stubs/tanstack-start.ts"),
      },
    ],
  },
  build: {
    outDir: "dist-spa",
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "electron-index.html"),
    },
  },
});
