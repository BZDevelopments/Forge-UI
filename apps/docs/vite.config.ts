import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { packageNames } from "../../scripts/aliases.mjs";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)), "../..");

export default defineConfig({
  // Set DOCS_BASE=/forge-ui/ when hosting under a sub-path such as GitHub Pages.
  base: process.env.DOCS_BASE ?? "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    // Run the docs against package source so edits show up instantly and no prior build is needed.
    alias: [
      ...packageNames.flatMap((name) => [
        {
          find: new RegExp(`^@forge-ui/${name}/styles\\.css$`),
          replacement: resolve(root, `packages/${name}/src/styles.css`),
        },
        {
          find: new RegExp(`^@forge-ui/${name}$`),
          replacement: resolve(root, `packages/${name}/src/index.ts`),
        },
      ]),
      {
        find: /^@forge-ui\/core\/tokens\.css$/,
        replacement: resolve(root, "packages/core/src/tokens.css"),
      },
    ],
  },
  server: { fs: { allow: [root] } },
  // One bundle on purpose: manual vendor chunks can create circular chunk imports.
  build: { sourcemap: true, chunkSizeWarningLimit: 800 },
});
