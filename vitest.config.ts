import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "packages/**/src/**/*.{test,spec}.ts",
      "packages/**/src/**/*.{test,spec}.tsx"
    ],
    exclude: ["**/node_modules/**", "**/dist/**"],
    environment: "node",
    globals: true
  }
});
