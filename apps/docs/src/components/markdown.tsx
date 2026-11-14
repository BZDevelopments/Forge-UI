/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- horizontally scrollable regions must be reachable by keyboard (WCAG 2.1.1) */
import { Fragment, type ReactNode } from "react";

/**
 * Renders the small subset of Markdown used by CHANGELOG.md and CONTRIBUTING.md:
 * headings, paragraphs, lists, fenced code, inline code, bold, and links.
 * Output is React elements only, so repository text can never inject HTML.
 */
function safeHref(href: string): string | null {
  return /^(https?:|mailto:|#|\/)/i.test(href) ? href : null;
}

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const pattern = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let key = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) out.push(text.slice(last, index));
    const token = match[0];
    if (token.startsWith("`")) out.push(<code key={key++}>{token.slice(1, -1)}</code>);
    else if (token.startsWith("**")) out.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    else {
      const parts = /\[([^\]]+)\]\(([^)]+)\)/.exec(token)!;
      const href = safeHref(parts[2]!);
      out.push(
        href ? (
          <a
            key={key++}
            href={href}
            className="text-forge-accent underline underline-offset-2"
            {...(href.startsWith("http") ? { rel: "noreferrer noopener" } : {})}
          >
            {parts[1]}
          </a>
        ) : (
          parts[1]
        ),
      );
    }
    last = index + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

// The page renders its own h1, so Markdown "#" and "##" both become h2, "###" h3, and so on.
const HEADING_CLASS = [
  "",
  "mt-10 mb-2 text-2xl font-semibold",
  "mt-10 mb-2 text-2xl font-semibold",
  "mt-6 mb-1 text-lg font-semibold",
  "mt-4 font-semibold",
];

export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i]!;
    if (line.startsWith("```")) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i]!.startsWith("```")) code.push(lines[i++]!);
      i++;
      blocks.push(
        <pre
          key={key++}
          tabIndex={0}
          className="my-4 overflow-x-auto rounded-lg border border-forge-border bg-forge-muted-surface p-4 text-[13px] leading-6"
        >
          <code className="font-mono">{code.join("\n")}</code>
        </pre>,
      );
    } else if (/^#{1,4}\s/.test(line)) {
      const level = line.match(/^#+/)![0].length;
      const text = line.replace(/^#+\s*/, "");
      const Tag = `h${Math.max(2, Math.min(level, 5))}` as "h2" | "h3" | "h4" | "h5";
      blocks.push(
        <Tag key={key++} className={HEADING_CLASS[level]}>
          {inline(text)}
        </Tag>,
      );
      i++;
    } else if (/^\s*[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s/.test(lines[i]!))
        items.push(lines[i++]!.replace(/^\s*[-*]\s/, ""));
      blocks.push(
        <ul key={key++} className="my-3 list-disc space-y-1 pl-6">
          {items.map((item, n) => (
            <li key={n}>{inline(item)}</li>
          ))}
        </ul>,
      );
    } else if (line.trim() === "") {
      i++;
    } else {
      const para: string[] = [];
      while (
        i < lines.length &&
        lines[i]!.trim() !== "" &&
        !/^(#{1,4}\s|```|\s*[-*]\s)/.test(lines[i]!)
      )
        para.push(lines[i++]!);
      blocks.push(
        <p key={key++} className="my-3">
          {inline(para.join(" "))}
        </p>,
      );
    }
  }
  return <Fragment>{blocks}</Fragment>;
}
