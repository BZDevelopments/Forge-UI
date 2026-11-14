import { useEffect, useRef, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Button, Spinner } from "@forge-ui/core";
import type { ComboboxState, FlatOption } from "./use-combobox";
import type { ComboboxOption, OptionState } from "./types";

export interface ComboboxListProps {
  state: ComboboxState;
  label?: string;
  labelledBy?: string;
  multiple?: boolean;
  isSelected: (option: ComboboxOption) => boolean;
  renderOption?: (option: ComboboxOption, state: OptionState) => ReactNode;
  emptyMessage?: ReactNode;
  loadingMessage?: ReactNode;
  errorMessage?: ReactNode;
  virtualizeThreshold?: number;
}

function Highlight({ text, matches }: { text: string; matches: number[] }) {
  if (matches.length === 0) return <>{text}</>;
  const marked = new Set(matches);
  const parts: ReactNode[] = [];
  let buffer = "";
  let on = false;
  const flush = (key: number) => {
    if (buffer) parts.push(on ? <mark key={key}>{buffer}</mark> : buffer);
    buffer = "";
  };
  for (let i = 0; i < text.length; i++) {
    const hit = marked.has(i);
    if (hit !== on) {
      flush(i);
      on = hit;
    }
    buffer += text[i];
  }
  flush(text.length);
  return <>{parts}</>;
}

type Row =
  | { type: "heading"; key: string; label: string }
  | { type: "option"; key: string; item: FlatOption };

export function ComboboxList({
  state,
  label,
  labelledBy,
  multiple,
  isSelected,
  renderOption,
  emptyMessage = "No options found.",
  loadingMessage = "Loading…",
  errorMessage = "Could not load options.",
  virtualizeThreshold = 200,
}: ComboboxListProps) {
  const { sections, flat, activeValue, listId, optionId, busy, error } = state;
  const listRef = useRef<HTMLDivElement>(null);
  const virtualize = flat.length >= virtualizeThreshold;
  const indexByValue = new Map(flat.map((item) => [item.option.value, item.index]));
  const enabledCount = flat.filter((item) => !item.option.disabled).length;
  const hasDescriptions = flat.some((item) => item.option.description);
  const rowHeight = hasDescriptions ? 52 : 36;

  const rows: Row[] = virtualize
    ? (() => {
        let index = 0;
        return sections.flatMap((section) => {
          const result: Row[] = [];
          if (section.label)
            result.push({ type: "heading", key: `h:${section.key}`, label: section.label });
          for (const item of section.items)
            result.push({
              type: "option",
              key: item.option.value,
              item: { ...item, index: index++ },
            });
          return result;
        });
      })()
    : [];

  const virtualizer = useVirtualizer({
    count: virtualize ? rows.length : 0,
    getScrollElement: () => listRef.current,
    estimateSize: (i) => (rows[i]?.type === "heading" ? 28 : rowHeight),
    overscan: 6,
    initialRect: { width: 0, height: 288 },
  });

  // Keep the active option visible while navigating with the keyboard.
  useEffect(() => {
    if (!activeValue) return;
    if (virtualize) {
      const rowIndex = rows.findIndex(
        (row) => row.type === "option" && row.item.option.value === activeValue,
      );
      if (rowIndex >= 0) virtualizer.scrollToIndex(rowIndex, { align: "auto" });
    } else {
      const index = flat.find((item) => item.option.value === activeValue)?.index;
      if (index !== undefined)
        document.getElementById(optionId(index))?.scrollIntoView?.({ block: "nearest" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeValue]);

  const renderItem = (item: FlatOption, style?: React.CSSProperties) => {
    const { option } = item;
    const selected = isSelected(option);
    const active = option.value === activeValue;
    const optionState: OptionState = { selected, active, matches: item.matches };
    return (
      // Options are not focusable by design: focus stays in the input and `aria-activedescendant`
      // points here (ARIA 1.2 combobox pattern). Keyboard users act through the input.
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus
      <div
        key={option.value}
        id={optionId(item.index)}
        role="option"
        aria-selected={selected}
        aria-disabled={option.disabled || undefined}
        aria-setsize={virtualize ? enabledCount : undefined}
        aria-posinset={virtualize ? item.index + 1 : undefined}
        data-active={active || undefined}
        data-selected={selected || undefined}
        data-disabled={option.disabled || undefined}
        className="forge-cb-option"
        style={style}
        onPointerMove={() => !active && !option.disabled && state.setActiveValue(option.value)}
        onClick={() => state.choose(option)}
      >
        {renderOption ? (
          renderOption(option, optionState)
        ) : (
          <>
            {option.icon ? (
              <span className="forge-cb-icon" aria-hidden="true">
                {option.icon}
              </span>
            ) : null}
            <span className="forge-cb-text">
              <span className="forge-cb-label">
                <Highlight text={option.label} matches={item.matches} />
              </span>
              {option.description ? (
                <span className="forge-cb-desc">{option.description}</span>
              ) : null}
            </span>
            {selected ? (
              <span className="forge-cb-check" aria-hidden="true">
                ✓
              </span>
            ) : null}
          </>
        )}
      </div>
    );
  };

  return (
    // The listbox is operated from the input via `aria-activedescendant`, so it is intentionally not focusable.
    // eslint-disable-next-line jsx-a11y/interactive-supports-focus
    <div
      ref={listRef}
      id={listId}
      role="listbox"
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      aria-multiselectable={multiple || undefined}
      aria-busy={busy || undefined}
      className="forge-cb-list"
      data-virtualized={virtualize || undefined}
      // Clicking an option must not blur the input.
      onMouseDown={(event) => event.preventDefault()}
    >
      {virtualize ? (
        <div
          role="presentation"
          style={{ height: virtualizer.getTotalSize(), position: "relative" }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index]!;
            const style = {
              position: "absolute" as const,
              top: 0,
              left: 0,
              right: 0,
              height: virtualRow.size,
              transform: `translateY(${virtualRow.start}px)`,
            };
            return row.type === "heading" ? (
              <div key={row.key} role="presentation" className="forge-cb-heading" style={style}>
                {row.label}
              </div>
            ) : (
              renderItem(row.item, style)
            );
          })}
        </div>
      ) : (
        sections.map((section) => {
          const headingId = `${listId}-${section.key.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
          return (
            <div
              key={section.key}
              role={section.label ? "group" : "presentation"}
              aria-labelledby={section.label ? headingId : undefined}
            >
              {section.label ? (
                <div id={headingId} role="presentation" className="forge-cb-heading">
                  {section.label}
                </div>
              ) : null}
              {section.items.map((item) =>
                renderItem({ ...item, index: indexByValue.get(item.option.value)! }),
              )}
            </div>
          );
        })
      )}

      {busy ? (
        <div role="status" className="forge-cb-status">
          <Spinner label={null} /> <span>{loadingMessage}</span>
        </div>
      ) : null}
      {error && !busy ? (
        <div role="alert" className="forge-cb-status" data-error="">
          <span>{errorMessage}</span>
          <Button size="sm" onClick={state.retry}>
            Retry
          </Button>
        </div>
      ) : null}
      {state.isEmpty && !error ? (
        <div role="status" className="forge-cb-status">
          {emptyMessage}
        </div>
      ) : null}
    </div>
  );
}
