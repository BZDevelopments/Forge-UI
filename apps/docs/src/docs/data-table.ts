import type { ComponentDoc } from "./types";
import basic from "../examples/data-table-basic.tsx?raw";
import server from "../examples/data-table-server.tsx?raw";
import large from "../examples/data-table-large.tsx?raw";
import expand from "../examples/data-table-expand.tsx?raw";
import DataTableBasic from "../examples/data-table-basic";
import DataTableServer from "../examples/data-table-server";
import DataTableLarge from "../examples/data-table-large";
import DataTableExpand from "../examples/data-table-expand";

export const dataTable: ComponentDoc = {
  slug: "data-table",
  name: "Data table",
  pkg: "data-table",
  summary:
    "A sortable, filterable, paginated grid with row selection, expansion, column visibility, resizing and pinning, virtualized rendering for very large datasets, server-side mode, and CSV export. Built on TanStack Table, with accessibility and keyboard navigation handled for you.",
  keywords: [
    "table",
    "grid",
    "datagrid",
    "sort",
    "filter",
    "pagination",
    "virtual",
    "csv",
    "export",
  ],
  whenToUse: [
    "You show tabular records that people need to scan, sort, search, or act on in bulk.",
    "The data set is large enough that you need paging, server-side queries, or virtualization.",
    "You want one grid that works with the keyboard and screen readers without wiring it up yourself.",
  ],
  usage: `import { DataTable, type DataTableColumn } from "@forge-ui/data-table";

const columns: DataTableColumn<User>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
];

<DataTable aria-label="Users" columns={columns} data={users} searchable selectable pagination />`,
  examples: [
    {
      id: "basic",
      title: "Search, filter, select, page, and export",
      description:
        "Client-side data with every common feature switched on. Columns can hide themselves on narrow screens with `meta.hideBelow`, and the Columns menu lets people toggle the rest.",
      Component: DataTableBasic,
      code: basic,
    },
    {
      id: "server-side",
      title: "Server-side data",
      description:
        "Set `serverSide` and own the state. Sorting, search, and paging are reported through callbacks, the page resets to the first page when a query changes, and loading and error states are built in.",
      Component: DataTableServer,
      code: server,
    },
    {
      id: "virtualized",
      title: "50,000 rows, virtualized",
      description:
        "Only the visible rows are in the DOM, yet `aria-rowcount` reports the full size and keyboard navigation scrolls to rows that are not rendered. Try resizing a column, then use the Columns menu to pin one.",
      Component: DataTableLarge,
      code: large,
    },
    {
      id: "expandable",
      title: "Expandable rows",
      description:
        "Return content from `renderExpandedRow` to add an expander column. Expansion is not available together with `virtualized`.",
      Component: DataTableExpand,
      code: expand,
    },
  ],
  api: [
    {
      title: "DataTable props",
      rows: [
        {
          name: "columns",
          type: "DataTableColumn<TData>[]",
          description:
            "TanStack column definitions. Forge UI reads optional settings from `meta` (see below).",
        },
        {
          name: "data",
          type: "TData[]",
          description: "The rows for the current view. In server-side mode, only the current page.",
        },
        {
          name: "getRowId",
          type: "(row, index) => string",
          description: "Stable ids. Strongly recommended for selection and server-side data.",
        },
        {
          name: "aria-label / caption",
          type: "string",
          description:
            "Accessible name for the grid. One of them is required; a development warning appears if both are missing.",
        },
        {
          name: "searchable",
          type: "boolean | { placeholder?, debounceMs? }",
          default: "false",
          description: "Adds a global search box. Server-side mode debounces by 300 ms by default.",
        },
        {
          name: "filterable",
          type: "boolean",
          default: "false",
          description:
            "Adds a filter row. Use `meta.filterOptions` for a select instead of a text input.",
        },
        {
          name: "selectable",
          type: "boolean",
          default: "false",
          description: "Adds a checkbox column with a select-all control.",
        },
        {
          name: "pagination",
          type: "boolean | { pageSize?, pageSizeOptions? }",
          default: "false",
          description: "Enables paging. Default page size is 10.",
        },
        {
          name: "virtualized",
          type: "boolean | { rowHeight?, overscan? }",
          default: "false",
          description:
            "Renders only visible rows. Needs a bounded `maxHeight` and fixed-height rows.",
        },
        {
          name: "resizableColumns",
          type: "boolean",
          default: "false",
          description:
            "Drag a header edge to resize, or focus a header and press Alt+Left or Alt+Right. Double-click the edge to reset.",
        },
        {
          name: "pinnableColumns",
          type: "boolean",
          default: "false",
          description: "Adds a pin control per column in the Columns menu.",
        },
        {
          name: "columnMenu",
          type: "boolean",
          default: "true",
          description: "Shows the Columns menu for visibility and pinning.",
        },
        {
          name: "renderExpandedRow",
          type: "(row) => ReactNode",
          description: "Adds an expander column and renders details under expanded rows.",
        },
        {
          name: "serverSide",
          type: "boolean",
          default: "false",
          description: "Sorting, filtering, and paging are done by your server.",
        },
        {
          name: "rowCount",
          type: "number",
          description:
            "Total server rows. Without it, the pager can only offer Next while a full page is shown.",
        },
        {
          name: "loading",
          type: "boolean",
          default: "false",
          description:
            "Shows skeleton rows when there is no data, or dims existing rows. Sets `aria-busy`.",
        },
        {
          name: "error / onRetry",
          type: "ReactNode / () => void",
          description: "Replaces the rows with an alert and an optional Try again button.",
        },
        {
          name: "emptyState",
          type: "ReactNode",
          description:
            "Shown when there are no rows. A sensible default distinguishes “no data” from “no matches”.",
        },
        {
          name: "exportable / onExport",
          type: "boolean | { filename? } / (payload) => void",
          description:
            "Adds an Export CSV button. `onExport` receives `{ csv, rows, filename }` and replaces the default download, which is how you export from the server.",
        },
        {
          name: "onRowClick",
          type: "(row: TData) => void",
          description: "Called on click, and on Enter when a cell is focused.",
        },
        {
          name: "toolbar",
          type: "ReactNode",
          description: "Extra content at the end of the toolbar.",
        },
        {
          name: "maxHeight",
          type: "number | string",
          description: "Makes the table scroll vertically with a sticky header.",
        },
        {
          name: "density",
          type: '"comfortable" | "compact"',
          default: '"comfortable"',
          description: "Row height and font size.",
        },
        {
          name: "classNames",
          type: "Partial<Record<slot, string>>",
          description:
            "Class names for `root`, `toolbar`, `scroll`, `table`, `header`, `row`, `cell`, and `pagination`.",
        },
      ],
    },
    {
      title: "Controlled state",
      description:
        "Each piece of state works controlled or uncontrolled. Pass the value to control it, or a `default…` value to seed it.",
      rows: [
        {
          name: "sorting / defaultSorting / onSortingChange",
          type: "SortingState",
          description: "Active sort.",
        },
        {
          name: "globalFilter / defaultGlobalFilter / onGlobalFilterChange",
          type: "string",
          description: "Search text.",
        },
        {
          name: "columnFilters / onColumnFiltersChange",
          type: "ColumnFiltersState",
          description: "Per-column filters.",
        },
        {
          name: "paginationState / onPaginationChange",
          type: "{ pageIndex, pageSize }",
          description: "Current page.",
        },
        {
          name: "rowSelection / onRowSelectionChange",
          type: "Record<rowId, boolean>",
          description: "Selected rows by id. `onSelectedRowsChange` receives the row objects.",
        },
        {
          name: "columnVisibility / onColumnVisibilityChange",
          type: "VisibilityState",
          description: "Hidden columns.",
        },
        {
          name: "columnPinning / defaultColumnPinning / onColumnPinningChange",
          type: "{ left?, right? }",
          description: "Pinned column ids.",
        },
        {
          name: "columnSizing / onColumnSizingChange",
          type: "Record<columnId, number>",
          description: "Column widths in pixels.",
        },
        {
          name: "expanded / onExpandedChange",
          type: "ExpandedState",
          description: "Expanded rows.",
        },
      ],
    },
    {
      title: "Column meta",
      description:
        "Set on `columnDef.meta`. Use `satisfies DataTableColumnMeta` for type checking.",
      rows: [
        {
          name: "align",
          type: '"left" | "center" | "right"',
          description: "Text alignment for the column.",
        },
        {
          name: "hideBelow",
          type: "number",
          description:
            "Hide the column when the table is narrower than this many pixels, unless the user turned it on.",
        },
        {
          name: "exportHeader / exportValue",
          type: "string / (row) => unknown",
          description: "Control what the column writes to CSV.",
        },
        {
          name: "filterOptions",
          type: "{ label, value }[]",
          description: "Use a select in the filter row.",
        },
        {
          name: "className",
          type: "string",
          description: "Class added to the column's header and cells.",
        },
      ],
    },
  ],
  keyboard: [
    { keys: "Arrow keys", action: "Move between cells, including the header row." },
    { keys: "Home / End", action: "First or last cell in the row." },
    { keys: "Ctrl+Home / Ctrl+End", action: "First or last cell in the table." },
    { keys: "Page Up / Page Down", action: "Move about one screen of rows." },
    {
      keys: "Enter",
      action: "On a header: sort. On a control cell: activate it. On a body cell: run onRowClick.",
    },
    { keys: "Space", action: "Toggle the selected state of the row." },
    {
      keys: "Alt+Left / Alt+Right",
      action: "On a header: make the column narrower or wider (when resizable).",
    },
  ],
  accessibility: [
    'The table uses the ARIA grid pattern: `role="grid"`, `aria-rowcount`, `aria-colcount`, and `aria-rowindex`, so virtualized and paginated tables report their true size.',
    "Only one cell is in the tab order (roving tabindex). Tab moves into and out of the grid instead of through every cell.",
    "Sortable headers expose `aria-sort`. Sort changes, selection counts, and page changes are announced in a live region.",
    "Selection uses `aria-selected` on rows and `aria-multiselectable` on the grid. Checkboxes are labelled.",
    "Loading sets `aria-busy` and announces “Loading data”. Errors render as an alert.",
  ],
  customization: [
    "Override the `--forge-*` CSS variables to re-theme every component, or the `.forge-dt-*` classes for this one.",
    "Pass `className` or `classNames` to add your own utility classes. Elements also expose `data-slot`, `data-selected`, `data-pinned`, and `data-align` attributes for styling.",
    "Render anything in a cell with the standard TanStack `cell` option. Interactive content in custom cells is reachable with Tab.",
  ],
  mistakes: [
    "Forgetting `aria-label` or `caption`. The grid has no accessible name without one.",
    "Virtualizing without a bounded height. Set `maxHeight` (or a fixed-height parent) so the window has a size.",
    "Server-side mode without `getRowId`. Selection is keyed by id, and index-based ids change when the page changes.",
    "Recreating `columns` on every render. Define them outside the component or wrap them in `useMemo`.",
    "Exporting from the client when the data lives on the server. Use `onExport` to start a server-side export instead.",
  ],
};
