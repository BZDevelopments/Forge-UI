import type { Column, Row } from "@tanstack/react-table";
import type { DataTableColumnMeta } from "./types";

const FORMULA_TRIGGER = /^[=+\-@\t\r]/;

/**
 * Serializes one cell. Text that spreadsheets would treat as a formula is prefixed with `'`
 * so exported data cannot execute when opened in Excel or Sheets (CSV injection).
 */
export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let text: string;
  if (value instanceof Date) text = Number.isNaN(value.getTime()) ? "" : value.toISOString();
  else if (typeof value === "object") text = JSON.stringify(value);
  else text = String(value);

  if (typeof value === "string" && FORMULA_TRIGGER.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function headerLabel<TData>(column: Column<TData, unknown>): string {
  const meta = column.columnDef.meta as DataTableColumnMeta | undefined;
  if (meta?.exportHeader) return meta.exportHeader;
  const header = column.columnDef.header;
  return typeof header === "string" ? header : column.id;
}

/** Builds a CSV string from rows and the columns to include. */
export function toCsv<TData>(rows: Row<TData>[], columns: Column<TData, unknown>[]): string {
  const lines = [columns.map((column) => escapeCsvCell(headerLabel(column))).join(",")];
  for (const row of rows) {
    lines.push(
      columns
        .map((column) => {
          const meta = column.columnDef.meta as DataTableColumnMeta | undefined;
          const custom = meta?.exportValue as ((original: TData) => unknown) | undefined;
          return escapeCsvCell(custom ? custom(row.original) : row.getValue(column.id));
        })
        .join(","),
    );
  }
  return lines.join("\r\n");
}

/** Triggers a browser download. A byte-order mark keeps non-ASCII text intact in Excel. */
export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
