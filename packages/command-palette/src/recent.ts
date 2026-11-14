const DEFAULT_KEY = "forge-ui:command-palette:recent";

export function readRecent(storageKey: string | null | undefined): string[] {
  if (storageKey === null || typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey ?? DEFAULT_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    // Storage can be blocked or corrupted. History is a convenience, so fail quietly.
    return [];
  }
}

export function writeRecent(storageKey: string | null | undefined, ids: string[]): void {
  if (storageKey === null || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey ?? DEFAULT_KEY, JSON.stringify(ids));
  } catch {
    /* ignore quota and privacy-mode errors */
  }
}

/** Moves `id` to the front, de-duplicates, and trims to `limit`. */
export function pushRecent(ids: string[], id: string, limit: number): string[] {
  return [id, ...ids.filter((existing) => existing !== id)].slice(0, limit);
}
