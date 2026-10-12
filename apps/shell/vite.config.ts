import tailwind from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const gateway = process.env.GATEWAY_URL ?? "http://localhost:4000";

export default defineConfig({
  plugins: [react(), tailwind()],
  server: { proxy: { "/api": { target: gateway, ws: true }, "/brand": gateway } },
});
