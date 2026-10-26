import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES === "true" ? "/crime-data-dashboard/" : "/",
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks: { charts: ["recharts"], markdown: ["react-markdown"] },
      },
    },
  },
});
