import { useState } from "react";
import DataTableBasic from "../examples/data-table-basic";

const THEMES = [
  { id: "indigo", label: "Indigo", color: "#4f46e5" },
  { id: "teal", label: "Teal", color: "#0f766e" },
  { id: "rose", label: "Rose", color: "#be123c" },
] as const;

type ThemeId = (typeof THEMES)[number]["id"];

export function ThemePreview() {
  const [selected, setSelected] = useState<ThemeId>("indigo");

  return (
    <div className="not-prose mt-5">
      <div role="group" aria-label="Choose a preview theme" className="flex flex-wrap gap-2">
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            type="button"
            aria-pressed={selected === theme.id}
            onClick={() => setSelected(theme.id)}
            className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
              selected === theme.id
                ? "border-forge-text font-semibold text-forge-text"
                : "border-forge-border text-forge-muted hover:bg-forge-hover"
            }`}
          >
            <span
              aria-hidden="true"
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: theme.color }}
            />
            {theme.label}
          </button>
        ))}
      </div>

      <div
        className="docs-theme-preview mt-4 rounded-lg border border-forge-border p-3 sm:p-5"
        data-palette={selected}
      >
        <p className="mb-3 text-sm font-medium text-forge-text">Live data table preview</p>
        <div className="overflow-x-auto">
          <DataTableBasic />
        </div>
      </div>
    </div>
  );
}
