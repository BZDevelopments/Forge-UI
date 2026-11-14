import type { ReactNode } from "react";

export interface Command {
  /** Unique and stable. Used for recent history, so avoid generating it per render. */
  id: string;
  label: string;
  description?: string;
  /** Extra words that should match the search but are not displayed. */
  keywords?: string[];
  icon?: ReactNode;
  /** Display-only hint such as `mod+shift+p`. Forge UI does not bind it for you. */
  shortcut?: string;
  group?: string;
  disabled?: boolean;
  /** Selecting this command opens a second level of commands. */
  children?: Command[];
  /** Loads second-level commands on demand when selected. */
  loadChildren?: (signal: AbortSignal) => Promise<Command[]>;
  /** Runs when selected. Return a promise to show a pending state; the palette closes when it resolves. */
  onSelect?: (command: Command) => unknown;
  /** Keep the palette open after this command runs. */
  keepOpen?: boolean;
}

export interface RecentOptions {
  /** Maximum number of recent commands kept. Defaults to 5. */
  limit?: number;
  /** localStorage key. Pass `null` to keep history in memory only. */
  storageKey?: string | null;
}

export interface CommandPaletteProps {
  commands: Command[];
  /** Called after any command is selected, in addition to the command's own `onSelect`. */
  onSelect?: (command: Command) => void;

  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Global shortcut that toggles the palette. Defaults to `mod+k`. Pass `false` to disable. */
  shortcut?: string | false;

  /** Fetches extra results for the current query. Results appear under a "Results" heading. */
  loadCommands?: (query: string, signal: AbortSignal) => Promise<Command[]>;
  /** Debounce for `loadCommands`, in milliseconds. Defaults to 200. */
  loadDebounceMs?: number;
  /** Shows the loading state from outside, for example while your own search runs. */
  loading?: boolean;

  /** Remembers recently used commands and shows them first. Pass `true` for defaults. */
  recent?: boolean | RecentOptions;

  /** Accessible name for the dialog. */
  label?: string;
  placeholder?: string;
  emptyMessage?: ReactNode;
  footer?: ReactNode;
  /** Label for the group that holds async results. */
  resultsLabel?: string;
  className?: string;
}
