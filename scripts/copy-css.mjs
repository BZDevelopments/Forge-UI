// Copies every stylesheet in `src/` next to the built JavaScript, e.g. `dist/styles.css`.
import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const src = resolve(process.cwd(), "src");
const dist = resolve(process.cwd(), "dist");

if (existsSync(src)) {
  const stylesheets = readdirSync(src).filter((file) => file.endsWith(".css"));
  if (stylesheets.length > 0) mkdirSync(dist, { recursive: true });
  for (const file of stylesheets) cpSync(resolve(src, file), resolve(dist, file));
}
