import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useControllableState } from "@forge-ui/core";
import { filterOptions, groupOptions, type FilteredOption, type Section } from "./filter";
import type { ComboboxOption, ComboboxSharedProps } from "./types";

export interface UseComboboxOptions extends ComboboxSharedProps {
  /** Called when the user chooses an option with the keyboard or pointer. */
  onChoose: (option: ComboboxOption) => void;
  /** Called by Backspace on an empty input. Used by multi-select to remove the last chip. */
  onBackspaceEmpty?: () => void;
  /** Keep the list open after choosing. Multi-select sets this. */
  keepOpenOnChoose?: boolean;
  isSelected: (option: ComboboxOption) => boolean;
}

export interface FlatOption extends FilteredOption {
  index: number;
}

export function useCombobox(props: UseComboboxOptions) {
  const {
    options = [],
    loadOptions,
    loadDebounceMs = 250,
    selectedOptions,
    filter,
    loading: loadingProp = false,
    onChoose,
    onBackspaceEmpty,
    keepOpenOnChoose = false,
    isSelected,
  } = props;

  const [open, setOpen] = useControllableState({
    value: props.open,
    defaultValue: props.defaultOpen ?? false,
    onChange: props.onOpenChange,
  });
  const [query, setQuery] = useState("");
  const [typing, setTyping] = useState(false);
  const [remote, setRemote] = useState<ComboboxOption[] | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [error, setError] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const [activeValue, setActiveValue] = useState<string | null>(null);
  const listId = useId();

  // Remember every option we have seen so selected values keep their labels when the list changes.
  const cache = useRef(new Map<string, ComboboxOption>());
  for (const option of selectedOptions ?? []) cache.current.set(option.value, option);
  for (const option of options) cache.current.set(option.value, option);
  for (const option of remote ?? []) cache.current.set(option.value, option);
  const lookup = useCallback((value: string) => cache.current.get(value), []);

  const searchTerm = typing ? query : "";

  useEffect(() => {
    if (!open || !loadOptions) return;
    const controller = new AbortController();
    setRemoteLoading(true);
    setError(false);
    const timer = setTimeout(
      () => {
        loadOptions(searchTerm, controller.signal)
          .then((result) => {
            if (!controller.signal.aborted) setRemote(result);
          })
          .catch(() => {
            if (!controller.signal.aborted) {
              setRemote([]);
              setError(true);
            }
          })
          .finally(() => {
            if (!controller.signal.aborted) setRemoteLoading(false);
          });
      },
      remote === null ? 0 : loadDebounceMs,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // `remote` is only read to skip the debounce on the first fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, searchTerm, loadOptions, loadDebounceMs, retryToken]);

  const source = loadOptions ? (remote ?? options) : options;
  const filtered = useMemo(
    () =>
      loadOptions
        ? source.map((option) => ({ option, matches: [] as number[] }))
        : filterOptions(source, searchTerm, filter),
    [loadOptions, source, searchTerm, filter],
  );
  const sections: Section[] = useMemo(
    () => groupOptions(filtered, Boolean(searchTerm.trim()) && !loadOptions),
    [filtered, searchTerm, loadOptions],
  );
  const flat: FlatOption[] = useMemo(() => {
    let index = 0;
    return sections.flatMap((section) =>
      section.items.map((item) => ({ ...item, index: index++ })),
    );
  }, [sections]);

  const enabled = useMemo(() => flat.filter((item) => !item.option.disabled), [flat]);

  // Keep a valid active option as the list changes. Prefer the selected one when opening.
  useEffect(() => {
    if (!open) return;
    if (activeValue && enabled.some((item) => item.option.value === activeValue)) return;
    const selected = enabled.find((item) => isSelected(item.option));
    setActiveValue((searchTerm ? enabled[0] : (selected ?? enabled[0]))?.option.value ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, enabled, searchTerm]);

  useEffect(() => {
    if (!open) {
      setActiveValue(null);
      setTyping(false);
      setQuery("");
    }
  }, [open]);

  const activeOption = enabled.find((item) => item.option.value === activeValue);
  const optionId = (index: number) => `${listId}-option-${index}`;
  const activeId = open && activeOption ? optionId(activeOption.index) : undefined;

  const move = (delta: number | "first" | "last") => {
    if (enabled.length === 0) return;
    const current = enabled.findIndex((item) => item.option.value === activeValue);
    let next: number;
    if (delta === "first") next = 0;
    else if (delta === "last") next = enabled.length - 1;
    else next = (current + delta + enabled.length) % enabled.length;
    // Page jumps should clamp instead of wrapping.
    if (typeof delta === "number" && Math.abs(delta) > 1) {
      next = Math.min(enabled.length - 1, Math.max(0, current + delta));
    }
    setActiveValue(enabled[next]!.option.value);
  };

  const choose = (option: ComboboxOption) => {
    if (option.disabled) return;
    onChoose(option);
    if (keepOpenOnChoose) {
      setQuery("");
      setTyping(false);
    } else {
      setOpen(false);
    }
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!open) setOpen(true);
        else move(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        if (!open) setOpen(true);
        else move(-1);
        break;
      case "PageDown":
        if (open) {
          event.preventDefault();
          move(10);
        }
        break;
      case "PageUp":
        if (open) {
          event.preventDefault();
          move(-10);
        }
        break;
      case "Home":
        if (open && (event.ctrlKey || event.metaKey || !typing)) {
          event.preventDefault();
          move("first");
        }
        break;
      case "End":
        if (open && (event.ctrlKey || event.metaKey || !typing)) {
          event.preventDefault();
          move("last");
        }
        break;
      case "Enter":
        if (open && activeOption) {
          event.preventDefault();
          choose(activeOption.option);
        } else if (open) {
          // Do not submit a surrounding form while the list is open.
          event.preventDefault();
        }
        break;
      case "Escape":
        if (open) {
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
        }
        break;
      case "Backspace":
        if (query === "" && onBackspaceEmpty) onBackspaceEmpty();
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  const onInputChange = (value: string) => {
    setQuery(value);
    setTyping(true);
    if (!open) setOpen(true);
  };

  const busy = loadingProp || remoteLoading;

  return {
    open,
    setOpen,
    query,
    typing,
    listId,
    optionId,
    sections,
    flat,
    activeId,
    activeValue,
    setActiveValue,
    busy,
    error,
    retry: () => setRetryToken((token) => token + 1),
    lookup,
    choose,
    onInputKeyDown,
    onInputChange,
    isEmpty: flat.length === 0 && !busy,
  };
}

export type ComboboxState = ReturnType<typeof useCombobox>;
