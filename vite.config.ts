import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/japan/",
  build: { outDir: "docs", emptyOutDir: true, rollupOptions: { input: { main: "index.html", mapOptions: "map-options.html" } } },
  plugins: [react()],
});
