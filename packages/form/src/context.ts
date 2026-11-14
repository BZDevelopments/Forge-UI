import { createContext, useContext, type MutableRefObject } from "react";
import type { FieldErrors } from "react-hook-form";

/** Lets `FormSteps` take over Enter-to-submit and invalid submits. */
export interface StepController {
  /** Return `true` if the submit was handled (for example by moving to the next step). */
  intercept: () => boolean;
  /** Called after a failed submit. Return `true` if focus was handled by jumping to a step. */
  onInvalid: (errors: FieldErrors) => boolean;
}

export interface ForgeFormContextValue {
  submitError: string | null;
  setSubmitError: (message: string | null) => void;
  stepController: MutableRefObject<StepController | null>;
  formRef: MutableRefObject<HTMLFormElement | null>;
}

export const ForgeFormContext = createContext<ForgeFormContextValue | null>(null);

export function useForgeFormContext(): ForgeFormContextValue {
  const context = useContext(ForgeFormContext);
  if (!context) throw new Error("Forge UI form components must be rendered inside <Form>.");
  return context;
}
