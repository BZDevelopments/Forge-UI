# Acme admin: a Forge UI example

A small admin dashboard that uses the data table, kanban board, activity timeline, form system, command palette, and notifications together.

It resolves every package through its published entry points (`exports`, built files, and stylesheets), with no source aliases and no Tailwind,
so it doubles as a check that the packages work for a real consumer.

```bash
pnpm install
pnpm build:packages
pnpm --filter @forge-ui/example-admin-dashboard dev
```

Press Ctrl or ⌘ K to open the command palette.
