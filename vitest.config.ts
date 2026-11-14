import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { sourceAliases } from "./scripts/aliases.mjs";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: sourceAliases },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["packages/*/tests/**/*.test.{ts,tsx}", "tests/unit/**/*.test.{ts,tsx}"],
    css: false,
    coverage: {
      provider: "v8",
      include: ["packages/*/src/**/*.{ts,tsx}"],
      exclude: ["**/index.ts", "**/*.d.ts"],
    },
  },
});
