import type { UploaderMessages } from "./types";

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value >= 10 || Number.isInteger(value) ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
}

/** Matches a file against `accept` entries. Supports `type/subtype`, `type/*`, and `.ext`. */
export function matchesAccept(
  file: Pick<File, "name" | "type">,
  accept: string[] | undefined,
): boolean {
  if (!accept || accept.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return accept.some((raw) => {
    const rule = raw.trim().toLowerCase();
    if (!rule) return false;
    if (rule.startsWith(".")) return name.endsWith(rule);
    if (rule.endsWith("/*")) return type.startsWith(rule.slice(0, -1));
    return type === rule;
  });
}

export const defaultMessages: UploaderMessages = {
  invalidType: (file, accept) =>
    `${file.name} is not an accepted file type. Accepted: ${accept.join(", ")}.`,
  tooLarge: (file, maxSize) => `${file.name} is too large. The limit is ${formatBytes(maxSize)}.`,
  tooSmall: (file, minSize) => `${file.name} is too small. The minimum is ${formatBytes(minSize)}.`,
  tooMany: (file, maxFiles) =>
    `${file.name} was not added. You can upload up to ${maxFiles} ${maxFiles === 1 ? "file" : "files"}.`,
  uploadFailed: (file) => `${file.name} could not be uploaded.`,
};
