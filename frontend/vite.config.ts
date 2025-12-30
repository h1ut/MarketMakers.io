import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  // Для GitHub Pages: https://h1ut.github.io/MarketMakers.io/
  // base должен быть ОТНОСИТЕЛЬНЫМ путем, а не полным URL!
  base: process.env.NODE_ENV === "production" ? "/MarketMakers.io/" : "/",
  server: {
    port: 5173
  }
});

