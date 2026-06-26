// Electron build: TanStack Start + Nitro node-server preset (runs as local HTTP server inside Electron).
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: { base: "/" },
  tanstackStart: { server: { entry: "server" } },
  nitro: {
    preset: "node-server",
    output: {
      dir: "dist-electron-server",
      serverDir: "dist-electron-server/server",
      publicDir: "dist-electron-server/public",
    },
  },
});
