import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    port: 5173,
    // Everything under /api goes to Django, so the browser sees ONE origin.
    // That is what makes the session + CSRF cookies work with no CORS setup.
    proxy: { "/api": "http://localhost:8000" },
  },
});