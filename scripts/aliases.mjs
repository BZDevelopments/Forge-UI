import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export const packageNames = [
  "core",
  "data-table",
  "command-palette",
  "file-uploader",
  "form",
  "combobox",
  "multi-select",
  "date-range-picker",
  "notifications",
  "activity-timeline",
  "kanban-board",
];

/** Maps `@forge-ui/*` to package sources so tests and the docs app never need a prior build. */
export const sourceAliases = Object.fromEntries(
  packageNames.map((name) => [
    `@forge-ui/${name}`,
    resolve(root, "packages", name, "src/index.ts"),
  ]),
);
