import type { Table } from "@tanstack/react-table";
import { Button } from "@forge-ui/core";

interface PaginationProps<TData> {
  table: Table<TData>;
  pageSizeOptions: number[];
  totalRows: number | undefined;
  /** Rows currently on screen, used to detect the last page when the server total is unknown. */
  visibleRows: number;
  className?: string;
}

export function Pagination<TData>({
  table,
  pageSizeOptions,
  totalRows,
  visibleRows,
  className,
}: PaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const unknownTotal = totalRows === undefined;
  const pageCount = unknownTotal ? undefined : Math.max(1, table.getPageCount());
  const first = visibleRows === 0 ? 0 : pageIndex * pageSize + 1;
  const last = pageIndex * pageSize + visibleRows;
  const canNext = unknownTotal ? visibleRows >= pageSize : table.getCanNextPage();

  return (
    <div
      className={className ? `forge-dt-pagination ${className}` : "forge-dt-pagination"}
      data-slot="pagination"
    >
      <p className="forge-dt-count">
        {unknownTotal ? `${first}–${last}` : `${first}–${last} of ${totalRows}`}
      </p>
      <label className="forge-dt-page-size">
        <span>Rows per page</span>
        <select
          className="forge-input"
          value={pageSize}
          onChange={(event) => table.setPageSize(Number(event.target.value))}
        >
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <nav className="forge-dt-pager" aria-label="Pagination">
        <Button
          size="sm"
          aria-label="First page"
          disabled={pageIndex === 0}
          onClick={() => table.setPageIndex(0)}
        >
          «
        </Button>
        <Button
          size="sm"
          aria-label="Previous page"
          disabled={pageIndex === 0}
          onClick={() => table.previousPage()}
        >
          ‹
        </Button>
        <span className="forge-dt-page" aria-live="polite">
          Page {pageIndex + 1}
          {pageCount ? ` of ${pageCount}` : ""}
        </span>
        <Button
          size="sm"
          aria-label="Next page"
          disabled={!canNext}
          onClick={() => table.nextPage()}
        >
          ›
        </Button>
        {pageCount ? (
          <Button
            size="sm"
            aria-label="Last page"
            disabled={pageIndex >= pageCount - 1}
            onClick={() => table.setPageIndex(pageCount - 1)}
          >
            »
          </Button>
        ) : null}
      </nav>
    </div>
  );
}
