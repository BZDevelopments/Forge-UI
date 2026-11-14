import type { ReactNode } from "react";
import { useFieldArray, useFormContext, type FieldValues } from "react-hook-form";
import { Button, announce, cn } from "@forge-ui/core";

export interface FieldArrayHelpers {
  remove: () => void;
  move: (to: number) => void;
  index: number;
  count: number;
}

export interface FieldArrayProps {
  /** Path to the array in the form values. */
  name: string;
  legend?: ReactNode;
  /** Value for a newly added row. */
  defaultItem: FieldValues | string | number;
  /** Renders one row's fields. Use `${name}.${index}.field` for field names. */
  children: (index: number, helpers: FieldArrayHelpers) => ReactNode;
  /** Singular noun used in button labels and announcements. Defaults to "item". */
  itemLabel?: string;
  addLabel?: string;
  /** Rows cannot be removed below this count. */
  min?: number;
  max?: number;
  className?: string;
}

function messageAt(errors: unknown, name: string): string | undefined {
  let cursor = errors as Record<string, unknown> | undefined;
  for (const part of name.split("."))
    cursor = cursor?.[part] as Record<string, unknown> | undefined;
  const root = cursor?.root as { message?: string } | undefined;
  return root?.message ?? (typeof cursor?.message === "string" ? cursor.message : undefined);
}

/** A repeatable group of fields with add and remove controls. */
export function FieldArray({
  name,
  legend,
  defaultItem,
  children,
  itemLabel = "item",
  addLabel,
  min = 0,
  max,
  className,
}: FieldArrayProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext();
  const { fields, append, remove, move } = useFieldArray({ control, name });
  const arrayError = messageAt(errors, name);
  const atMax = max !== undefined && fields.length >= max;

  return (
    <fieldset
      className={cn("forge-field-array", className)}
      aria-describedby={arrayError ? `${name}-array-error` : undefined}
    >
      {legend ? <legend className="forge-field-label">{legend}</legend> : null}
      <ul className="forge-field-array-list">
        {fields.map((item, index) => (
          <li
            key={item.id}
            className="forge-field-array-row"
            aria-label={`${itemLabel} ${index + 1}`}
          >
            <div className="forge-field-array-fields">
              {children(index, {
                index,
                count: fields.length,
                remove: () => remove(index),
                move: (to) => move(index, to),
              })}
            </div>
            <Button
              size="sm"
              variant="ghost"
              disabled={fields.length <= min}
              aria-label={`Remove ${itemLabel} ${index + 1}`}
              onClick={() => {
                remove(index);
                announce(`${itemLabel} ${index + 1} removed. ${fields.length - 1} remaining.`);
              }}
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>
      {arrayError ? (
        <p id={`${name}-array-error`} role="alert" className="forge-field-error">
          {arrayError}
        </p>
      ) : null}
      <Button
        size="sm"
        disabled={atMax}
        onClick={() => {
          append(defaultItem as never);
          announce(`${itemLabel} ${fields.length + 1} added.`);
        }}
      >
        {addLabel ?? `Add ${itemLabel}`}
      </Button>
    </fieldset>
  );
}
