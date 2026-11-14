// One-off helper used to keep every package.json, tsconfig, and tsup config consistent.
// Run with `node scripts/generate-packages.mjs` after adding or renaming a package.
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const version = "0.1.0";

const packages = {
  core: {
    description: "Design tokens, hooks, and shared primitives used by every Forge UI component.",
    keywords: ["design-tokens", "hooks", "react"],
    dependencies: {},
  },
  "data-table": {
    description:
      "Sortable, filterable, virtualized data table with server-side data, pinning, and keyboard navigation.",
    keywords: ["data-table", "datagrid", "table", "virtualized"],
    dependencies: { "@tanstack/react-table": "^8.20.5", "@tanstack/react-virtual": "^3.10.8" },
  },
  "command-palette": {
    description:
      "Accessible command palette with fuzzy search, nested commands, async results, and recent history.",
    keywords: ["command-palette", "cmdk", "spotlight", "fuzzy-search"],
    dependencies: { "@radix-ui/react-dialog": "^1.1.2" },
  },
  "file-uploader": {
    description:
      "Adapter-based file uploader with validation, previews, progress, retry, cancel, and pause/resume.",
    keywords: ["file-upload", "dropzone", "drag-and-drop"],
    dependencies: {},
  },
  form: {
    description:
      "Schema-driven form system with multi-step flows, conditional fields, field arrays, and async validation.",
    keywords: ["forms", "validation", "react-hook-form", "standard-schema"],
    dependencies: { "react-hook-form": "^7.53.0" },
  },
  combobox: {
    description:
      "Accessible combobox with async options, grouping, custom rendering, and virtualized large lists.",
    keywords: ["combobox", "autocomplete", "select"],
    dependencies: { "@radix-ui/react-popover": "^1.1.2", "@tanstack/react-virtual": "^3.10.8" },
  },
  "multi-select": {
    description:
      "Multi-select built on the Forge UI combobox with removable tags, grouping, and async options.",
    keywords: ["multi-select", "tags", "select"],
    dependencies: {},
  },
  "date-range-picker": {
    description:
      "Date and date-range picker with constraints, keyboard navigation, and locale-aware formatting.",
    keywords: ["date-picker", "date-range", "calendar"],
    dependencies: { "@radix-ui/react-popover": "^1.1.2" },
  },
  notifications: {
    description:
      "Toast notifications with promise helpers, undo actions, progress, queues, and screen-reader announcements.",
    keywords: ["toast", "notifications", "snackbar"],
    dependencies: {},
  },
  "activity-timeline": {
    description:
      "Activity timeline with grouped events, avatars, metadata, and custom event rendering.",
    keywords: ["timeline", "activity-feed", "audit-log"],
    dependencies: {},
  },
  "kanban-board": {
    description:
      "Kanban board with pointer and keyboard drag and drop, card actions, and persistence callbacks.",
    keywords: ["kanban", "drag-and-drop", "board"],
    dependencies: {
      "@dnd-kit/core": "^6.1.0",
      "@dnd-kit/sortable": "^8.0.0",
      "@dnd-kit/utilities": "^3.2.2",
    },
  },
};

// Packages that depend on other Forge UI packages.
const internal = {
  "data-table": ["core"],
  "command-palette": ["core"],
  "file-uploader": ["core"],
  form: ["core"],
  combobox: ["core"],
  "multi-select": ["core", "combobox"],
  "date-range-picker": ["core"],
  notifications: ["core"],
  "activity-timeline": ["core"],
  "kanban-board": ["core"],
};

for (const [name, meta] of Object.entries(packages)) {
  const dir = resolve(root, "packages", name);
  mkdirSync(resolve(dir, "src"), { recursive: true });
  mkdirSync(resolve(dir, "tests"), { recursive: true });

  const deps = { ...meta.dependencies };
  for (const dep of internal[name] ?? []) deps[`@forge-ui/${dep}`] = "workspace:^";

  const pkg = {
    name: `@forge-ui/${name}`,
    version,
    description: meta.description,
    keywords: ["forge-ui", "react", "accessible", "typescript", ...meta.keywords],
    license: "MIT",
    author: "BZDevelopments (https://github.com/bzdevelopments)",
    homepage: `https://github.com/bzdevelopments/forge-ui/tree/main/packages/${name}#readme`,
    repository: {
      type: "git",
      url: "git+https://github.com/bzdevelopments/forge-ui.git",
      directory: `packages/${name}`,
    },
    bugs: { url: "https://github.com/bzdevelopments/forge-ui/issues" },
    type: "module",
    sideEffects: ["**/*.css"],
    main: "./dist/index.cjs",
    module: "./dist/index.js",
    types: "./dist/index.d.ts",
    exports: {
      ".": {
        import: { types: "./dist/index.d.ts", default: "./dist/index.js" },
        require: { types: "./dist/index.d.cts", default: "./dist/index.cjs" },
      },
      "./styles.css": "./dist/styles.css",
      "./package.json": "./package.json",
    },
    files: ["dist", "README.md"],
    publishConfig: { access: "public" },
    scripts: {
      build: "tsup && node ../../scripts/copy-css.mjs",
      clean: "rm -rf dist",
    },
    dependencies: deps,
    peerDependencies: { react: ">=18", "react-dom": ">=18" },
  };
  if (name === "core") {
    pkg.exports["./tokens.css"] = "./dist/tokens.css";
    pkg.exports["./tailwind-preset"] = {
      import: "./dist/tailwind-preset.js",
      require: "./dist/tailwind-preset.cjs",
    };
  }
  writeFileSync(resolve(dir, "package.json"), JSON.stringify(pkg, null, 2) + "\n");

  const entries =
    name === "core" ? `["src/index.ts", "src/tailwind-preset.ts"]` : `["src/index.ts"]`;
  writeFileSync(
    resolve(dir, "tsup.config.ts"),
    `import { defineConfig } from "tsup";

export default defineConfig({
  entry: ${entries},
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom", "react/jsx-runtime", /^@forge-ui\\//],
  banner: { js: '"use client";' },
});
`,
  );
  writeFileSync(
    resolve(dir, "tsconfig.json"),
    JSON.stringify(
      {
        extends: "../../tsconfig.base.json",
        compilerOptions: {
          noEmit: true,
          baseUrl: ".",
          paths: Object.fromEntries(
            Object.keys(packages).map((p) => [`@forge-ui/${p}`, [`../${p}/src/index.ts`]]),
          ),
        },
        include: ["src"],
      },
      null,
      2,
    ) + "\n",
  );
}
console.log("packages generated");
