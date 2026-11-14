import { useEffect, useId, useRef, type ReactNode } from "react";
import {
  Controller,
  useFormContext,
  useWatch,
  type ControllerFieldState,
  type ControllerRenderProps,
  type FieldValues,
} from "react-hook-form";
import { cn } from "@forge-ui/core";
import { registryFor } from "./validators";

export interface FieldControlProps {
  id: string;
  name: string;
  "aria-invalid": true | undefined;
  "aria-describedby": string | undefined;
  "aria-required": true | undefined;
}

export interface FieldRenderProps {
  field: ControllerRenderProps<FieldValues, string>;
  fieldState: ControllerFieldState;
  /** Spread these on your control so labels, errors, and descriptions are wired up. */
  controlProps: FieldControlProps;
}

export interface FieldProps {
  /** Dot path into the form values, such as `email` or `items.0.name`. */
  name: string;
  label?: ReactNode;
  description?: ReactNode;
  /** Marks the field as required for assistive tech and sighted users. Validation still comes from your schema. */
  required?: boolean;
  /** Keep the label for screen readers only. */
  hideLabel?: boolean;
  type?:
    | "text"
    | "email"
    | "password"
    | "number"
    | "tel"
    | "url"
    | "date"
    | "search"
    | "checkbox"
    | "textarea";
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  rows?: number;
  /** Field-level validation, including async checks. Return a message to fail, or nothing to pass. */
  validate?: (
    value: unknown,
    values: FieldValues,
  ) => string | undefined | void | Promise<string | undefined | void>;
  /** Wait this long after the last keystroke before running `validate`. Defaults to 0. */
  validateDebounceMs?: number;
  /** Only render (and validate) the field while this returns `true`. Hidden fields drop their value. */
  when?: (values: FieldValues) => boolean;
  /** Render your own control, for example a `Combobox`. */
  children?: (props: FieldRenderProps) => ReactNode;
  className?: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function useLatest<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

function FieldBase({
  name,
  label,
  description,
  required,
  hideLabel,
  type = "text",
  placeholder,
  autoComplete,
  disabled,
  rows = 4,
  validate,
  validateDebounceMs = 0,
  when,
  children,
  className,
}: FieldProps) {
  const { control, getValues } = useFormContext();
  const id = useId();
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  const run = async (value: unknown, values: FieldValues): Promise<string | undefined> => {
    if (validateDebounceMs > 0) {
      await sleep(validateDebounceMs);
      // The user kept typing. The newer value will be validated on its own.
      if (!Object.is(getValues(name), value)) return undefined;
    }
    return (await validate?.(value, values)) || undefined;
  };

  // Forms made with `useForgeForm` run validators from the resolver, next to the schema.
  // For a plain React Hook Form instance without a resolver, fall back to native `rules`.
  const registry = registryFor(control);
  const latestRun = useLatest(run);
  useEffect(() => {
    if (!validate || !registry) return;
    registry.set(name, (value, values) => latestRun.current(value, values));
    return () => {
      registry.delete(name);
    };
  }, [registry, name, Boolean(validate), latestRun]); // eslint-disable-line react-hooks/exhaustive-deps

  const rules =
    validate && !registry
      ? {
          validate: async (value: unknown, values: FieldValues) =>
            (await run(value, values)) ?? true,
        }
      : undefined;

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      // Conditional fields should not leave stale values behind when they disappear.
      shouldUnregister={Boolean(when)}
      render={({ field, fieldState }) => {
        const message = fieldState.error?.message;
        const describedBy =
          [description ? descriptionId : null, message ? errorId : null]
            .filter(Boolean)
            .join(" ") || undefined;
        const controlProps: FieldControlProps = {
          id,
          name: field.name,
          "aria-invalid": message ? true : undefined,
          "aria-describedby": describedBy,
          "aria-required": required ? true : undefined,
        };

        let control: ReactNode;
        if (children) {
          control = children({ field, fieldState, controlProps });
        } else if (type === "textarea") {
          control = (
            <textarea
              {...controlProps}
              ref={field.ref}
              className="forge-input forge-field-textarea"
              rows={rows}
              placeholder={placeholder}
              disabled={disabled}
              value={(field.value as string | undefined) ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          );
        } else if (type === "checkbox") {
          control = (
            <input
              {...controlProps}
              ref={field.ref}
              type="checkbox"
              className="forge-field-checkbox"
              disabled={disabled}
              checked={Boolean(field.value)}
              onChange={(event) => field.onChange(event.target.checked)}
              onBlur={field.onBlur}
            />
          );
        } else {
          control = (
            <input
              {...controlProps}
              ref={field.ref}
              type={type}
              className="forge-input"
              placeholder={placeholder}
              autoComplete={autoComplete}
              disabled={disabled}
              value={(field.value as string | number | undefined) ?? ""}
              onChange={(event) => {
                const raw = event.target.value;
                field.onChange(type === "number" ? (raw === "" ? undefined : Number(raw)) : raw);
              }}
              onBlur={field.onBlur}
            />
          );
        }

        const labelNode = label ? (
          <label htmlFor={id} className={hideLabel ? "forge-sr-only" : "forge-field-label"}>
            {label}
            {required ? (
              <span aria-hidden="true" className="forge-field-required">
                {" "}
                *
              </span>
            ) : null}
          </label>
        ) : null;

        return (
          <div
            className={cn("forge-field", type === "checkbox" && "forge-field-inline", className)}
            data-invalid={message ? "" : undefined}
          >
            {type === "checkbox" ? (
              <>
                {control}
                {labelNode}
              </>
            ) : (
              <>
                {labelNode}
                {control}
              </>
            )}
            {description ? (
              <p id={descriptionId} className="forge-field-description">
                {description}
              </p>
            ) : null}
            {message ? (
              <p id={errorId} role="alert" className="forge-field-error">
                {message}
              </p>
            ) : null}
          </div>
        );
      }}
    />
  );
}

function ConditionalField(props: FieldProps) {
  const { control } = useFormContext();
  const values = useWatch({ control });
  if (!props.when!(values as FieldValues)) return null;
  return <FieldBase {...props} />;
}

/** A labelled form control with accessible errors and descriptions. */
export function Field(props: FieldProps) {
  return props.when ? <ConditionalField {...props} /> : <FieldBase {...props} />;
}

/** Renders children only while `when` is true. Use it for layout around conditional fields. */
export function Show({
  when,
  children,
}: {
  when: (values: FieldValues) => boolean;
  children: ReactNode;
}) {
  const { control } = useFormContext();
  const values = useWatch({ control });
  return when(values as FieldValues) ? <>{children}</> : null;
}
