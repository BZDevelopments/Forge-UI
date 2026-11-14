// Packs every package, installs the tarballs into an empty project, and imports each one
// as ESM and CommonJS. It catches broken `exports`, missing files, and undeclared dependencies
// that a workspace install hides.
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { packageNames } from "./aliases.mjs";

const root = resolve(import.meta.dirname, "..");
const work = mkdtempSync(join(tmpdir(), "forge-consumer-"));
const tarballs = join(work, "tarballs");
const project = join(work, "app");
mkdirSync(tarballs);
mkdirSync(project);

const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, stdio: ["ignore", "pipe", "inherit"], encoding: "utf8" });

console.log("Packing…");
const files = {};
for (const name of packageNames) {
  const dir = join(root, "packages", name);
  if (!existsSync(join(dir, "dist", "index.js")))
    throw new Error(`packages/${name} is not built. Run pnpm build:packages first.`);
  run("pnpm", ["pack", "--pack-destination", tarballs], dir);
}
for (const file of readdirSync(tarballs)) {
  const match = /^forge-ui-(.+)-\d+\.\d+\.\d+.*\.tgz$/.exec(file);
  if (match) files[`@forge-ui/${match[1]}`] = join(tarballs, file);
}
if (Object.keys(files).length !== packageNames.length)
  throw new Error(`Expected ${packageNames.length} tarballs, found ${Object.keys(files).length}`);

// `overrides` points internal dependencies at the local tarballs, since nothing is on npm yet.
const pkg = {
  name: "forge-consumer-check",
  private: true,
  version: "0.0.0",
  dependencies: {
    react: "^18.3.1",
    "react-dom": "^18.3.1",
    ...Object.fromEntries(Object.entries(files).map(([n, f]) => [n, `file:${f}`])),
  },
  overrides: Object.fromEntries(Object.entries(files).map(([n, f]) => [n, `file:${f}`])),
};
writeFileSync(join(project, "package.json"), JSON.stringify(pkg, null, 2));

console.log("Installing into a clean project…");
run("npm", ["install", "--no-audit", "--no-fund", "--loglevel=error"], project);

const names = Object.keys(files);
writeFileSync(
  join(project, "check.mjs"),
  `import { createRequire } from "node:module";
import { existsSync } from "node:fs";
const require = createRequire(import.meta.url);
const names = ${JSON.stringify(names)};
let failed = false;
for (const name of names) {
  const esm = await import(name);
  const cjs = require(name);
  const esmKeys = Object.keys(esm).filter((k) => k !== "default").sort();
  const cjsKeys = Object.keys(cjs).filter((k) => k !== "default").sort();
  if (esmKeys.length === 0) { console.error(name, "has no ESM exports"); failed = true; }
  if (JSON.stringify(esmKeys) !== JSON.stringify(cjsKeys)) { console.error(name, "ESM and CJS exports differ"); failed = true; }
  const css = name === "@forge-ui/core" ? ["styles.css", "tokens.css"] : ["styles.css"];
  for (const file of css) {
    try { require.resolve(name + "/" + file); } catch { console.error(name, "is missing", file); failed = true; }
  }
  console.log("ok", name, esmKeys.length + " exports");
}
const preset = await import("@forge-ui/core/tailwind-preset");
if (!preset.default?.theme) { console.error("tailwind preset is missing a theme"); failed = true; }
process.exit(failed ? 1 : 0);
`,
);
run("node", ["check.mjs"], project);

// Type declarations must resolve too.
writeFileSync(
  join(project, "types.ts"),
  names.map((n, i) => `import * as m${i} from "${n}";\nvoid m${i};`).join("\n") +
    `\nimport { DataTable } from "@forge-ui/data-table";\nimport { Toaster, notify } from "@forge-ui/notifications";\nvoid DataTable; void Toaster; void notify;\n`,
);
writeFileSync(
  join(project, "tsconfig.json"),
  JSON.stringify({
    compilerOptions: {
      strict: true,
      module: "ESNext",
      moduleResolution: "Bundler",
      jsx: "react-jsx",
      noEmit: true,
      skipLibCheck: false,
      target: "ES2022",
      types: [],
    },
    include: ["types.ts"],
  }),
);
run(
  "npm",
  [
    "install",
    "--no-audit",
    "--no-fund",
    "--loglevel=error",
    "-D",
    "typescript@5",
    "@types/react@18",
    "@types/react-dom@18",
  ],
  project,
);
run(join(project, "node_modules", ".bin", "tsc"), ["-p", "."], project);
console.log("Type declarations resolve.");
console.log(`Consumer check passed (${work}).`);
