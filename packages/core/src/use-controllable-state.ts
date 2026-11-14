import { useCallback, useRef, useState } from "react";

export interface UseControllableStateOptions<T> {
  /** Controlled value. When defined, the component is controlled. */
  value: T | undefined;
  /** Initial value for uncontrolled usage. */
  defaultValue: T;
  onChange?: (value: T) => void;
}

/**
 * Supports the controlled/uncontrolled pattern used across Forge UI.
 * The setter accepts a value or an updater, and always reports changes through `onChange`.
 */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: UseControllableStateOptions<T>): [T, (next: T | ((prev: T) => T)) => void] {
  const [internal, setInternal] = useState<T>(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? (value as T) : internal;

  const currentRef = useRef(current);
  currentRef.current = current;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const controlledRef = useRef(isControlled);
  controlledRef.current = isControlled;

  const set = useCallback((next: T | ((prev: T) => T)) => {
    const resolved =
      typeof next === "function" ? (next as (prev: T) => T)(currentRef.current) : next;
    if (Object.is(resolved, currentRef.current)) return;
    currentRef.current = resolved;
    if (!controlledRef.current) setInternal(resolved);
    onChangeRef.current?.(resolved);
  }, []);

  return [current, set];
}
