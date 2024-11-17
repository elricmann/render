import path from "path";
import { defineConfig, UserConfig } from "vite";
import babel from "vite-plugin-babel";
// @ts-ignore
import preset from "./src/preset";

export default defineConfig({
  base: "./",
  plugins: [
    babel({
      babelConfig: {
        presets: [preset],
      },
    }),
  ],
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
