import { componentDocs } from "../docs";
import { GITHUB_URL, ORG_URL } from "../docs/pages";
import { Link } from "../lib/router";
import { CodeBlock } from "./code-block";
import { Markdown } from "./markdown";

function PageTitle({ children }: { children: string }) {
  return (
    <h1 tabIndex={-1} data-page-title className="text-4xl font-bold tracking-tight outline-none">
      {children}
    </h1>
  );
}

const PRINCIPLES = [
  [
    "Accessible by default",
    "ARIA patterns, focus management, live announcements, and labelled controls are built in, and every component has automated accessibility tests.",
  ],
  [
    "Keyboard first",
    "Everything works without a mouse, including drag and drop. Shortcuts are documented on every page.",
  ],
  [
    "Composable",
    "Headless hooks sit under each component, so you can keep the behavior and replace the UI.",
  ],
  [
    "Themeable without forking",
    "Colors, radius, and type come from CSS variables. Override them, or add your own class names.",
  ],
  [
    "Small and tree-shakeable",
    "Every component is its own package. Only the ones you import end up in your bundle.",
  ],
  ["Typed end to end", "Strict TypeScript, generics where they help, and no `any` in public APIs."],
];

export function Home() {
  return (
    <article className="prose-forge max-w-4xl">
      <p className="text-sm font-semibold uppercase tracking-wider text-forge-accent">
        Open source · React · TypeScript
      </p>
      <h1
        tabIndex={-1}
        data-page-title
        className="mt-2 text-4xl font-bold leading-tight tracking-tight outline-none sm:text-5xl"
      >
        Production-ready, accessible components for the parts of modern applications developers hate
        building.
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-forge-muted">
        Data tables that handle 50,000 rows, command palettes, file uploads with real progress,
        forms with multi-step flows, and date pickers that work with a keyboard. Install only what
        you need, and style it without touching library source.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/guides/getting-started"
          className="rounded-md bg-forge-accent px-4 py-2 text-sm font-semibold text-[var(--forge-accent-text)] hover:opacity-90"
        >
          Get started
        </Link>
        <a
          href={GITHUB_URL}
          rel="noreferrer noopener"
          className="rounded-md border border-forge-border px-4 py-2 text-sm font-semibold hover:bg-forge-hover"
        >
          View on GitHub
        </a>
      </div>

      <h2 className="mt-14 text-2xl font-semibold">Components</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {componentDocs.map((doc) => (
          <li key={doc.slug}>
            <Link
              to={`/components/${doc.slug}`}
              className="block h-full rounded-lg border border-forge-border p-4 hover:border-forge-accent hover:bg-forge-hover"
            >
              <span className="font-semibold">{doc.name}</span>
              <span className="mt-1 block text-sm leading-relaxed text-forge-muted">
                {doc.summary.split(". ")[0]}.
              </span>
              <span className="mt-2 block font-mono text-xs text-forge-muted">
                @forge-ui/{doc.pkg}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="mt-14 text-2xl font-semibold">Principles</h2>
      <dl className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2">
        {PRINCIPLES.map(([title, text]) => (
          <div key={title}>
            <dt className="font-semibold">{title}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-forge-muted">{text}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mt-14 text-2xl font-semibold">Credits</h2>
      <p className="mt-3 leading-relaxed">
        Forge UI is created and maintained by{" "}
        <a
          href={ORG_URL}
          rel="noreferrer noopener"
          className="font-medium underline underline-offset-2"
        >
          BZDevelopments
        </a>
        . It builds on excellent open source work: TanStack Table and Virtual, Radix UI primitives,
        dnd kit, and React Hook Form. See{" "}
        <Link to="/contributing" className="underline underline-offset-2">
          Contributing
        </Link>{" "}
        if you would like to help.
      </p>
    </article>
  );
}

export function GettingStarted() {
  return (
    <article className="prose-forge max-w-3xl">
      <PageTitle>Getting started</PageTitle>
      <p className="mt-3 text-lg text-forge-muted">
        Forge UI is a set of small packages. Install the ones you need, import their styles once,
        and render.
      </p>
      <p className="mt-2 rounded-lg border border-forge-border bg-forge-muted-surface p-3 text-sm">
        Forge UI is at version 0.x. Expect the occasional breaking change between minor versions
        until 1.0, all of which are listed in the{" "}
        <Link to="/changelog" className="underline underline-offset-2">
          changelog
        </Link>
        .
      </p>

      <h2 className="mt-10 text-2xl font-semibold">1. Install</h2>
      <p className="mt-2">
        Each component is its own package, and all of them use <code>@forge-ui/core</code> for
        tokens and shared pieces. React 18 or newer is required.
      </p>
      <CodeBlock
        lang="bash"
        title="Terminal"
        code={
          "pnpm add @forge-ui/data-table @forge-ui/core\n# or: npm install @forge-ui/data-table @forge-ui/core"
        }
      />

      <h2 className="mt-10 text-2xl font-semibold">2. Import the styles</h2>
      <p className="mt-2">
        Styles are plain CSS that ship with each package. You do not need Tailwind, and nothing is
        injected at runtime, so it works with strict content security policies.
      </p>
      <CodeBlock
        lang="ts"
        title="main.tsx"
        code={'import "@forge-ui/core/styles.css";\nimport "@forge-ui/data-table/styles.css";'}
      />

      <h2 className="mt-10 text-2xl font-semibold">3. Render a component</h2>
      <CodeBlock
        code={`import { DataTable, type DataTableColumn } from "@forge-ui/data-table";

type User = { id: string; name: string; email: string };

const columns: DataTableColumn<User>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
];

export function Users({ users }: { users: User[] }) {
  return (
    <DataTable
      aria-label="Users"
      columns={columns}
      data={users}
      getRowId={(user) => user.id}
      searchable
      selectable
      pagination
    />
  );
}`}
        title="Users.tsx"
      />

      <h2 className="mt-10 text-2xl font-semibold">Frameworks and server rendering</h2>
      <ul className="mt-3 list-disc space-y-2 pl-6 leading-relaxed">
        <li>
          Packages ship with a <code>&quot;use client&quot;</code> directive, so they work in the
          Next.js App Router. Import them from client components or from a file that already has the
          directive.
        </li>
        <li>
          Components render on the server without touching <code>window</code>. Anything that needs
          the browser (shortcuts, media queries, observers) starts after mount.
        </li>
        <li>Both ESM and CommonJS builds are published, with type declarations.</li>
      </ul>

      <h2 className="mt-10 text-2xl font-semibold">Notifications need one mount</h2>
      <p className="mt-2">
        Render <code>&lt;Toaster /&gt;</code> once near the root, then call <code>notify</code> from
        anywhere.
      </p>
      <CodeBlock
        code={
          'import { Toaster } from "@forge-ui/notifications";\n\nexport function App() {\n  return (\n    <>\n      <Routes />\n      <Toaster />\n    </>\n  );\n}'
        }
        title="App.tsx"
      />
    </article>
  );
}

const TOKENS: Array<[string, string]> = [
  ["--forge-bg / --forge-surface", "Page and component backgrounds."],
  ["--forge-surface-hover / --forge-surface-muted", "Hover states and quiet panels."],
  ["--forge-border / --forge-border-strong", "Dividers and control borders."],
  ["--forge-text / --forge-text-muted", "Primary and secondary text."],
  [
    "--forge-accent / --forge-accent-hover / --forge-accent-soft / --forge-accent-text",
    "Brand color, its hover and tinted forms, and text drawn on top of it.",
  ],
  ["--forge-danger, --forge-success, --forge-warning, --forge-info (and -soft)", "Status colors."],
  ["--forge-focus-ring", "Color of the keyboard focus outline."],
  ["--forge-radius / --forge-radius-sm", "Corner radius for panels and controls."],
  ["--forge-shadow", "Popover and toast shadow."],
  ["--forge-font / --forge-font-mono", "Font stacks."],
  ["--forge-z-popover / --forge-z-toast", "Stacking order."],
];

export function Theming() {
  return (
    <article className="prose-forge max-w-3xl">
      <PageTitle>Theming</PageTitle>
      <p className="mt-3 text-lg text-forge-muted">
        Every color, radius, and font comes from a CSS variable. Re-theme the whole library by
        overriding a few of them.
      </p>

      <h2 className="mt-10 text-2xl font-semibold">Override the tokens</h2>
      <CodeBlock
        lang="css"
        title="theme.css"
        code={`:root {
  --forge-accent: #0d9488;
  --forge-accent-hover: #0f766e;
  --forge-accent-soft: #f0fdfa;
  --forge-radius: 0.75rem;
}`}
      />

      <h2 className="mt-10 text-2xl font-semibold">Dark mode</h2>
      <p className="mt-2">
        Forge UI follows the system by default. To control it yourself, put{" "}
        <code>class=&quot;dark&quot;</code> or <code>data-theme=&quot;dark&quot;</code> on any
        ancestor (usually <code>&lt;html&gt;</code>). Use <code>light</code> the same way to force
        light mode against a dark system.
      </p>
      <CodeBlock
        code={'document.documentElement.classList.toggle("dark", isDark);'}
        title="Toggle"
      />
      <p className="mt-2">
        Check contrast when you change colors. Text on <code>--forge-accent</code> uses{" "}
        <code>--forge-accent-text</code>, so update both together.
      </p>

      <h2 className="mt-10 text-2xl font-semibold">Tokens</h2>
      <div className="mt-3 overflow-x-auto rounded-lg border border-forge-border">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">Design tokens</caption>
          <thead className="bg-forge-muted-surface text-xs uppercase tracking-wide text-forge-muted">
            <tr>
              <th scope="col" className="px-3 py-2">
                Variable
              </th>
              <th scope="col" className="px-3 py-2">
                Used for
              </th>
            </tr>
          </thead>
          <tbody>
            {TOKENS.map(([name, use]) => (
              <tr key={name} className="border-t border-forge-border align-top">
                <th scope="row" className="px-3 py-2 font-mono text-xs font-semibold">
                  {name}
                </th>
                <td className="px-3 py-2">{use}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 text-2xl font-semibold">Class names and data attributes</h2>
      <p className="mt-2">
        Components accept <code>className</code>, and larger ones accept <code>classNames</code> for
        individual parts. Parts also carry <code>data-*</code> attributes such as{" "}
        <code>data-selected</code> and <code>data-active</code>, and stable <code>forge-*</code>{" "}
        class names, so you can restyle from your own CSS without specificity fights (the library
        styles are low-specificity).
      </p>

      <h2 className="mt-10 text-2xl font-semibold">Tailwind</h2>
      <p className="mt-2">
        Tailwind is optional. If you use it, the preset maps the tokens to theme colors so you can
        write <code>bg-forge-surface</code> or <code>text-forge-muted</code> in your own markup.
      </p>
      <CodeBlock
        code={
          '// tailwind.config.js (v3)\nimport forge from "@forge-ui/core/tailwind-preset";\n\nexport default { presets: [forge], content: ["./src/**/*.{ts,tsx}"] };'
        }
        title="tailwind.config.js"
      />
      <p className="mt-2">
        In Tailwind v4, map the same variables in CSS with <code>@theme inline</code>, as this site
        does.
      </p>
    </article>
  );
}

export function AccessibilityGuide() {
  return (
    <article className="prose-forge max-w-3xl">
      <PageTitle>Accessibility</PageTitle>
      <p className="mt-3 text-lg text-forge-muted">
        What Forge UI does for you, what it leaves to you, and how to keep it working when you
        customize.
      </p>

      <h2 className="mt-10 text-2xl font-semibold">What is built in</h2>
      <ul className="mt-3 list-disc space-y-2 pl-6 leading-relaxed">
        <li>
          Established ARIA patterns: grid, combobox, listbox, dialog, date picker, menu, tabs, and
          live regions.
        </li>
        <li>Keyboard operation for everything, including alternatives to dragging (WCAG 2.5.7).</li>
        <li>
          Focus management: focus return after dialogs and popups, focus to the first error after a
          failed submit, and a single tab stop in composite widgets.
        </li>
        <li>
          Announcements through shared live regions for results, selections, uploads, moves, and
          errors. Errors are assertive, everything else polite.
        </li>
        <li>
          Visible focus rings, color-independent status (text and icons alongside color), and
          reduced-motion support.
        </li>
        <li>An automated axe check in every component&apos;s test suite.</li>
      </ul>

      <h2 className="mt-10 text-2xl font-semibold">What is up to you</h2>
      <ul className="mt-3 list-disc space-y-2 pl-6 leading-relaxed">
        <li>
          Give things names: pass <code>aria-label</code> or a visible label, as the docs show.
        </li>
        <li>Keep color contrast at 4.5:1 for text and 3:1 for controls when you change tokens.</li>
        <li>
          Keep content you render inside components accessible: images need alt text, custom cells
          need names.
        </li>
        <li>
          Test with a real screen reader and with the keyboard alone. Automated checks catch roughly
          a third of issues.
        </li>
      </ul>

      <h2 className="mt-10 text-2xl font-semibold">Customizing safely</h2>
      <ul className="mt-3 list-disc space-y-2 pl-6 leading-relaxed">
        <li>
          Do not remove <code>:focus-visible</code> outlines. Change their color with{" "}
          <code>--forge-focus-ring</code> instead.
        </li>
        <li>
          Do not set <code>display: none</code> on the visually hidden live regions (
          <code>.forge-sr-only</code>). Hidden content is not announced.
        </li>
        <li>
          When you use <code>renderOption</code>, <code>renderCard</code>, <code>renderEvent</code>,
          or <code>render</code>, keep interactive content reachable by keyboard.
        </li>
      </ul>

      <h2 className="mt-10 text-2xl font-semibold">Found a problem?</h2>
      <p className="mt-2">
        Accessibility bugs are treated as bugs, not enhancements. Please{" "}
        <a
          href={`${GITHUB_URL}/issues/new/choose`}
          rel="noreferrer noopener"
          className="underline underline-offset-2"
        >
          open an issue
        </a>{" "}
        with the browser, assistive technology, and steps to reproduce.
      </p>
    </article>
  );
}

export function MarkdownPage({ title, source }: { title: string; source: string }) {
  // The first heading in the file is the page title, so drop it here and render our own.
  const body = source.replace(/^#\s+.*\n/, "");
  return (
    <article className="prose-forge max-w-3xl">
      <PageTitle>{title}</PageTitle>
      <div className="mt-4">
        <Markdown source={body} />
      </div>
    </article>
  );
}

export function NotFound() {
  return (
    <article className="max-w-3xl">
      <PageTitle>Page not found</PageTitle>
      <p className="mt-3 text-forge-muted">
        That page does not exist. Try the{" "}
        <Link to="/" className="underline underline-offset-2">
          introduction
        </Link>{" "}
        or search with the button in the header.
      </p>
    </article>
  );
}
