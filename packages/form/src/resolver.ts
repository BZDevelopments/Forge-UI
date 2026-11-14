import type { FieldErrors, FieldValues, Resolver } from "react-hook-form";
import type { StandardIssue, StandardSchemaV1 } from "./standard-schema";
import { getByPath, type ValidatorRegistry } from "./validators";

type PathKey = string | number;

function toPath(issue: StandardIssue): PathKey[] {
  return (issue.path ?? []).map((segment) => {
    const key = typeof segment === "object" ? segment.key : segment;
    return typeof key === "symbol" ? String(key) : key;
  });
}

function isError(value: unknown): value is { message: string } {
  return typeof value === "object" && value !== null && "message" in value && "type" in value;
}

/**
 * Places an error at a nested path, creating objects and arrays as needed.
 * When an array and one of its items both fail, the array-level error moves to `.root`,
 * which is where React Hook Form expects it.
 */
function assign(target: Record<string, unknown>, path: PathKey[], message: string): void {
  const error = { type: "validation", message };
  if (path.length === 0) {
    target.root ??= error;
    return;
  }
  let cursor: Record<PathKey, unknown> = target;
  for (let i = 0; i < path.length; i++) {
    const key = path[i]!;
    const last = i === path.length - 1;
    if (last) {
      const existing = cursor[key];
      if (existing === undefined) cursor[key] = error;
      else if (!isError(existing) && typeof existing === "object")
        (existing as Record<string, unknown>).root ??= error;
      return;
    }
    let next = cursor[key];
    if (next === undefined) {
      next = typeof path[i + 1] === "number" ? [] : {};
      cursor[key] = next;
    } else if (isError(next)) {
      // A parent error already exists. Keep it as `.root` and descend alongside it.
      const parentError = next;
      next = typeof path[i + 1] === "number" ? [] : {};
      (next as Record<string, unknown>).root = parentError;
      cursor[key] = next;
    }
    cursor = next as Record<PathKey, unknown>;
  }
}

/** Turns Standard Schema issues into React Hook Form's nested error shape. Keeps the first error per field. */
export function issuesToErrors(issues: ReadonlyArray<StandardIssue>): FieldErrors {
  const errors: Record<string, unknown> = {};
  for (const issue of issues) assign(errors, toPath(issue), issue.message);
  return errors as FieldErrors;
}

function hasErrorAt(errors: Record<string, unknown>, path: string): boolean {
  return getByPath(errors, path) !== undefined;
}

export interface ResolverOptions {
  /** Field-level validators to run after the schema, for fields that passed it. */
  validators?: ValidatorRegistry;
}

/**
 * A React Hook Form resolver for any Standard Schema validator. Works with async schemas.
 * Without a schema it still runs field-level `validate` functions.
 */
export function standardSchemaResolver<TValues extends FieldValues>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema?: StandardSchemaV1<any, any>,
  { validators }: ResolverOptions = {},
): Resolver<TValues> {
  return async (values, _context, options) => {
    const result = schema ? await schema["~standard"].validate(values) : { value: values };
    const errors = (result.issues ? issuesToErrors(result.issues) : {}) as Record<string, unknown>;

    if (validators && validators.size > 0) {
      // Only check the fields RHF is validating now, so typing in one field does not re-run another's async check.
      const names = options?.names as string[] | undefined;
      const pending = [...validators].filter(
        ([name]) => (!names || names.includes(name)) && !hasErrorAt(errors, name),
      );
      const messages = await Promise.all(
        pending.map(([name, validate]) => validate(getByPath(values, name), values as FieldValues)),
      );
      pending.forEach(([name], index) => {
        const message = messages[index];
        if (message)
          assign(
            errors,
            name.split(/\./).map((part) => (/^\d+$/.test(part) ? Number(part) : part)),
            message,
          );
      });
    }

    if (Object.keys(errors).length > 0)
      return { values: {}, errors: errors as FieldErrors<TValues> };
    return { values: ("value" in result ? result.value : values) as TValues, errors: {} };
  };
}
