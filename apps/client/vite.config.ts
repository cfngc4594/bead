import path from "node:path";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import {
  createThemeBootstrapScript,
  createThemeCriticalStyles,
} from "./src/config/theme";

function themeBootstrapPlugin(): Plugin {
  return {
    name: "bead-theme-bootstrap",
    transformIndexHtml: {
      order: "pre",
      handler: () => [
        {
          tag: "style",
          children: createThemeCriticalStyles(),
          injectTo: "head-prepend",
        },
        {
          tag: "script",
          children: createThemeBootstrapScript(),
          injectTo: "head-prepend",
        },
      ],
    },
  };
}

export default defineConfig({
  root: __dirname,
  base: "./",
  envDir: path.resolve(__dirname, "../.."),
  plugins: [
    themeBootstrapPlugin(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    chunkSizeWarningLimit: 1000,
    outDir: "out",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        app: path.resolve(__dirname, "index.html"),
      },
    },
  },
});
