import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import path from "node:path";

// Standalone SPA build for Electron desktop bundle.
// Bypasses TanStack Start / Nitro and produces a static dist-spa/index.html
// that Electron can load via file://.
// Force-stub files that are server-only — Rollup load hook returns an inert module.
const STUBBED = new Set([
  path.resolve(__dirname, "src/integrations/supabase/auth-middleware.ts"),
  path.resolve(__dirname, "src/integrations/supabase/auth-attacher.ts"),
  path.resolve(__dirname, "src/integrations/supabase/client.server.ts"),
  path.resolve(__dirname, "src/server.ts"),
  path.resolve(__dirname, "src/start.ts"),
  path.resolve(__dirname, "src/lib/error-capture.ts"),
  path.resolve(__dirname, "src/lib/config.server.ts"),
]);

export default defineConfig({
  base: "./",
  plugins: [
    {
      name: "electron-server-stubs",
      enforce: "pre",
      resolveId(source) {
        if (source.endsWith("auth-middleware") || source.endsWith("auth-attacher") || source.endsWith("client.server") || source.includes("/integrations/supabase/auth-middleware") || source.includes("/integrations/supabase/auth-attacher") || source.includes("/integrations/supabase/client.server")) {
          return "\0electron-stub:" + source;
        }
      },
      load(id) {
        if (id.startsWith("\0electron-stub:")) {
          return "export default {}; export const requireSupabaseAuth = undefined; export const attachSupabaseAuth = undefined; export const supabaseAdmin = undefined;";
        }
      },
    },
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
      { find: /^@tanstack\/react-start.*/, replacement: path.resolve(__dirname, "src/electron-stubs/tanstack-start.ts") },
      { find: /^@tanstack\/start-.*/, replacement: path.resolve(__dirname, "src/electron-stubs/tanstack-start.ts") },
      { find: path.resolve(__dirname, "src/integrations/supabase/auth-middleware.ts"), replacement: path.resolve(__dirname, "src/electron-stubs/tanstack-start.ts") },
      { find: path.resolve(__dirname, "src/integrations/supabase/auth-attacher.ts"), replacement: path.resolve(__dirname, "src/electron-stubs/tanstack-start.ts") },
      { find: path.resolve(__dirname, "src/integrations/supabase/client.server.ts"), replacement: path.resolve(__dirname, "src/electron-stubs/empty.ts") },
      { find: /^@\/integrations\/supabase\/auth-middleware$/, replacement: path.resolve(__dirname, "src/electron-stubs/tanstack-start.ts") },
      { find: /^@\/integrations\/supabase\/auth-attacher$/, replacement: path.resolve(__dirname, "src/electron-stubs/tanstack-start.ts") },
      { find: /^@\/integrations\/supabase\/client\.server$/, replacement: path.resolve(__dirname, "src/electron-stubs/empty.ts") },
      { find: /^@\/integrations\/supabase\/types$/, replacement: path.resolve(__dirname, "src/electron-stubs/empty.ts") },
      { find: /^@\/lib\/api\/.*\.functions$/, replacement: path.resolve(__dirname, "src/electron-stubs/empty.ts") },
      // Node built-ins pulled in by TanStack router-core SSR helpers — stub for SPA.
      { find: "node:stream", replacement: path.resolve(__dirname, "src/electron-stubs/empty.ts") },
      { find: "node:stream/web", replacement: path.resolve(__dirname, "src/electron-stubs/empty.ts") },
      { find: "node:async_hooks", replacement: path.resolve(__dirname, "src/electron-stubs/empty.ts") },
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
