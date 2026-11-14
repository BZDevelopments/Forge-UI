import type { ReactNode } from "react";

export interface ComboboxOption {
  /** Unique within the list. Used as the form value. */
  value: string;
  label: string;
  description?: string;
  group?: string;
  disabled?: boolean;
  icon?: ReactNode;
  /** Extra search terms that are not displayed. */
  keywords?: string[];
  /** Anything you want to read back in `renderOption` or callbacks. */
  data?: unknown;
}

export interface OptionState {
  selected: boolean;
  active: boolean;
  /** Matched character positions within the label, for highlighting. */
  matches: number[];
}

export interface ComboboxSharedProps {
  options?: ComboboxOption[];
  /** Fetch options for the current query. When set, filtering is left to your server. */
  loadOptions?: (query: string, signal: AbortSignal) => Promise<ComboboxOption[]>;
  /** Debounce for `loadOptions`, in milliseconds. Defaults to 250. */
  loadDebounceMs?: number;
  /** Options for values that are selected but not in the current list, such as a saved server value. */
  selectedOptions?: ComboboxOption[];
  /** Custom local filter. Return `true` to keep an option. Ignored when `loadOptions` is set. */
  filter?: (option: ComboboxOption, query: string) => boolean;
  /** Show the loading state from outside. */
  loading?: boolean;
  emptyMessage?: ReactNode;
  loadingMessage?: ReactNode;
  errorMessage?: ReactNode;
  renderOption?: (option: ComboboxOption, state: OptionState) => ReactNode;
  /** Turn on windowing for lists at least this long. Defaults to 200. */
  virtualizeThreshold?: number;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Renders hidden inputs so the value posts with a native form. */
  name?: string;
  id?: string;
  required?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  className?: string;
}

export interface ComboboxProps extends ComboboxSharedProps {
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null, option: ComboboxOption | null) => void;
  clearable?: boolean;
}
