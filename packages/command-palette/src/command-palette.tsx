import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Spinner,
  announce,
  cn,
  formatShortcut,
  matchesShortcut,
  parseShortcut,
  useControllableState,
} from "@forge-ui/core";
import { flattenCommands, searchCommands, type ScoredCommand } from "./search";
import { pushRecent, readRecent, writeRecent } from "./recent";
import type { Command, CommandPaletteProps } from "./types";

interface Section {
  key: string;
  label?: string;
  items: ScoredCommand[];
}

interface Level {
  title: string;
  commands: Command[];
}

function Highlight({ text, indices }: { text: string; indices: number[] }) {
  if (indices.length === 0) return <>{text}</>;
  const marked = new Set(indices);
  const parts: ReactNode[] = [];
  let buffer = "";
  let bufferMarked = false;
  const flush = (key: number) => {
    if (!buffer) return;
    parts.push(bufferMarked ? <mark key={key}>{buffer}</mark> : buffer);
    buffer = "";
  };
  for (let i = 0; i < text.length; i++) {
    const isMarked = marked.has(i);
    if (isMarked !== bufferMarked) {
      flush(i);
      bufferMarked = isMarked;
    }
    buffer += text[i];
  }
  flush(text.length);
  return <>{parts}</>;
}

export function CommandPalette({
  commands,
  onSelect,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  shortcut = "mod+k",
  loadCommands,
  loadDebounceMs = 200,
  loading: loadingProp = false,
  recent,
  label = "Command palette",
  placeholder = "Type a command or search…",
  emptyMessage = "No commands found.",
  footer,
  resultsLabel = "Results",
  className,
}: CommandPaletteProps) {
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const [query, setQuery] = useState("");
  const [stack, setStack] = useState<Level[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remote, setRemote] = useState<Command[]>([]);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [levelLoading, setLevelLoading] = useState(false);

  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const recentConfig = useMemo(
    () => (typeof recent === "object" ? recent : recent ? {} : undefined),
    [recent],
  );
  const recentLimit = recentConfig?.limit ?? 5;
  const storageKey = recentConfig?.storageKey;
  const [recentIds, setRecentIds] = useState<string[]>(() =>
    recentConfig ? readRecent(storageKey) : [],
  );
  const memoryOnly = storageKey === null;

  const close = useCallback(() => setOpen(false), [setOpen]);

  // Without a Dialog.Trigger, Radix cannot know what to return focus to. Remember the opener ourselves.
  // This runs before the dialog's content mounts and takes focus.
  const opener = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (open) opener.current = document.activeElement as HTMLElement | null;
  }, [open]);

  // Reset transient state each time the palette opens or closes.
  useEffect(() => {
    if (!open) {
      setQuery("");
      setStack([]);
      setRemote([]);
      setError(null);
      setActiveId(null);
    }
  }, [open]);

  // Global shortcut.
  useEffect(() => {
    if (shortcut === false) return;
    const parsed = parseShortcut(shortcut);
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented || !matchesShortcut(event, parsed)) return;
      event.preventDefault();
      setOpen((value) => !value);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [shortcut, setOpen]);

  // Async results for the current query.
  useEffect(() => {
    if (!open || !loadCommands || stack.length > 0) {
      setRemote([]);
      setRemoteLoading(false);
      return;
    }
    const controller = new AbortController();
    setRemoteLoading(true);
    const timer = setTimeout(() => {
      loadCommands(query, controller.signal)
        .then((results) => {
          if (controller.signal.aborted) return;
          setRemote(results);
          setError(null);
        })
        .catch((cause: unknown) => {
          if (controller.signal.aborted) return;
          setRemote([]);
          setError(cause instanceof Error ? cause.message : "Could not load results.");
        })
        .finally(() => {
          if (!controller.signal.aborted) setRemoteLoading(false);
        });
    }, loadDebounceMs);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, query, loadCommands, loadDebounceMs, stack.length]);

  const level = stack[stack.length - 1];
  const sourceCommands = level ? level.commands : commands;
  const lookup = useMemo(() => flattenCommands([...commands, ...remote]), [commands, remote]);

  const sections = useMemo<Section[]>(() => {
    const result: Section[] = [];
    const matched = searchCommands(sourceCommands, query);
    const searching = query.trim().length > 0;

    if (!level && !searching && recentConfig && recentIds.length > 0) {
      const items = recentIds
        .map((id) => lookup.get(id))
        .filter((command): command is Command => Boolean(command))
        .map((command) => ({ command, indices: [], score: 0 }));
      if (items.length) result.push({ key: "recent", label: "Recent", items });
    }

    if (searching) {
      // While searching, rank across groups instead of forcing group order.
      if (matched.length) result.push({ key: "matches", items: matched });
    } else {
      const order: string[] = [];
      const byGroup = new Map<string, ScoredCommand[]>();
      for (const item of matched) {
        const group = item.command.group ?? "";
        if (!byGroup.has(group)) {
          byGroup.set(group, []);
          order.push(group);
        }
        byGroup.get(group)!.push(item);
      }
      for (const group of order) {
        result.push({
          key: `group:${group}`,
          label: group || undefined,
          items: byGroup.get(group)!,
        });
      }
    }

    if (!level && remote.length) {
      result.push({
        key: "remote",
        label: resultsLabel,
        items: remote.map((command) => ({ command, indices: [], score: 0 })),
      });
    }
    return result;
  }, [sourceCommands, query, level, recentConfig, recentIds, lookup, remote, resultsLabel]);

  // The same command can appear under Recent and its group, so options get a section-scoped DOM id.
  const flat = useMemo(
    () =>
      sections.flatMap((section) =>
        section.items.map((item) => ({ ...item, optionKey: `${section.key}|${item.command.id}` })),
      ),
    [sections],
  );

  const optionDomId = (optionKey: string) =>
    `${listId}-${optionKey.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  const activeIndex = Math.max(
    0,
    flat.findIndex((item) => item.optionKey === activeId),
  );
  const activeItem = flat[activeIndex];

  useEffect(() => {
    if (flat.length === 0) setActiveId(null);
    else if (!flat.some((item) => item.optionKey === activeId)) setActiveId(flat[0]!.optionKey);
  }, [flat, activeId]);

  useEffect(() => {
    if (!activeItem) return;
    document
      .getElementById(optionDomId(activeItem.optionKey))
      ?.scrollIntoView?.({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeItem?.optionKey]);

  // Tell screen reader users how many results the query produced.
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (!open || remoteLoading) return;
    announce(
      flat.length === 0
        ? "No results"
        : `${flat.length} ${flat.length === 1 ? "result" : "results"} available`,
    );
  }, [flat.length, open, remoteLoading]);

  const remember = (command: Command) => {
    if (!recentConfig) return;
    setRecentIds((previous) => {
      const next = pushRecent(previous, command.id, recentLimit);
      if (!memoryOnly) writeRecent(storageKey, next);
      return next;
    });
  };

  const goBack = () => {
    setStack((previous) => previous.slice(0, -1));
    setQuery("");
    setError(null);
    inputRef.current?.focus();
  };

  const run = async (command: Command) => {
    if (command.disabled || pendingId) return;
    setError(null);

    if (command.children || command.loadChildren) {
      if (command.children) {
        setStack((previous) => [
          ...previous,
          { title: command.label, commands: command.children! },
        ]);
        setQuery("");
        inputRef.current?.focus();
        return;
      }
      setPendingId(command.id);
      setLevelLoading(true);
      try {
        const children = await command.loadChildren!(new AbortController().signal);
        setStack((previous) => [...previous, { title: command.label, commands: children }]);
        setQuery("");
        inputRef.current?.focus();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not load commands.");
      } finally {
        setPendingId(null);
        setLevelLoading(false);
      }
      return;
    }

    try {
      const result = command.onSelect?.(command);
      if (result && typeof (result as PromiseLike<unknown>).then === "function") {
        setPendingId(command.id);
        await result;
      }
      remember(command);
      onSelect?.(command);
      if (!command.keepOpen) close();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That command failed.");
    } finally {
      setPendingId(null);
    }
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    const move = (to: number) => {
      if (flat.length === 0) return;
      const next = (to + flat.length) % flat.length;
      setActiveId(flat[next]!.optionKey);
    };
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        move(activeIndex + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        move(activeIndex - 1);
        break;
      case "Home":
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          move(0);
        }
        break;
      case "End":
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          move(flat.length - 1);
        }
        break;
      case "Enter":
        event.preventDefault();
        if (activeItem) void run(activeItem.command);
        break;
      case "Backspace":
        if (query === "" && stack.length > 0) {
          event.preventDefault();
          goBack();
        }
        break;
    }
  };

  const busy = loadingProp || remoteLoading || levelLoading;
  const showEmpty = flat.length === 0 && !busy;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="forge-cp-overlay" />
        <Dialog.Content
          className={cn("forge-popover forge-cp", className)}
          aria-describedby={undefined}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            inputRef.current?.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const target = opener.current;
            if (target && target.isConnected && target !== document.body) target.focus();
          }}
          onEscapeKeyDown={(event) => {
            // Escape steps back through nested levels before closing.
            if (stack.length > 0) {
              event.preventDefault();
              goBack();
            }
          }}
        >
          <Dialog.Title className="forge-sr-only">{label}</Dialog.Title>

          {stack.length > 0 ? (
            <div className="forge-cp-crumbs" aria-label="Command path">
              <button
                type="button"
                className="forge-cp-back"
                onClick={goBack}
                aria-label="Back to previous commands"
              >
                ‹
              </button>
              <span>{stack.map((entry) => entry.title).join(" / ")}</span>
            </div>
          ) : null}

          <div className="forge-cp-search">
            <input
              ref={inputRef}
              role="combobox"
              aria-expanded="true"
              aria-controls={listId}
              aria-activedescendant={activeItem ? optionDomId(activeItem.optionKey) : undefined}
              aria-autocomplete="list"
              aria-label={label}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              className="forge-cp-input"
              placeholder={placeholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onInputKeyDown}
            />
            {busy ? <Spinner label={null} className="forge-cp-spinner" /> : null}
          </div>

          {/* Focus stays in the input; the listbox is driven by `aria-activedescendant`. */}
          {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus */}
          <div
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={label}
            className="forge-cp-list"
            aria-busy={busy || undefined}
            // Keep focus in the search field so typing, Backspace, and arrow keys keep working after a click.
            onMouseDown={(event) => event.preventDefault()}
          >
            {sections.map((section) => {
              const headingId = `${listId}-${section.key.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
              return (
                <div
                  key={section.key}
                  role="group"
                  aria-labelledby={section.label ? headingId : undefined}
                  className="forge-cp-group"
                >
                  {section.label ? (
                    <div id={headingId} className="forge-cp-heading" role="presentation">
                      {section.label}
                    </div>
                  ) : null}
                  {section.items.map((item) => {
                    const optionKey = `${section.key}|${item.command.id}`;
                    const { command } = item;
                    const isActive = optionKey === activeItem?.optionKey;
                    const isPending = pendingId === command.id;
                    return (
                      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus
                      <div
                        key={optionKey}
                        id={optionDomId(optionKey)}
                        role="option"
                        aria-selected={isActive}
                        aria-disabled={command.disabled || undefined}
                        data-active={isActive || undefined}
                        data-disabled={command.disabled || undefined}
                        className="forge-cp-item"
                        onPointerMove={() =>
                          !isActive && !command.disabled && setActiveId(optionKey)
                        }
                        onClick={() => void run(command)}
                      >
                        {command.icon ? (
                          <span className="forge-cp-icon" aria-hidden="true">
                            {command.icon}
                          </span>
                        ) : null}
                        <span className="forge-cp-text">
                          <span className="forge-cp-label">
                            <Highlight text={command.label} indices={item.indices} />
                          </span>
                          {command.description ? (
                            <span className="forge-cp-desc">{command.description}</span>
                          ) : null}
                        </span>
                        {isPending ? (
                          <Spinner label="Running" className="forge-cp-spinner" />
                        ) : null}
                        {command.children || command.loadChildren ? (
                          <span className="forge-cp-chevron" aria-hidden="true">
                            ›
                          </span>
                        ) : command.shortcut ? (
                          <kbd className="forge-cp-kbd">{formatShortcut(command.shortcut)}</kbd>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {busy && flat.length === 0 ? (
              <div role="status" className="forge-cp-empty">
                Loading…
              </div>
            ) : null}
            {showEmpty ? (
              <div role="status" className="forge-cp-empty">
                {emptyMessage}
              </div>
            ) : null}
          </div>

          {error ? (
            <div role="alert" className="forge-cp-error">
              {error}
            </div>
          ) : null}

          <div className="forge-cp-footer">
            <span className="forge-cp-hints" aria-hidden="true">
              <kbd className="forge-cp-kbd">↑↓</kbd> navigate <kbd className="forge-cp-kbd">↵</kbd>{" "}
              select <kbd className="forge-cp-kbd">esc</kbd> {stack.length > 0 ? "back" : "close"}
            </span>
            {footer}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
