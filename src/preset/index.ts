// Copyright (c) 2024 Elric Neumann. All rights reserved. MIT license.
import { TransformOptions } from "@babel/core";
import transformJSXPlugin from "./transform-jsx";

export default function () {
  return {
    plugins: ["@babel/plugin-syntax-jsx", transformJSXPlugin],
  } satisfies TransformOptions;
}
