import { useCallback, useInsertionEffect, useRef } from "react";

/**
 * Returns a stable function that always calls the latest `callback`.
 * Handy for event handlers passed to effects or memoized children.
 */
export function useEventCallback<Args extends unknown[], Result>(
  callback: ((...args: Args) => Result) | undefined,
): (...args: Args) => Result | undefined {
  const ref = useRef(callback);
  useInsertionEffect(() => {
    ref.current = callback;
  });
  return useCallback((...args: Args) => ref.current?.(...args), []);
}
