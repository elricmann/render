import path from "path";
import { defineConfig, UserConfig } from "vite";

export default defineConfig({
  base: "./",
  plugins: [],
  build: {
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "render",
      formats: ["es", "cjs", "umd", "iife"],
      fileName: (format) => `index.${format}.js`,
    },
  },
} satisfies UserConfig);
