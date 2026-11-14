# @forge-ui/data-table

Sortable, filterable, virtualized data table with server-side data, pinning, resizing, and keyboard navigation.

Part of [Forge UI](https://github.com/bzdevelopments/forge-ui), accessible components for the parts of modern applications developers hate building. Created and maintained by [BZDevelopments](https://github.com/bzdevelopments).

## Install

```bash
pnpm add @forge-ui/data-table @forge-ui/core
```

Import the styles once near the root of your app:

```ts
import "@forge-ui/core/styles.css";
import "@forge-ui/data-table/styles.css";
```

## Usage

```tsx
import { DataTable } from "@forge-ui/data-table";

<DataTable aria-label="Users" columns={columns} data={users} searchable selectable pagination />;
```

## Documentation

Props, examples, keyboard behavior, and accessibility notes are in the [documentation site](https://github.com/bzdevelopments/forge-ui#readme) and the [source](https://github.com/bzdevelopments/forge-ui/tree/main/packages/data-table).

## License

MIT © BZDevelopments
