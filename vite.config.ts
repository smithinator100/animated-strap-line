import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@ddg-motion/animated-headline": path.resolve(
        __dirname,
        "packages/animated-headline/src/index.ts",
      ),
    },
  },
});
