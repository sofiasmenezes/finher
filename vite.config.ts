import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
  // The single-file artifact inlines one script, so it can't load route chunks on demand.
  // Images are inlined there too, since the single file can't load them from the server.
  build: mode === "artifact" ? { assetsInlineLimit: 400_000, rolldownOptions: { output: { codeSplitting: false } } } : undefined,
}));
