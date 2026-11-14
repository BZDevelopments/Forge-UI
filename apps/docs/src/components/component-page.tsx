/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- horizontally scrollable regions must be reachable by keyboard (WCAG 2.1.1) */
import { useState } from "react";
import { CodeBlock } from "./code-block";
import { GITHUB_URL } from "../docs/pages";
import type { ApiSection, ComponentDoc, ExampleDef } from "../docs/types";

const MANAGERS = ["pnpm", "npm", "yarn", "bun"] as const;
type Manager = (typeof MANAGERS)[number];

function installCommand(manager: Manager, packages: string[]): string {
  const list = packages.join(" ");
  return {
    pnpm: `pnpm add ${list}`,
    npm: `npm install ${list}`,
    yarn: `yarn add ${list}`,
    bun: `bun add ${list}`,
  }[manager];
}

function InstallTabs({ doc }: { doc: ComponentDoc }) {
  const [manager, setManager] = useState<Manager>("pnpm");
  const packages = [`@forge-ui/${doc.pkg}`, "@forge-ui/core", ...(doc.alsoInstall ?? [])];
  const styles = ["core", doc.pkg, ...(doc.extraStyles ?? [])];
  return (
    <div>
      <div role="tablist" aria-label="Package manager" className="flex gap-1">
        {MANAGERS.map((m) => (
          <button
            key={m}
            role="tab"
            type="button"
            id={`tab-${doc.slug}-${m}`}
            aria-selected={manager === m}
            aria-controls={`panel-${doc.slug}`}
            tabIndex={manager === m ? 0 : -1}
            onClick={() => setManager(m)}
            onKeyDown={(event) => {
              const index = MANAGERS.indexOf(manager);
              const next =
                event.key === "ArrowRight"
                  ? index + 1
                  : event.key === "ArrowLeft"
                    ? index - 1
                    : null;
              if (next === null) return;
              event.preventDefault();
              const target = MANAGERS[(next + MANAGERS.length) % MANAGERS.length]!;
              setManager(target);
              document.getElementById(`tab-${doc.slug}-${target}`)?.focus();
            }}
            className={`rounded-md px-3 py-1 text-sm ${manager === m ? "bg-forge-accent-soft font-semibold" : "text-forge-muted hover:bg-forge-hover"}`}
          >
            {m}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${doc.slug}`} aria-labelledby={`tab-${doc.slug}-${manager}`}>
        <CodeBlock lang="bash" title="Terminal" code={installCommand(manager, packages)} />
      </div>
      <p className="text-sm text-forge-muted">
        Then import the styles once, near the root of your app:
      </p>
      <CodeBlock
        lang="ts"
        title="main.tsx"
        code={styles.map((name) => `import "@forge-ui/${name}/styles.css";`).join("\n")}
      />
    </div>
  );
}

function Example({ example }: { example: ExampleDef }) {
  const [showCode, setShowCode] = useState(!example.Component);
  const { Component } = example;
  return (
    <section id={example.id} className="scroll-mt-20">
      <h3 className="mt-8 text-lg font-semibold">{example.title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-forge-muted">{example.description}</p>
      {Component ? (
        <div className="mt-3 overflow-hidden rounded-lg border border-forge-border">
          <div className="bg-forge-bg p-4 sm:p-6">
            <Component />
          </div>
          <div className="flex justify-end border-t border-forge-border bg-forge-muted-surface px-3 py-1.5">
            <button
              type="button"
              aria-expanded={showCode}
              aria-controls={`code-${example.id}`}
              onClick={() => setShowCode((v) => !v)}
              className="rounded-md px-2 py-1 text-xs font-medium text-forge-muted hover:bg-forge-hover hover:text-forge-text"
            >
              {showCode ? "Hide code" : "View code"}
            </button>
          </div>
        </div>
      ) : null}
      <div id={`code-${example.id}`} hidden={!showCode}>
        {showCode ? <CodeBlock code={example.code} title={`${example.id}.tsx`} /> : null}
      </div>
    </section>
  );
}

function ApiTable({ section }: { section: ApiSection }) {
  return (
    <section className="mt-6">
      <h3 className="text-base font-semibold">{section.title}</h3>
      {section.description ? (
        <p className="mt-1 text-sm text-forge-muted">{section.description}</p>
      ) : null}
      <div
        className="mt-2 overflow-x-auto rounded-lg border border-forge-border"
        tabIndex={0}
        role="region"
        aria-label={`${section.title}, scrollable`}
      >
        <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
          <caption className="sr-only">{section.title}</caption>
          <thead className="bg-forge-muted-surface text-xs uppercase tracking-wide text-forge-muted">
            <tr>
              <th scope="col" className="px-3 py-2 font-semibold">
                Prop
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                Type
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                Default
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {section.rows.map((row) => (
              <tr key={row.name} className="border-t border-forge-border align-top">
                <th scope="row" className="px-3 py-2 font-mono text-[13px] font-semibold">
                  {row.name}
                </th>
                <td className="px-3 py-2 font-mono text-xs text-forge-muted">{row.type}</td>
                <td className="px-3 py-2 font-mono text-xs text-forge-muted">
                  {row.default ?? "—"}
                </td>
                <td className="px-3 py-2 leading-relaxed">{row.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  // Items may contain `code`, which is split out and rendered as elements (never as HTML).
  return (
    <ul className="mt-3 list-disc space-y-2 pl-6 leading-relaxed">
      {items.map((item) => (
        <li key={item}>
          {item
            .split(/(`[^`]+`)/g)
            .map((part, i) =>
              part.startsWith("`") ? <code key={i}>{part.slice(1, -1)}</code> : part,
            )}
        </li>
      ))}
    </ul>
  );
}

