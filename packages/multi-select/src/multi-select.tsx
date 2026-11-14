import { useRef } from "react";
import { announce, cn, Spinner, useControllableState } from "@forge-ui/core";
import {
  ComboboxList,
  ComboboxPopover,
  useCombobox,
  type ComboboxOption,
  type ComboboxSharedProps,
} from "@forge-ui/combobox";

export interface MultiSelectProps extends ComboboxSharedProps {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (values: string[], options: ComboboxOption[]) => void;
  /** Show a button that clears every selection. */
  clearable?: boolean;
  /** Upper limit on selections. Extra choices are ignored and announced. */
  maxSelected?: number;
  /** Close the list after each choice. Defaults to `false`, which suits picking several items. */
  closeOnSelect?: boolean;
  /** Collapse extra tags into "+N" while the list is closed. */
  maxVisibleTags?: number;
}

const EMPTY: string[] = [];

/**
 * Searchable multi-select with removable tags.
 * Backspace on an empty input removes the last tag, and changes are announced to screen readers.
 */
export function MultiSelect(props: MultiSelectProps) {
  const {
    value: valueProp,
    defaultValue = EMPTY,
    onValueChange,
    clearable,
    maxSelected,
    closeOnSelect = false,
    maxVisibleTags,
    placeholder,
    disabled,
    name,
    id,
    required,
    emptyMessage,
    loadingMessage,
    errorMessage,
    renderOption,
    virtualizeThreshold,
    className,
  } = props;

  const [values, setValues] = useControllableState<string[]>({ value: valueProp, defaultValue });
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = (next: string[]) => {
    setValues(next);
    onValueChange?.(
      next,
      next
        .map((v) => state.lookup(v))
        .filter((option): option is ComboboxOption => Boolean(option)),
    );
  };

  const labelOf = (v: string) => state.lookup(v)?.label ?? v;

  const toggle = (option: ComboboxOption) => {
    if (values.includes(option.value)) {
      commit(values.filter((v) => v !== option.value));
      announce(`${option.label} removed. ${values.length - 1} selected.`);
      return;
    }
    if (maxSelected !== undefined && values.length >= maxSelected) {
      announce(
        `You can select up to ${maxSelected} ${maxSelected === 1 ? "option" : "options"}.`,
        "assertive",
      );
      return;
    }
    commit([...values, option.value]);
    announce(`${option.label} selected. ${values.length + 1} selected.`);
  };

  const remove = (v: string) => {
    commit(values.filter((item) => item !== v));
    announce(`${labelOf(v)} removed. ${values.length - 1} selected.`);
    inputRef.current?.focus();
  };

  const state = useCombobox({
    ...props,
    keepOpenOnChoose: !closeOnSelect,
    isSelected: (option) => values.includes(option.value),
    onChoose: toggle,
    onBackspaceEmpty: () => {
      const last = values[values.length - 1];
      if (last !== undefined && !disabled) {
        commit(values.slice(0, -1));
        announce(`${labelOf(last)} removed. ${values.length - 1} selected.`);
      }
    },
  });

  const collapsed = maxVisibleTags !== undefined && !state.open && values.length > maxVisibleTags;
  const shownTags = collapsed ? values.slice(0, maxVisibleTags) : values;
  const hiddenCount = values.length - shownTags.length;

  return (
    <ComboboxPopover
      open={state.open && !disabled}
      onOpenChange={state.setOpen}
      className={cn("forge-input forge-ms", className)}
      data-disabled={disabled}
      onFieldPointerDown={() => {
        if (disabled) return;
        inputRef.current?.focus();
        state.setOpen(true);
      }}
      content={
        <ComboboxList
          state={state}
          multiple
          label={props["aria-label"] ?? placeholder ?? "Options"}
          labelledBy={props["aria-labelledby"]}
          isSelected={(option) => values.includes(option.value)}
          renderOption={renderOption}
          emptyMessage={emptyMessage}
          loadingMessage={loadingMessage}
          errorMessage={errorMessage}
          virtualizeThreshold={virtualizeThreshold}
        />
      }
    >
      {values.length > 0 ? (
        <ul className="forge-ms-tags" aria-label="Selected options">
          {shownTags.map((v) => (
            <li key={v} className="forge-ms-tag">
              <span>{labelOf(v)}</span>
              {!disabled ? (
                <button
                  type="button"
                  className="forge-ms-remove"
                  aria-label={`Remove ${labelOf(v)}`}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => remove(v)}
                >
                  <span aria-hidden="true">×</span>
                </button>
              ) : null}
            </li>
          ))}
          {hiddenCount > 0 ? (
            <li className="forge-ms-tag forge-ms-more">+{hiddenCount} more</li>
          ) : null}
        </ul>
      ) : null}
      <input
        ref={inputRef}
        id={id}
        role="combobox"
        aria-expanded={state.open && !disabled}
        aria-controls={state.open ? state.listId : undefined}
        aria-activedescendant={state.activeId}
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-label={props["aria-label"]}
        aria-labelledby={props["aria-labelledby"]}
        aria-describedby={props["aria-describedby"]}
        aria-invalid={props["aria-invalid"] || undefined}
        aria-required={required && values.length === 0 ? true : undefined}
        autoComplete="off"
        spellCheck={false}
        className="forge-ms-input"
        placeholder={values.length === 0 ? placeholder : undefined}
        disabled={disabled}
        value={state.query}
        onChange={(event) => state.onInputChange(event.target.value)}
        onKeyDown={state.onInputKeyDown}
        onBlur={() => state.setOpen(false)}
      />
      <span className="forge-ms-adornments">
        {state.busy && state.open ? <Spinner label={null} /> : null}
        {clearable && values.length > 0 && !disabled ? (
          <button
            type="button"
            className="forge-ms-clear"
            aria-label="Clear all selections"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => {
              commit([]);
              announce("All selections cleared");
              inputRef.current?.focus();
            }}
          >
            <span aria-hidden="true">×</span>
          </button>
        ) : null}
      </span>
      {name ? values.map((v) => <input key={v} type="hidden" name={name} value={v} />) : null}
    </ComboboxPopover>
  );
}
