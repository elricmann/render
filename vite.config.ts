import path from "path";
import { transform } from "@babel/core";
import { defineConfig, UserConfig, Plugin } from "vite";

function renderLoaderPlugin(): Plugin {
  return {
    name: "render-jsx-transform",
    transform(code, id) {
      if (!/\.(jsx|tsx)$/.test(id)) return;

      const output = transform(code, {
        filename: id,
        presets: ["babel-preset-librender"],
      });

      return {
        code: output?.code || "",
        map: output?.map || null,
      };
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [renderLoaderPlugin()],
  esbuild: {
    jsx: "preserve" /*!*/,
  },
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
