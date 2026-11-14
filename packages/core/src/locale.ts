const FALLBACK = "en-US";

function usable(tag: string): boolean {
  try {
    new Intl.DateTimeFormat(tag);
    return true;
  } catch {
    return false;
  }
}

/** Turns POSIX-style tags such as `en_US.UTF-8` or `en-US@posix` into BCP 47 (`en-US`). */
function normalize(tag: string): string {
  return tag.replace(/_/g, "-").split(/[@.]/)[0] ?? tag;
}

/**
 * Picks a locale that `Intl` accepts. Tries the requested one, then the browser's languages, then `en-US`.
 * Some systems report tags like `en-US@posix`, and `Intl` throws on those, which would otherwise crash a render.
 */
export function resolveLocale(requested?: string): string {
  const browser =
    typeof navigator !== "undefined" ? [...(navigator.languages ?? []), navigator.language] : [];
  for (const candidate of [requested, ...browser]) {
    if (!candidate) continue;
    if (usable(candidate)) return candidate;
    const cleaned = normalize(candidate);
    if (cleaned && usable(cleaned)) return cleaned;
  }
  return FALLBACK;
}
