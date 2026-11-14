import { useCallback, useId, useRef, useState } from "react";
import type { Table } from "@tanstack/react-table";
import { Button } from "@forge-ui/core";
import { useDismiss } from "./use-dismiss";

export function ColumnMenu<TData>({
  table,
  pinnable,
}: {
  table: Table<TData>;
  pinnable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const dismiss = useCallback((reason: "escape" | "outside") => {
    setOpen(false);
    if (reason === "escape") triggerRef.current?.focus();
  }, []);
  useDismiss(open, rootRef, dismiss);

  const columns = table.getAllLeafColumns().filter((column) => column.getCanHide());
  if (columns.length === 0) return null;

  return (
    <div className="forge-dt-menu" ref={rootRef}>
      <Button
        ref={triggerRef}
        size="sm"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        Columns
      </Button>
      {open ? (
        <div
          className="forge-popover forge-dt-menu-panel"
          id={menuId}
          role="group"
          aria-label="Visible columns"
        >
          {columns.map((column) => {
            const header = column.columnDef.header;
            const name = typeof header === "string" ? header : column.id;
            const pinned = column.getIsPinned() || "none";
            return (
              <div key={column.id} className="forge-dt-menu-item">
                <label>
                  <input
                    type="checkbox"
                    checked={column.getIsVisible()}
                    onChange={column.getToggleVisibilityHandler()}
                  />
                  <span>{name}</span>
                </label>
                {pinnable && column.getCanPin() ? (
                  <select
                    className="forge-input forge-dt-pin"
                    aria-label={`Pin ${name}`}
                    value={pinned}
                    onChange={(event) => {
                      const value = event.target.value;
                      column.pin(value === "none" ? false : (value as "left" | "right"));
                    }}
                  >
                    <option value="none">Not pinned</option>
                    <option value="left">Pin left</option>
                    <option value="right">Pin right</option>
                  </select>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
