import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";

// Build SPA bundle for Electron (no TanStack Start SSR, no server functions).
export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@/integrations/supabase/client": path.resolve(__dirname, "src/integrations/local/client.ts"),
      // Stub server-only modules so they don't pull node deps
      "@/integrations/supabase/client.server": path.resolve(__dirname, "src/integrations/local/stub.ts"),
      "@/integrations/supabase/auth-middleware": path.resolve(__dirname, "src/integrations/local/stub.ts"),
      "@/integrations/supabase/auth-attacher": path.resolve(__dirname, "src/integrations/local/stub.ts"),
      "@tanstack/react-start": path.resolve(__dirname, "src/integrations/local/start-shim.ts"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "electron/index.html"),
    },
  },
});
