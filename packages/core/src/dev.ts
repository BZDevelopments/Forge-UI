declare const process: { env: { NODE_ENV?: string } } | undefined;

/** Warns about misuse during development only. Bundlers strip it from production builds. */
export function devWarn(message: string): void {
  if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
    console.warn(`[Forge UI] ${message}`);
  }
}
