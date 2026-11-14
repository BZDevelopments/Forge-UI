import type { Control, FieldValues } from "react-hook-form";

/** A field-level check. Returns an error message, or nothing when the value is fine. */
export type FieldValidator = (value: unknown, values: FieldValues) => Promise<string | undefined>;

export type ValidatorRegistry = Map<string, FieldValidator>;

/**
 * React Hook Form ignores per-field `rules` once a resolver is in use, which is how schema validation works.
 * Forge UI keeps field-level validators in a registry tied to the form's control, and runs them from the
 * resolver after the schema, so schema rules and `validate` functions work together.
 */
const registries = new WeakMap<object, ValidatorRegistry>();

export function attachRegistry(control: Control<never>, registry: ValidatorRegistry): void {
  registries.set(control, registry);
}

export function registryFor(control: Control<FieldValues>): ValidatorRegistry | undefined {
  return registries.get(control);
}

export function getByPath(source: unknown, path: string): unknown {
  let cursor = source as Record<string, unknown> | undefined;
  for (const part of path.split(".")) {
    if (cursor === null || typeof cursor !== "object") return undefined;
    cursor = cursor[part] as Record<string, unknown> | undefined;
  }
  return cursor;
}
