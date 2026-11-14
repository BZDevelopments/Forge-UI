# Forge UI

**Production-ready, accessible components for the parts of modern applications developers hate building.**

Data tables that stay fast with 50,000 rows. Command palettes. File uploads with real progress, retry, and cancel. Forms with async validation and
multi-step flows. Date pickers you can use without a mouse. Each one is a small, typed React package that you can install on its own and style
without touching library source.

Created and maintained by [BZDevelopments](https://github.com/bzdevelopments).

> **Status:** version 0.1, the first release. The APIs are considered usable, and may still change between minor versions until 1.0. Every
> change is listed in the [changelog](CHANGELOG.md).

## Why Forge UI

- **Accessible by default.** ARIA patterns, focus management, live announcements, and visible focus come built in. Every component has an automated axe check in its tests, and the documentation site is scanned in light and dark mode against WCAG 2.2 AA in a real browser.
- **Keyboard first.** Everything works without a mouse, including drag and drop.
- **Composable.** Each component sits on headless hooks, so you can keep the behavior and replace the UI.
- **Themeable without forking.** Colors, radius, and fonts come from CSS variables. Tailwind is optional.
- **Small.** One package per component, tree-shakeable, with ESM and CommonJS builds and a `"use client"` directive for server component frameworks.
- **Strict TypeScript.** Typed props, generics where they help, and no `any` in public APIs.

## Components

| Component         | Package                       | Highlights                                                                                                        |
| ----------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Data table        | `@forge-ui/data-table`        | Sorting, filtering, paging, server-side mode, virtualization, pinning, resizing, selection, expansion, CSV export |
| Command palette   | `@forge-ui/command-palette`   | Fuzzy search, groups, nested and async commands, recent history                                                   |
| File uploader     | `@forge-ui/file-uploader`     | Drag and drop, validation, previews, progress, retry, cancel, pause and resume, adapters                          |
| Form system       | `@forge-ui/form`              | Any Standard Schema validator, async checks, conditional fields, field arrays, multi-step                         |
| Combobox          | `@forge-ui/combobox`          | Async options, groups, windowed lists for thousands of options                                                    |
| Multi-select      | `@forge-ui/multi-select`      | Removable tags, limits, async options                                                                             |
| Date-range picker | `@forge-ui/date-range-picker` | Single and range, constraints, presets, locale-aware                                                              |
| Notifications     | `@forge-ui/notifications`     | `notify.promise`, undo, progress, queues, announcements                                                           |
| Activity timeline | `@forge-ui/activity-timeline` | Grouping, avatars, metadata, relative time                                                                        |
| Kanban board      | `@forge-ui/kanban-board`      | Pointer, touch, and keyboard moves, WIP limits, rollback on failed saves                                          |

Shared tokens, hooks, and primitives live in `@forge-ui/core`.

## Quick start

```bash
pnpm add @forge-ui/data-table @forge-ui/core
```

```tsx
import "@forge-ui/core/styles.css";
import "@forge-ui/data-table/styles.css";
import { DataTable, type DataTableColumn } from "@forge-ui/data-table";

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
}
```

```tsx
import { CommandPalette } from "@forge-ui/command-palette";
import { Toaster, notify } from "@forge-ui/notifications";

<CommandPalette commands={commands} shortcut="mod+k" onSelect={handleCommand} />
<Toaster />

notify.promise(saveData(), {
  loading: "Saving...",
  success: "Saved successfully",
  error: "Unable to save",
});
```

Full documentation, live examples, API tables, and keyboard maps are on the documentation site (run it locally with `pnpm dev`, or see the
deployed copy once GitHub Pages is enabled for the repository).

## Architecture

```text
forge-ui/
├── apps/docs/          Documentation site (Vite, React, Tailwind). Examples are real files shown as their own source.
├── examples/           A realistic admin dashboard that consumes the built packages, with no Tailwind.
├── packages/
│   ├── core/           Design tokens, hooks, shared primitives
│   ├── data-table/     Built on TanStack Table and TanStack Virtual
│   ├── command-palette/ Built on Radix Dialog
│   ├── file-uploader/  Headless engine and adapters, no storage lock-in
│   ├── form/           Built on React Hook Form, with a Standard Schema resolver
│   ├── combobox/       Headless engine, listbox, and popover
│   ├── multi-select/   Built on the combobox engine
│   ├── date-range-picker/ Calendar grid and picker on Radix Popover, with no date library
│   ├── notifications/  External store, no providers
│   ├── activity-timeline/
│   └── kanban-board/   Built on dnd kit
└── tests/e2e/          Playwright tests that run against the built docs and example
```

A few decisions worth knowing:

- **Plain CSS, not Tailwind classes.** Each package ships a small stylesheet driven by CSS variables. That keeps Tailwind version mismatches out of your build, works with strict content security policies, and still lets you restyle with your own classes. A Tailwind preset is included if you want the tokens as theme colors.
- **Headless first.** `useFileUploader`, `useCombobox`, and the pure `moveCard` function are exported, so behavior can be reused with your own UI.
- **Dependencies are chosen narrowly.** TanStack for tables and virtualization, Radix for dialogs and popovers, dnd kit for drag and drop, React Hook Form for forms. Everything else, including fuzzy search, dates, and toasts, is written in this repository.
- **Standard Schema.** The form system accepts Zod, Valibot, ArkType, or anything that implements the [Standard Schema](https://standardschema.dev) interface.

## Development

You need Node.js 20 or newer and pnpm 9.

```bash
pnpm install
pnpm dev            # documentation site with live reload, running against package source
pnpm build          # build every package, the docs, and the example
```

## Testing

```bash
pnpm typecheck      # strict TypeScript across the repository
pnpm lint           # ESLint, including jsx-a11y
pnpm format:check   # Prettier
pnpm test           # unit and accessibility tests (Vitest, Testing Library, axe)
pnpm test:e2e       # Playwright against the built docs and example (run `pnpm exec playwright install chromium` once)
pnpm check          # typecheck, lint, format check, and unit tests together
```

The end-to-end suite covers keyboard navigation, real pointer drag and drop, downloads, clipboard, responsive layouts, and an axe scan of every
documentation page in light and dark mode. The `Install from packed tarballs` CI job packs every package, installs the tarballs into an empty
project, and imports each one as ESM and CommonJS.

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) for setup, the checklist every component must meet, and how to add a
changeset. Please follow the [code of conduct](CODE_OF_CONDUCT.md). Security issues go through [private reporting](SECURITY.md).

## Roadmap

Things that are planned or under consideration, in no particular order:

- Grouped column headers and inline cell editing in the data table
- Typed date input (type a date instead of choosing it) in the date picker
- Tree and grid variants of the combobox
- Resumable upload adapters (tus and S3 multipart) as separate packages
- Swimlanes and column reordering in the kanban board
- A visual regression suite alongside the existing behavior tests

Have a different priority? [Open an issue](https://github.com/bzdevelopments/forge-ui/issues/new/choose) and describe the problem you are trying to solve.

## License

[MIT](LICENSE) © 2026 BZDevelopments.

Forge UI is created and maintained by [BZDevelopments](https://github.com/bzdevelopments) · [github.com/bzdevelopments/forge-ui](https://github.com/bzdevelopments/forge-ui)