export function ComponentPage({ doc }: { doc: ComponentDoc }) {
  return (
    <article className="prose-forge max-w-4xl">
      <h1 tabIndex={-1} data-page-title className="text-4xl font-bold tracking-tight outline-none">
        {doc.name}
      </h1>
      <p className="mt-3 text-lg leading-relaxed text-forge-muted">{doc.summary}</p>

      <h2 className="mt-10 text-2xl font-semibold">Installation</h2>
      <InstallTabs doc={doc} />

      <h2 className="mt-10 text-2xl font-semibold">When to use it</h2>
      <Bullets items={doc.whenToUse} />

      <h2 className="mt-10 text-2xl font-semibold">Basic usage</h2>
      <CodeBlock code={doc.usage} title="Example" />

      <h2 id="examples" className="mt-10 scroll-mt-20 text-2xl font-semibold">
        Examples
      </h2>
      {doc.examples.map((example) => (
        <Example key={example.id} example={example} />
      ))}

      <h2 id="api" className="mt-12 scroll-mt-20 text-2xl font-semibold">
        API reference
      </h2>
      {doc.api.map((section) => (
        <ApiTable key={section.title} section={section} />
      ))}

      <h2 id="keyboard" className="mt-12 scroll-mt-20 text-2xl font-semibold">
        Keyboard
      </h2>
      <div className="mt-3 overflow-x-auto rounded-lg border border-forge-border">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">{doc.name} keyboard shortcuts</caption>
          <thead className="bg-forge-muted-surface text-xs uppercase tracking-wide text-forge-muted">
            <tr>
              <th scope="col" className="px-3 py-2 font-semibold">
                Keys
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                What it does
              </th>
            </tr>
          </thead>
          <tbody>
            {doc.keyboard.map((row) => (
              <tr key={row.keys} className="border-t border-forge-border align-top">
                <th scope="row" className="px-3 py-2 font-normal">
                  <kbd className="rounded border border-forge-border bg-forge-muted-surface px-1.5 py-0.5 font-mono text-xs">
                    {row.keys}
                  </kbd>
                </th>
                <td className="px-3 py-2">{row.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 id="accessibility" className="mt-12 scroll-mt-20 text-2xl font-semibold">
        Accessibility
      </h2>
      <Bullets items={doc.accessibility} />

      <h2 className="mt-12 text-2xl font-semibold">Customization</h2>
      <Bullets items={doc.customization} />

      <h2 className="mt-12 text-2xl font-semibold">Common mistakes</h2>
      <Bullets items={doc.mistakes} />

      <p className="mt-12 text-sm text-forge-muted">
        <a
          className="underline underline-offset-2"
          rel="noreferrer noopener"
          href={`${GITHUB_URL}/tree/main/packages/${doc.pkg}`}
        >
          View the source of @forge-ui/{doc.pkg} on GitHub
        </a>
      </p>
    </article>
  );
}
