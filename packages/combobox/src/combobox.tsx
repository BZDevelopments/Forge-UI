import { useRef, type ChangeEvent } from "react";
import { Spinner, cn, useControllableState } from "@forge-ui/core";
import { ComboboxPopover } from "./popover";
import { ComboboxList } from "./listbox";
import { useCombobox } from "./use-combobox";
import type { ComboboxOption, ComboboxProps } from "./types";

/**
 * Searchable single-select. Type to filter, use the arrow keys to move, Enter to choose.
 * Works with a static `options` array or an async `loadOptions` function.
 */
export function Combobox(props: ComboboxProps) {
  const {
    value: valueProp,
    defaultValue = null,
    onValueChange,
    clearable,
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

  // `onValueChange` is called manually below so it can also receive the option object.
  const [value, setValue] = useControllableState<string | null>({ value: valueProp, defaultValue });
  const inputRef = useRef<HTMLInputElement>(null);
  const select = (next: string | null, option: ComboboxOption | null) => {
    setValue(next);
    onValueChange?.(next, option);
  };

  const state = useCombobox({
    ...props,
    isSelected: (option) => option.value === value,
    onChoose: (option) => select(option.value, option),
  });

  const current = value;
  const selected = current ? state.lookup(current) : undefined;
  const displayValue = state.typing ? state.query : (selected?.label ?? "");

  const onChange = (event: ChangeEvent<HTMLInputElement>) =>
    state.onInputChange(event.target.value);

  return (
    <ComboboxPopover
      open={state.open && !disabled}
      onOpenChange={state.setOpen}
      className={cn("forge-cb", className)}
      data-disabled={disabled}
      onFieldPointerDown={() => {
        if (!disabled && !state.open) state.setOpen(true);
      }}
      content={
        <ComboboxList
          state={state}
          label={props["aria-label"] ?? placeholder ?? "Options"}
          labelledBy={props["aria-labelledby"]}
          isSelected={(option) => option.value === current}
          renderOption={renderOption}
          emptyMessage={emptyMessage}
          loadingMessage={loadingMessage}
          errorMessage={errorMessage}
          virtualizeThreshold={virtualizeThreshold}
        />
      }
    >
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
        aria-required={required || undefined}
        autoComplete="off"
        spellCheck={false}
        className="forge-input forge-cb-input"
        placeholder={placeholder}
        disabled={disabled}
        value={displayValue}
        onChange={onChange}
        onKeyDown={state.onInputKeyDown}
        onFocus={(event) => event.currentTarget.select()}
        onBlur={() => state.setOpen(false)}
      />
      <span className="forge-cb-adornments">
        {state.busy && state.open ? <Spinner label={null} /> : null}
        {clearable && current && !disabled ? (
          <button
            type="button"
            className="forge-cb-clear"
            aria-label="Clear selection"
            onClick={() => {
              select(null, null);
              inputRef.current?.focus();
            }}
          >
            <span aria-hidden="true">×</span>
          </button>
        ) : null}
        <span className="forge-cb-chevron" aria-hidden="true">
          ▾
        </span>
      </span>
      {name ? <input type="hidden" name={name} value={current ?? ""} /> : null}
    </ComboboxPopover>
  );
}
