// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import path from "node:path";

// When BUILD_TARGET=electron, alias Supabase client to the local SQLite-backed shim
// so every page that imports "@/integrations/supabase/client" talks to the local DB.
const isElectron = process.env.BUILD_TARGET === "electron";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: isElectron
    ? {
        base: "./",
        resolve: {
          alias: [
            {
              find: /^@\/integrations\/supabase\/client$/,
              replacement: path.resolve(__dirname, "src/integrations/local/client.ts"),
            },
          ],
        },
      }
    : undefined,
});
