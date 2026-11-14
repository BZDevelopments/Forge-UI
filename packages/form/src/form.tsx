import { useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  FormProvider,
  useForm,
  type DefaultValues,
  type FieldErrors,
  type FieldValues,
  type Mode,
  type UseFormReturn,
} from "react-hook-form";
import { announce, cn } from "@forge-ui/core";
import { standardSchemaResolver } from "./resolver";
import { ForgeFormContext, type StepController } from "./context";
import { attachRegistry, type ValidatorRegistry } from "./validators";
import type { StandardSchemaV1 } from "./standard-schema";

export interface UseForgeFormOptions<TValues extends FieldValues> {
  /** Any Standard Schema validator (Zod, Valibot, ArkType). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema?: StandardSchemaV1<any, any>;
  defaultValues?: DefaultValues<TValues>;
  /** Values controlled from outside, for example loaded from a server. Updating them resets the form. */
  values?: TValues;
  /** When fields are first validated. Defaults to `onTouched`: on blur, then on every change. */
  mode?: Mode;
}

/** Creates the form instance. Use it when you need `watch`, `setValue`, or `reset` outside of `<Form>`. */
export function useForgeForm<TValues extends FieldValues = FieldValues>(
  options: UseForgeFormOptions<TValues> = {},
): UseFormReturn<TValues> {
  const validators = useRef<ValidatorRegistry>(new Map());
  // Always use the resolver: it runs the schema and any field-level `validate` functions together.
  const resolver = useMemo(
    () => standardSchemaResolver<TValues>(options.schema, { validators: validators.current }),
    [options.schema],
  );
  const form = useForm<TValues>({
    resolver,
    defaultValues: options.defaultValues,
    values: options.values,
    mode: options.mode ?? "onTouched",
    reValidateMode: "onChange",
    // Forge UI focuses the first invalid control itself, so custom inputs that do not forward refs still work.
    shouldFocusError: false,
  });
  attachRegistry(form.control as never, validators.current);
  return form;
}

export interface FormProps<
  TValues extends FieldValues = FieldValues,
> extends UseForgeFormOptions<TValues> {
  /** Use an instance from `useForgeForm` instead of letting `<Form>` create one. */
  form?: UseFormReturn<TValues>;
  /**
   * Runs with validated values. Throw or reject to show a form-level error;
   * use `form.setError` to attach server errors to fields.
   */
  onSubmit: (values: TValues, form: UseFormReturn<TValues>) => unknown;
  onSubmitError?: (error: unknown) => void;
  /** Reset to the submitted values after a successful submit, which clears the dirty state. */
  resetOnSuccess?: boolean;
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : "Something went wrong. Please try again.";
}

function FormBody<TValues extends FieldValues>({
  form,
  onSubmit,
  onSubmitError,
  resetOnSuccess,
  children,
  className,
  ...aria
}: FormProps<TValues> & { form: UseFormReturn<TValues> }) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const stepController = useRef<StepController | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const focusFirstInvalid = () => {
    requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    });
  };

  const submit = form.handleSubmit(
    async (values) => {
      setSubmitError(null);
      try {
        await onSubmit(values, form);
        if (resetOnSuccess) form.reset(values);
      } catch (error) {
        const message = errorMessage(error);
        setSubmitError(message);
        announce(message, "assertive");
        onSubmitError?.(error);
      }
    },
    (errors: FieldErrors<TValues>) => {
      const handledByStep = stepController.current?.onInvalid(errors as FieldErrors) ?? false;
      if (!handledByStep) focusFirstInvalid();
      announce("The form has errors. Please review the highlighted fields.", "assertive");
    },
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (stepController.current?.intercept()) return;
    void submit(event);
  };

  return (
    <ForgeFormContext.Provider value={{ submitError, setSubmitError, stepController, formRef }}>
      <FormProvider {...form}>
        <form
          ref={formRef}
          noValidate
          className={cn("forge-form", className)}
          onSubmit={handleSubmit}
          onReset={(event) => {
            event.preventDefault();
            setSubmitError(null);
            form.reset();
          }}
          aria-busy={form.formState.isSubmitting || undefined}
          {...aria}
        >
          {children}
        </form>
      </FormProvider>
    </ForgeFormContext.Provider>
  );
}

function InternalForm<TValues extends FieldValues>(props: FormProps<TValues>) {
  const form = useForgeForm<TValues>(props);
  return <FormBody {...props} form={form} />;
}

/**
 * A form with schema validation, accessible errors, and submit handling.
 * Compose it with `Field`, `FieldArray`, and `FormSteps`.
 */
export function Form<TValues extends FieldValues = FieldValues>(props: FormProps<TValues>) {
  if (props.form) return <FormBody {...props} form={props.form} />;
  return <InternalForm {...props} />;
}
