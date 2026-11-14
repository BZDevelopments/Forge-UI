import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnFiltersState,
  type ColumnPinningState,
  type ColumnSizingState,
  type ExpandedState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Button, announce, cn, devWarn, useControllableState } from "@forge-ui/core";
import { ColumnMenu } from "./column-menu";
import { Pagination } from "./pagination";
import { downloadCsv, toCsv } from "./csv";
import type { DataTableColumn, DataTableColumnMeta, DataTableProps } from "./types";

const SELECT_ID = "__select";
const EXPAND_ID = "__expand";
const DEFAULT_PAGE_SIZES = [10, 25, 50, 100];

type GridPosition = { row: number; col: number };

function formatDefaultCell(value: unknown): ReactNode {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toLocaleString();
  if (typeof value === "object") return "";
  return String(value);
}

function useElementWidth(ref: React.RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    setWidth(element.getBoundingClientRect().width);
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

function pinnedStyle<TData>(column: Column<TData, unknown>): CSSProperties {
  const pinned = column.getIsPinned();
  const style: CSSProperties = { width: column.getSize() };
  if (pinned === "left") {
    style.position = "sticky";
    style.left = column.getStart("left");
  } else if (pinned === "right") {
    style.position = "sticky";
    style.right = column.getAfter("right");
  }
  return style;
}

function IndeterminateCheckbox({
  checked,
  indeterminate,
  ...props
}: {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  "aria-label": string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <input
      type="checkbox"
      className="forge-dt-checkbox"
      tabIndex={-1}
      checked={checked}
      ref={(element) => {
        if (element) element.indeterminate = Boolean(indeterminate) && !checked;
      }}
      {...props}
    />
  );
}

/**
 * A full-featured data grid. Rendering, sorting, filtering, and paging are driven by TanStack Table;
 * Forge UI adds accessibility, keyboard navigation, virtualization, CSV export, and styling.
 */
export function DataTable<TData>(props: DataTableProps<TData>) {
  const {
    columns: userColumns,
    data,
    getRowId,
    caption,
    searchable,
    filterable,
    selectable,
    pagination,
    virtualized,
    resizableColumns,
    pinnableColumns,
    columnMenu = true,
    renderExpandedRow,
    getRowCanExpand,
    serverSide = false,
    rowCount,
    loading = false,
    loadingRows,
    error,
    onRetry,
    emptyState,
    exportable,
    onExport,
    onRowClick,
    toolbar,
    maxHeight,
    density = "comfortable",
    className,
    classNames = {},
  } = props;

  if (!props["aria-label"] && !caption) {
    devWarn("DataTable needs an `aria-label` or `caption` so the grid has an accessible name.");
  }
  if (virtualized && renderExpandedRow) {
    devWarn("DataTable: expandable rows are not supported together with `virtualized`.");
  }

  const pageConfig = typeof pagination === "object" ? pagination : undefined;
  const pageSizeOptions = pageConfig?.pageSizeOptions ?? DEFAULT_PAGE_SIZES;
  const virtualConfig = typeof virtualized === "object" ? virtualized : undefined;
  const rowHeight = virtualConfig?.rowHeight ?? (density === "compact" ? 36 : 48);
  const searchConfig = typeof searchable === "object" ? searchable : undefined;
  const searchDebounce = searchConfig?.debounceMs ?? (serverSide ? 300 : 0);

  // State: every piece can be controlled or left to the table.
  const [sorting, setSorting] = useControllableState<SortingState>({
    value: props.sorting,
    defaultValue: props.defaultSorting ?? [],
    onChange: props.onSortingChange,
  });
  const [globalFilter, setGlobalFilter] = useControllableState<string>({
    value: props.globalFilter,
    defaultValue: props.defaultGlobalFilter ?? "",
    onChange: props.onGlobalFilterChange,
  });
  const [columnFilters, setColumnFilters] = useControllableState<ColumnFiltersState>({
    value: props.columnFilters,
    defaultValue: [],
    onChange: props.onColumnFiltersChange,
  });
  const [paginationState, setPaginationState] = useControllableState<PaginationState>({
    value: props.paginationState,
    defaultValue: { pageIndex: 0, pageSize: pageConfig?.pageSize ?? 10 },
    onChange: props.onPaginationChange,
  });
  const [rowSelection, setRowSelection] = useControllableState<RowSelectionState>({
    value: props.rowSelection,
    defaultValue: {},
    onChange: props.onRowSelectionChange,
  });
  const [columnVisibility, setColumnVisibility] = useControllableState<VisibilityState>({
    value: props.columnVisibility,
    defaultValue: {},
    onChange: props.onColumnVisibilityChange,
  });
  const [columnPinning, setColumnPinning] = useControllableState<ColumnPinningState>({
    value: props.columnPinning,
    defaultValue: props.defaultColumnPinning ?? { left: [], right: [] },
    onChange: props.onColumnPinningChange,
  });
  const [columnSizing, setColumnSizing] = useControllableState<ColumnSizingState>({
    value: props.columnSizing,
    defaultValue: {},
    onChange: props.onColumnSizingChange,
  });
  const [expanded, setExpanded] = useControllableState<ExpandedState>({
    value: props.expanded,
    defaultValue: {},
    onChange: props.onExpandedChange,
  });

  const resetPage = useCallback(() => {
    if (serverSide)
      setPaginationState((prev) => (prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }));
  }, [serverSide, setPaginationState]);

  // Responsive columns: hide by priority when the container is narrow, unless the user chose otherwise.
  const rootRef = useRef<HTMLDivElement>(null);
  const width = useElementWidth(rootRef);
  const effectiveVisibility = useMemo(() => {
    if (!width) return columnVisibility;
    const auto: VisibilityState = {};
    const collect = (cols: DataTableColumn<TData>[]) => {
      for (const col of cols) {
        const meta = col.meta as DataTableColumnMeta | undefined;
        const id = col.id ?? ("accessorKey" in col ? String(col.accessorKey) : undefined);
        if (id && meta?.hideBelow && width < meta.hideBelow) auto[id] = false;
      }
    };
    collect(userColumns);
    return { ...auto, ...columnVisibility };
  }, [width, columnVisibility, userColumns]);

  const columns = useMemo<DataTableColumn<TData>[]>(() => {
    const leading: DataTableColumn<TData>[] = [];
    if (renderExpandedRow) {
      leading.push({
        id: EXPAND_ID,
        size: 44,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
        enableColumnFilter: false,
        enableGlobalFilter: false,
        enablePinning: false,
        header: () => <span className="forge-sr-only">Expand</span>,
        cell: ({ row }) =>
          row.getCanExpand() ? (
            <button
              type="button"
              tabIndex={-1}
              className="forge-dt-expander"
              aria-expanded={row.getIsExpanded()}
              aria-label={row.getIsExpanded() ? "Collapse row" : "Expand row"}
              onClick={row.getToggleExpandedHandler()}
            >
              <span aria-hidden="true">{row.getIsExpanded() ? "▾" : "▸"}</span>
            </button>
          ) : null,
      });
    }
    if (selectable) {
      leading.push({
        id: SELECT_ID,
        size: 44,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
        enableColumnFilter: false,
        enableGlobalFilter: false,
        enablePinning: false,
        header: ({ table }) => (
          <IndeterminateCheckbox
            aria-label="Select all rows on this page"
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <IndeterminateCheckbox
            aria-label="Select row"
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
      });
    }
    return [...leading, ...userColumns];
  }, [userColumns, selectable, renderExpandedRow]);

  const table = useReactTable<TData>({
    data,
    columns,
    getRowId,
    defaultColumn: {
      size: 160,
      minSize: 64,
      sortDescFirst: false,
      cell: ({ getValue }) => formatDefaultCell(getValue()),
    },
    state: {
      sorting,
      globalFilter,
      columnFilters,
      pagination: paginationState,
      rowSelection,
      columnVisibility: effectiveVisibility,
      columnPinning,
      columnSizing,
      expanded,
    },
    onSortingChange: (updater) => {
      setSorting(updater);
      resetPage();
    },
    onGlobalFilterChange: (updater) => {
      setGlobalFilter(updater);
      resetPage();
    },
    onColumnFiltersChange: (updater) => {
      setColumnFilters(updater);
      resetPage();
    },
    onPaginationChange: setPaginationState,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    onColumnSizingChange: setColumnSizing,
    onExpandedChange: setExpanded,
    manualSorting: serverSide,
    manualFiltering: serverSide,
    manualPagination: serverSide,
    rowCount: serverSide ? rowCount : undefined,
    pageCount: serverSide && rowCount === undefined ? -1 : undefined,
    enableRowSelection: selectable ? true : false,
    enableColumnResizing: Boolean(resizableColumns),
    columnResizeMode: "onChange",
    enableColumnPinning: Boolean(pinnableColumns),
    globalFilterFn: "includesString",
    getRowCanExpand: renderExpandedRow ? (getRowCanExpand ?? (() => true)) : undefined,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
    getExpandedRowModel: renderExpandedRow ? getExpandedRowModel() : undefined,
  });

  const rows = table.getRowModel().rows;
  const visibleColumns = table.getVisibleLeafColumns();
  const colCount = visibleColumns.length;
  const colIndexById = useMemo(
    () => new Map(visibleColumns.map((column, index) => [column.id, index])),
    [visibleColumns],
  );
  const headerGroup = table.getHeaderGroups()[0];
  const filterRowCount = filterable ? 1 : 0;
  const headerRows = 1 + filterRowCount;

  // Search box with optional debounce.
  const [searchText, setSearchText] = useState(globalFilter);
  useEffect(() => setSearchText(globalFilter), [globalFilter]);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(searchTimer.current), []);
  const onSearchChange = (value: string) => {
    setSearchText(value);
    clearTimeout(searchTimer.current);
    if (searchDebounce > 0) {
      searchTimer.current = setTimeout(() => table.setGlobalFilter(value), searchDebounce);
    } else {
      table.setGlobalFilter(value);
    }
  };

  // Selection callback.
  const selectedRows = table.getSelectedRowModel().rows;
  const onSelectedRowsChange = props.onSelectedRowsChange;
  const selectionKey = Object.keys(rowSelection)
    .filter((key) => rowSelection[key])
    .join("|");
  const firstSelectionRender = useRef(true);
  useEffect(() => {
    if (firstSelectionRender.current) {
      firstSelectionRender.current = false;
      return;
    }
    onSelectedRowsChange?.(table.getSelectedRowModel().flatRows.map((row) => row.original));
    const count = selectionKey ? selectionKey.split("|").length : 0;
    announce(
      count === 0 ? "No rows selected" : `${count} ${count === 1 ? "row" : "rows"} selected`,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionKey]);

  // Announce sort changes.
  const sortKey = sorting.map((s) => `${s.id}:${s.desc ? "desc" : "asc"}`).join(",");
  const firstSortRender = useRef(true);
  useEffect(() => {
    if (firstSortRender.current) {
      firstSortRender.current = false;
      return;
    }
    const first = sorting[0];
    if (!first) return announce("Sorting cleared");
    const column = table.getColumn(first.id);
    const header = column?.columnDef.header;
    announce(
      `Sorted by ${typeof header === "string" ? header : first.id}, ${first.desc ? "descending" : "ascending"}`,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortKey]);

  // Virtualization keeps the DOM small for large datasets.
  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: virtualized ? rows.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: virtualConfig?.overscan ?? 8,
    scrollPaddingStart: rowHeight,
    initialRect: { width: 0, height: typeof maxHeight === "number" ? maxHeight : 480 },
  });
  const virtualItems = virtualized ? virtualizer.getVirtualItems() : null;
  const renderedRows = virtualItems ? virtualItems.map((item) => rows[item.index]!) : rows;
  const padTop = virtualItems?.length ? virtualItems[0]!.start : 0;
  const padBottom = virtualItems?.length
    ? virtualizer.getTotalSize() - virtualItems[virtualItems.length - 1]!.end
    : 0;

  // Roving-tabindex keyboard navigation across header and body cells.
  const gridRef = useRef<HTMLTableElement>(null);
  const [active, setActive] = useState<GridPosition>({ row: 0, col: 0 });
  const focusRequested = useRef(false);
  const activeRow = Math.min(active.row, rows.length);
  const activeCol = Math.min(active.col, Math.max(colCount - 1, 0));

  useEffect(() => {
    if (!focusRequested.current) return;
    const target = gridRef.current?.querySelector<HTMLElement>(
      `[data-grid-cell][data-row="${activeRow}"][data-col="${activeCol}"]`,
    );
    if (target) {
      focusRequested.current = false;
      target.focus();
    }
  });

  const moveTo = (row: number, col: number) => {
    const nextRow = Math.min(Math.max(row, 0), rows.length);
    const nextCol = Math.min(Math.max(col, 0), colCount - 1);
    focusRequested.current = true;
    setActive({ row: nextRow, col: nextCol });
    if (virtualized && nextRow > 0) virtualizer.scrollToIndex(nextRow - 1, { align: "auto" });
  };

  const onGridKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    const target = event.target as HTMLElement;
    const cell = target.closest<HTMLElement>("[data-grid-cell]");
    if (!cell) return;
    const onCell = target === cell;
    if (
      !onCell &&
      /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName) &&
      (target as HTMLInputElement).type !== "checkbox"
    ) {
      return;
    }
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    const pageJump = Math.max(
      1,
      Math.floor((scrollRef.current?.clientHeight || 400) / rowHeight) - 1,
    );

    switch (event.key) {
      case "ArrowDown":
        if (event.altKey) return;
        moveTo(row + 1, col);
        break;
      case "ArrowUp":
        if (event.altKey) return;
        moveTo(row - 1, col);
        break;
      case "ArrowRight":
        if (event.altKey && row === 0) {
          resizeByKey(col, 16);
          break;
        }
        moveTo(row, col + 1);
        break;
      case "ArrowLeft":
        if (event.altKey && row === 0) {
          resizeByKey(col, -16);
          break;
        }
        moveTo(row, col - 1);
        break;
      case "Home":
        moveTo(event.ctrlKey || event.metaKey ? 0 : row, 0);
        break;
      case "End":
        moveTo(event.ctrlKey || event.metaKey ? rows.length : row, colCount - 1);
        break;
      case "PageDown":
        moveTo(row + pageJump, col);
        break;
      case "PageUp":
        moveTo(row - pageJump, col);
        break;
      case "Enter":
      case " ": {
        if (!onCell) return;
        const action = cell.querySelector<HTMLElement>("button, input[type='checkbox'], a[href]");
        if (action) {
          action.click();
        } else if (row > 0) {
          const tableRow = rows[row - 1]!;
          if (event.key === " " && selectable && tableRow.getCanSelect()) tableRow.toggleSelected();
          else if (event.key === "Enter") onRowClick?.(tableRow.original);
        }
        break;
      }
      default:
        return;
    }
    event.preventDefault();
  };

  const resizeByKey = (col: number, delta: number) => {
    if (!resizableColumns) return;
    const column = visibleColumns[col];
    if (!column || !column.getCanResize()) return;
    const min = column.columnDef.minSize ?? 64;
    const max = column.columnDef.maxSize ?? 800;
    table.setColumnSizing((prev) => ({
      ...prev,
      [column.id]: Math.min(max, Math.max(min, column.getSize() + delta)),
    }));
  };

  const onGridFocus = (event: React.FocusEvent<HTMLTableElement>) => {
    const cell = (event.target as HTMLElement).closest<HTMLElement>("[data-grid-cell]");
    if (!cell) return;
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    setActive((prev) => (prev.row === row && prev.col === col ? prev : { row, col }));
  };

  // CSV export.
  const exportCsv = () => {
    const exportRows =
      selectedRows.length > 0 ? selectedRows : table.getPrePaginationRowModel().rows;
    const exportColumns = visibleColumns.filter(
      (column) => column.id !== SELECT_ID && column.id !== EXPAND_ID,
    );
    const csv = toCsv(exportRows, exportColumns);
    const filename = (typeof exportable === "object" ? exportable.filename : undefined) ?? "export";
    if (onExport) onExport({ csv, rows: exportRows.map((row) => row.original), filename });
    else downloadCsv(csv, filename);
  };

  const showSkeleton = loading && data.length === 0;
  const skeletonCount = loadingRows ?? Math.min(paginationState.pageSize, 8);
  const hasError = Boolean(error);
  const isEmpty = !loading && !hasError && rows.length === 0;
  const totalRows = serverSide ? rowCount : table.getPrePaginationRowModel().rows.length;
  const hasToolbar = Boolean(
    searchable || columnMenu || exportable || toolbar || selectedRows.length > 0,
  );
  const scrollStyle: CSSProperties = {
    maxHeight: maxHeight ?? (virtualized ? 480 : undefined),
  };

  const bodyAriaRowOffset =
    headerRows + (serverSide ? paginationState.pageIndex * paginationState.pageSize : 0);
  const ariaRowCount = (totalRows ?? rows.length) + headerRows;

  return (
    <div
      ref={rootRef}
      className={cn("forge-dt", className, classNames.root)}
      data-density={density}
      data-slot="root"
    >
      {hasToolbar ? (
        <div className={cn("forge-dt-toolbar", classNames.toolbar)} data-slot="toolbar">
          {searchable ? (
            <input
              type="search"
              className="forge-input forge-dt-search"
              value={searchText}
              placeholder={searchConfig?.placeholder ?? "Search…"}
              aria-label="Search table"
              onChange={(event) => onSearchChange(event.target.value)}
            />
          ) : null}
          {selectable && selectedRows.length > 0 ? (
            <span className="forge-dt-selected" aria-hidden="true">
              {selectedRows.length} selected
            </span>
          ) : null}
          <span className="forge-dt-spacer" />
          {toolbar}
          {exportable ? (
            <Button size="sm" onClick={exportCsv}>
              Export CSV
            </Button>
          ) : null}
          {columnMenu ? <ColumnMenu table={table} pinnable={pinnableColumns} /> : null}
        </div>
      ) : null}

      <div
        ref={scrollRef}
        className={cn("forge-dt-scroll", classNames.scroll)}
        style={scrollStyle}
        data-slot="scroll"
      >
        <table
          ref={gridRef}
          role="grid"
          className={cn("forge-dt-table", classNames.table)}
          style={{ width: table.getTotalSize() }}
          aria-label={props["aria-label"]}
          aria-rowcount={ariaRowCount}
          aria-colcount={colCount}
          aria-busy={loading || undefined}
          aria-multiselectable={selectable || undefined}
          onKeyDown={onGridKeyDown}
          onFocus={onGridFocus}
        >
          {caption ? <caption className="forge-sr-only">{caption}</caption> : null}
          <thead className={cn("forge-dt-head", classNames.header)}>
            {headerGroup ? (
              <tr role="row" aria-rowindex={1}>
                {headerGroup.headers.map((header) => {
                  const column = header.column;
                  const meta = column.columnDef.meta as DataTableColumnMeta | undefined;
                  const col = colIndexById.get(column.id) ?? 0;
                  const sorted = column.getIsSorted();
                  const canSort = column.getCanSort();
                  const isActive = activeRow === 0 && activeCol === col;
                  return (
                    <th
                      key={header.id}
                      role="columnheader"
                      scope="col"
                      data-grid-cell=""
                      data-row={0}
                      data-col={col}
                      data-pinned={column.getIsPinned() || undefined}
                      data-align={meta?.align}
                      tabIndex={isActive ? 0 : -1}
                      aria-colindex={col + 1}
                      aria-sort={
                        canSort
                          ? sorted === "asc"
                            ? "ascending"
                            : sorted === "desc"
                              ? "descending"
                              : "none"
                          : undefined
                      }
                      className={meta?.className}
                      style={pinnedStyle(column)}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          tabIndex={-1}
                          className="forge-dt-sort"
                          onClick={column.getToggleSortingHandler()}
                        >
                          {flexRender(column.columnDef.header, header.getContext())}
                          <span className="forge-dt-sort-icon" aria-hidden="true">
                            {sorted === "asc" ? "↑" : sorted === "desc" ? "↓" : "↕"}
                          </span>
                        </button>
                      ) : (
                        flexRender(column.columnDef.header, header.getContext())
                      )}
                      {resizableColumns && column.getCanResize() ? (
                        <span
                          aria-hidden="true"
                          className="forge-dt-resizer"
                          data-resizing={column.getIsResizing() || undefined}
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          onDoubleClick={() => column.resetSize()}
                        />
                      ) : null}
                    </th>
                  );
                })}
              </tr>
            ) : null}
            {filterable && headerGroup ? (
              <tr role="row" aria-rowindex={2} className="forge-dt-filter-row">
                {headerGroup.headers.map((header) => {
                  const column = header.column;
                  const meta = column.columnDef.meta as DataTableColumnMeta | undefined;
                  const name =
                    typeof column.columnDef.header === "string"
                      ? column.columnDef.header
                      : column.id;
                  return (
                    <td
                      key={header.id}
                      role="gridcell"
                      data-pinned={column.getIsPinned() || undefined}
                      style={pinnedStyle(column)}
                    >
                      {column.getCanFilter() ? (
                        meta?.filterOptions ? (
                          <select
                            className="forge-input"
                            aria-label={`Filter ${name}`}
                            value={(column.getFilterValue() as string | undefined) ?? ""}
                            onChange={(event) =>
                              column.setFilterValue(event.target.value || undefined)
                            }
                          >
                            <option value="">All</option>
                            {meta.filterOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            className="forge-input"
                            aria-label={`Filter ${name}`}
                            placeholder="Filter…"
                            value={(column.getFilterValue() as string | undefined) ?? ""}
                            onChange={(event) =>
                              column.setFilterValue(event.target.value || undefined)
                            }
                          />
                        )
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ) : null}
          </thead>
          <tbody>
            {padTop > 0 ? (
              <tr role="presentation" aria-hidden="true" style={{ height: padTop }}>
                <td colSpan={colCount} className="forge-dt-spacer-cell" />
              </tr>
            ) : null}

            {showSkeleton
              ? Array.from({ length: skeletonCount }, (_, index) => (
                  <tr
                    key={`skeleton-${index}`}
                    role="row"
                    className="forge-dt-skeleton-row"
                    aria-hidden="true"
                  >
                    {visibleColumns.map((column) => (
                      <td key={column.id} style={pinnedStyle(column)}>
                        <span className="forge-dt-skeleton" />
                      </td>
                    ))}
                  </tr>
                ))
              : null}

            {hasError ? (
              <tr role="row">
                <td role="gridcell" colSpan={colCount} className="forge-dt-message">
                  <div role="alert" className="forge-dt-error">
                    <span>{error}</span>
                    {onRetry ? (
                      <Button size="sm" onClick={onRetry}>
                        Try again
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ) : null}

            {isEmpty ? (
              <tr role="row">
                <td role="gridcell" colSpan={colCount} className="forge-dt-message">
                  {emptyState ?? (
                    <span>
                      {globalFilter || columnFilters.length
                        ? "No results match your filters."
                        : "No data to show."}
                    </span>
                  )}
                </td>
              </tr>
            ) : null}

            {!hasError
              ? renderedRows.map((row) => {
                  const rowIndex = rows.indexOf(row);
                  const selected = row.getIsSelected();
                  return (
                    <RowFragment key={row.id}>
                      <tr
                        role="row"
                        aria-rowindex={bodyAriaRowOffset + rowIndex + 1}
                        aria-selected={selectable ? selected : undefined}
                        data-selected={selected || undefined}
                        data-loading={loading || undefined}
                        data-clickable={onRowClick ? "" : undefined}
                        className={classNames.row}
                        style={virtualized ? { height: rowHeight } : undefined}
                        onClick={(event) => {
                          if (!onRowClick) return;
                          if (
                            (event.target as HTMLElement).closest("button, input, a, select, label")
                          )
                            return;
                          onRowClick(row.original);
                        }}
                      >
                        {row.getVisibleCells().map((cell) => {
                          const column = cell.column;
                          const meta = column.columnDef.meta as DataTableColumnMeta | undefined;
                          const col = colIndexById.get(column.id) ?? 0;
                          const isActive = activeRow === rowIndex + 1 && activeCol === col;
                          return (
                            <td
                              key={cell.id}
                              role="gridcell"
                              data-grid-cell=""
                              data-row={rowIndex + 1}
                              data-col={col}
                              data-pinned={column.getIsPinned() || undefined}
                              data-align={meta?.align}
                              aria-colindex={col + 1}
                              tabIndex={isActive ? 0 : -1}
                              className={cn(classNames.cell, meta?.className)}
                              style={pinnedStyle(column)}
                            >
                              {flexRender(column.columnDef.cell, cell.getContext())}
                            </td>
                          );
                        })}
                      </tr>
                      {renderExpandedRow && row.getIsExpanded() ? (
                        <tr role="row" className="forge-dt-detail-row">
                          <td role="gridcell" colSpan={colCount}>
                            {renderExpandedRow(row)}
                          </td>
                        </tr>
                      ) : null}
                    </RowFragment>
                  );
                })
              : null}

            {padBottom > 0 ? (
              <tr role="presentation" aria-hidden="true" style={{ height: padBottom }}>
                <td colSpan={colCount} className="forge-dt-spacer-cell" />
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {loading ? (
        <p role="status" className="forge-sr-only">
          Loading data
        </p>
      ) : null}

      {pagination ? (
        <Pagination
          table={table}
          pageSizeOptions={pageSizeOptions}
          totalRows={totalRows}
          visibleRows={rows.length}
          className={classNames.pagination}
        />
      ) : null}
    </div>
  );
}

function RowFragment({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
