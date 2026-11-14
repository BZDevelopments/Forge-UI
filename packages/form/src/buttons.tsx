import type { ReactNode } from "react";
import { useFormContext } from "react-hook-form";
import { Button, cn, type ButtonProps } from "@forge-ui/core";
import { useForgeFormContext } from "./context";

export interface SubmitButtonProps extends Omit<ButtonProps, "type" | "loading"> {
  /** Disable the button until the form has changes. */
  requireDirty?: boolean;
}

/** Submit button that shows a spinner while the form is submitting. */
export function SubmitButton({
  requireDirty,
  disabled,
  variant = "solid",
  ...props
}: SubmitButtonProps) {
  const { formState } = useFormContext();
  return (
    <Button
      {...props}
      type="submit"
      variant={variant}
      loading={formState.isSubmitting}
      disabled={disabled || (requireDirty && !formState.isDirty)}
    />
  );
}

/** Restores default values and clears errors. */
export function ResetButton({
  children = "Reset",
  ...props
}: Omit<ButtonProps, "type"> & { children?: ReactNode }) {
  const { formState } = useFormContext();
  return (
    <Button {...props} type="reset" disabled={props.disabled || formState.isSubmitting}>
      {children}
    </Button>
  );
}

/** Shows the error thrown by `onSubmit`, and any form-level (root) schema error. */
export function FormError({ className }: { className?: string }) {
  const { submitError } = useForgeFormContext();
  const {
    formState: { errors },
  } = useFormContext();
  const rootMessage = (errors.root as { message?: string } | undefined)?.message;
  const message = submitError ?? rootMessage;
  if (!message) return null;
  return (
    <div role="alert" className={cn("forge-form-error", className)}>
      {message}
    </div>
  );
}
