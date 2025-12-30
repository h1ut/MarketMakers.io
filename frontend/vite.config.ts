import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  // Для GitHub Pages: https://h1ut.github.io/MarketMakers.io/
  //base: process.env.NODE_ENV === "production" ? "/MarketMakers.io/" : "/",
  base: "https://h1ut.github.io/MarketMakers.io/",
  server: {
    port: 5173
  }
});

