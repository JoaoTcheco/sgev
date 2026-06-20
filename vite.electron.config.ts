import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

const STUB = path.resolve(__dirname, "src/integrations/local/stub.ts");
const START_SHIM = path.resolve(__dirname, "src/integrations/local/start-shim.ts");
const CLIENT_SHIM = path.resolve(__dirname, "src/integrations/local/client.ts");
const ADMIN_SHIM = path.resolve(__dirname, "src/integrations/local/admin-users.ts");

const REWRITES: Record<string, string> = {
  "@/integrations/supabase/client": CLIENT_SHIM,
  "@/integrations/supabase/client.server": STUB,
  "@/integrations/supabase/auth-middleware": STUB,
  "@/integrations/supabase/auth-attacher": STUB,
  "@/lib/admin-users.functions": ADMIN_SHIM,
  "@tanstack/react-start": START_SHIM,
  "@tanstack/react-start/server": STUB,
};

function rewritePlugin(): Plugin {
  return {
    name: "electron-rewrites",
    enforce: "pre",
    resolveId(id) {
      if (REWRITES[id]) return REWRITES[id];
      return null;
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [rewritePlugin(), react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: { input: path.resolve(__dirname, "electron/index.html") },
  },
});
