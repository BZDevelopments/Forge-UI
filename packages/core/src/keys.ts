export interface ParsedShortcut {
  key: string;
  mod: boolean;
  ctrl: boolean;
  meta: boolean;
  alt: boolean;
  shift: boolean;
}

/** Parses strings such as `mod+k` or `ctrl+shift+p`. `mod` is Cmd on Apple devices and Ctrl elsewhere. */
export function parseShortcut(shortcut: string): ParsedShortcut {
  const parts = shortcut
    .toLowerCase()
    .split("+")
    .map((part) => part.trim());
  const key = parts.pop() ?? "";
  return {
    key,
    mod: parts.includes("mod"),
    ctrl: parts.includes("ctrl"),
    meta: parts.includes("meta") || parts.includes("cmd"),
    alt: parts.includes("alt") || parts.includes("option"),
    shift: parts.includes("shift"),
  };
}

export function isApplePlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  return /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent);
}

export function matchesShortcut(event: KeyboardEvent, shortcut: ParsedShortcut): boolean {
  const apple = isApplePlatform();
  const wantsMeta = shortcut.meta || (shortcut.mod && apple);
  const wantsCtrl = shortcut.ctrl || (shortcut.mod && !apple);
  return (
    event.key.toLowerCase() === shortcut.key &&
    event.metaKey === wantsMeta &&
    event.ctrlKey === wantsCtrl &&
    event.altKey === shortcut.alt &&
    event.shiftKey === shortcut.shift
  );
}

/** Formats a shortcut for display, for example `⌘K` on macOS and `Ctrl K` elsewhere. */
export function formatShortcut(shortcut: string): string {
  const parsed = parseShortcut(shortcut);
  const apple = isApplePlatform();
  const tokens: string[] = [];
  if (parsed.mod) tokens.push(apple ? "⌘" : "Ctrl");
  if (parsed.ctrl) tokens.push(apple ? "⌃" : "Ctrl");
  if (parsed.meta) tokens.push(apple ? "⌘" : "Win");
  if (parsed.alt) tokens.push(apple ? "⌥" : "Alt");
  if (parsed.shift) tokens.push(apple ? "⇧" : "Shift");
  tokens.push(parsed.key.length === 1 ? parsed.key.toUpperCase() : parsed.key);
  return apple ? tokens.join("") : tokens.join(" ");
}
