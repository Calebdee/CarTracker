// @ts-nocheck
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";
import express from "express";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "serve-images",
      configurePreviewServer(server) {
        const app = server.middlewares;
        app.use(
          "/images",
          express.static("/app/images", {
            setHeaders: (res) => {
              res.setHeader(
                "Cache-Control",
                "no-store, no-cache, must-revalidate, proxy-revalidate"
              );
              res.setHeader("Pragma", "no-cache");
              res.setHeader("Expires", "0");
            },
          })
        );
      },
    },
  ],

  server: {
    port: 3001,
    host: "0.0.0.0",
    allowedHosts: ["cars.johnsoncabin.com"],

    /**
     * The proxy here ONLY works during dev.
     * Synology reverse proxy handles it in production.
     */
    proxy: {
      "/api": {
        target: "http://cars-backend:5002", // changed to the right port
        changeOrigin: true,
      },
       "/uploads": {
        target: "http://cars-backend:5002",
        changeOrigin: true,
      },
    },
  

    fs: {
      allow: [
        resolve(__dirname, "public"),
        "/app/images",
        "/usr/share/nginx/html/images",
      ],
    },
  },

  preview: {
    port: 3001,
    host: "0.0.0.0",
    allowedHosts: ["cars.johnsoncabin.com"],
  },
});
