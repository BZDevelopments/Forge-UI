import type { ReactNode } from "react";
import type {
  ColumnDef,
  ColumnFiltersState,
  ColumnPinningState,
  ColumnSizingState,
  ExpandedState,
  PaginationState,
  Row,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";

/**
 * Optional per-column settings, passed through `columnDef.meta`.
 *
 * @example
 * { accessorKey: "amount", header: "Amount", meta: { align: "right" } satisfies DataTableColumnMeta }
 */
export interface DataTableColumnMeta {
  align?: "left" | "center" | "right";
  /** Hides the column automatically when the table is narrower than this many pixels. */
  hideBelow?: number;
  /** Text used for this column in CSV exports. Defaults to the header when it is a string. */
  exportHeader?: string;
  /** Overrides the value written to CSV for this column. */
  exportValue?: (row: never) => unknown;
  /** Renders a select instead of a text input in the filter row. */
  filterOptions?: { label: string; value: string }[];
  className?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DataTableColumn<TData> = ColumnDef<TData, any>;

export interface DataTableExportPayload<TData> {
  csv: string;
  rows: TData[];
  filename: string;
}

export interface DataTableClassNames {
  root?: string;
  toolbar?: string;
  scroll?: string;
  table?: string;
  header?: string;
  row?: string;
  cell?: string;
  pagination?: string;
}

export interface DataTableProps<TData> {
  columns: DataTableColumn<TData>[];
  data: TData[];
  /** Stable row id. Strongly recommended for selection and server-side data. */
  getRowId?: (row: TData, index: number) => string;

  /** Accessible name for the grid. Provide this or `caption`. */
  "aria-label"?: string;
  /** Visually hidden caption that names the grid. */
  caption?: string;

  /** Adds a global search box. Pass an object to customise it. */
  searchable?: boolean | { placeholder?: string; debounceMs?: number };
  /** Adds a filter row under the headers. */
  filterable?: boolean;
  selectable?: boolean;
  /** Enables paging. Defaults to a page size of 10. */
  pagination?: boolean | { pageSize?: number; pageSizeOptions?: number[] };
  /** Renders only the visible rows. Needs fixed-height rows and a bounded `maxHeight`. */
  virtualized?: boolean | { rowHeight?: number; overscan?: number };
  resizableColumns?: boolean;
  pinnableColumns?: boolean;
  /** Shows the Columns menu. Defaults to `true`. */
  columnMenu?: boolean;
  /** Renders a detail row for expanded rows. Not supported together with `virtualized`. */
  renderExpandedRow?: (row: Row<TData>) => ReactNode;
  getRowCanExpand?: (row: Row<TData>) => boolean;

  /** Sorting, filtering, and paging are done by your server. Use with the change callbacks below. */
  serverSide?: boolean;
  /** Total rows on the server. Needed for page counts in server-side mode. */
  rowCount?: number;

  sorting?: SortingState;
  defaultSorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  globalFilter?: string;
  defaultGlobalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
  paginationState?: PaginationState;
  onPaginationChange?: (state: PaginationState) => void;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  onSelectedRowsChange?: (rows: TData[]) => void;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;
  columnPinning?: ColumnPinningState;
  defaultColumnPinning?: ColumnPinningState;
  onColumnPinningChange?: (pinning: ColumnPinningState) => void;
  columnSizing?: ColumnSizingState;
  onColumnSizingChange?: (sizing: ColumnSizingState) => void;
  expanded?: ExpandedState;
  onExpandedChange?: (expanded: ExpandedState) => void;

  loading?: boolean;
  /** Number of skeleton rows shown while loading with no data. */
  loadingRows?: number;
  error?: ReactNode;
  onRetry?: () => void;
  emptyState?: ReactNode;

  /** Adds an Export button. */
  exportable?: boolean | { filename?: string };
  /** Receives the CSV instead of the default browser download. */
  onExport?: (payload: DataTableExportPayload<TData>) => unknown;

  onRowClick?: (row: TData) => void;
  /** Extra content placed at the end of the toolbar. */
  toolbar?: ReactNode;

  maxHeight?: number | string;
  density?: "compact" | "comfortable";
  className?: string;
  classNames?: DataTableClassNames;
}
