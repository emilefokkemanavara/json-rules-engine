import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.mts"],
  sourcemap: true,
  format: ["esm", "cjs"],
  target: ["es2015"],
  cjsInterop: true,
});
