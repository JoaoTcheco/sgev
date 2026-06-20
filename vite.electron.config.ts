import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

const stub = path.resolve(__dirname, "src/integrations/local/stub.ts");
const startShim = path.resolve(__dirname, "src/integrations/local/start-shim.ts");

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: /^@\/integrations\/supabase\/client$/, replacement: path.resolve(__dirname, "src/integrations/local/client.ts") },
      { find: /^@\/integrations\/supabase\/client\.server$/, replacement: stub },
      { find: /^@\/integrations\/supabase\/auth-middleware$/, replacement: stub },
      { find: /^@\/integrations\/supabase\/auth-attacher$/, replacement: stub },
      { find: /^@\/lib\/admin-users\.functions$/, replacement: path.resolve(__dirname, "src/integrations/local/admin-users.ts") },
      { find: /^@tanstack\/react-start\/server$/, replacement: stub },
      { find: /^@tanstack\/react-start$/, replacement: startShim },
      { find: "@", replacement: path.resolve(__dirname, "src") },
    ],
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "electron/index.html"),
    },
  },
});
