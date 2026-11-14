/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- horizontally scrollable regions must be reachable by keyboard (WCAG 2.1.1) */
import { useEffect, useRef, useState } from "react";
import { highlight } from "../lib/highlight";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // The Clipboard API can be blocked outside secure contexts. Fall back to a temporary textarea.
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

export function CopyButton({ text, label = "Copy code" }: { text: string; label?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <button
      type="button"
      onClick={async () => {
        setState((await copyText(text)) ? "copied" : "failed");
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setState("idle"), 1800);
      }}
      className="rounded-md border border-forge-border bg-forge-surface px-2 py-1 text-xs font-medium text-forge-muted hover:bg-forge-hover hover:text-forge-text"
    >
      {state === "copied" ? "Copied" : state === "failed" ? "Press Ctrl+C" : label}
      <span className="sr-only" role="status">
        {state === "copied" ? "Code copied to clipboard" : ""}
      </span>
    </button>
  );
}

export function CodeBlock({
  code,
  lang = "tsx",
  title,
}: {
  code: string;
  lang?: string;
  title?: string;
}) {
  const trimmed = code.replace(/\s+$/, "");
  return (
    <figure className="my-4 overflow-hidden rounded-lg border border-forge-border bg-forge-muted-surface">
      <figcaption className="flex items-center justify-between border-b border-forge-border px-3 py-1.5">
        <span className="font-mono text-xs text-forge-muted">{title ?? lang}</span>
        <CopyButton text={trimmed} />
      </figcaption>
      <pre
        tabIndex={0}
        className="m-0 overflow-x-auto p-4 text-[13px] leading-6"
        aria-label={title ? `${title} code` : "Code"}
      >
        <code className="font-mono">{highlight(trimmed, lang)}</code>
      </pre>
    </figure>
  );
}
