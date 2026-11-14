import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactElement,
  type ReactNode,
} from "react";
import { useFormContext, type FieldErrors } from "react-hook-form";
import { Button, announce, cn, useControllableState } from "@forge-ui/core";
import { useForgeFormContext } from "./context";

export interface FormStepProps {
  /** Unique within the form. */
  id: string;
  title: string;
  description?: string;
  /** Field names validated before moving on. Leave empty to skip validation for this step. */
  fields?: string[];
  children: ReactNode;
}

/** Declares one step inside `FormSteps`. It renders only while it is the current step. */
export function FormStep({ children }: FormStepProps) {
  return <>{children}</>;
}

interface StepsApi {
  stepId: string;
  index: number;
  count: number;
  isFirst: boolean;
  isLast: boolean;
  next: () => Promise<boolean>;
  back: () => void;
  goTo: (id: string) => void;
}

const StepsContext = createContext<StepsApi | null>(null);

/** Read step state for custom navigation or progress UI. */
export function useFormSteps(): StepsApi {
  const context = useContext(StepsContext);
  if (!context) throw new Error("useFormSteps must be used inside <FormSteps>.");
  return context;
}

export interface FormStepsProps {
  children: ReactNode;
  /** Controlled current step id. */
  step?: string;
  defaultStep?: string;
  onStepChange?: (id: string) => void;
  nextLabel?: string;
  backLabel?: string;
  submitLabel?: string;
  /** Replace the default Back/Continue/Submit row. */
  renderActions?: (api: StepsApi) => ReactNode;
  className?: string;
}

function topLevelKey(path: string): string {
  return path.split(".")[0] ?? path;
}

/**
 * Splits a form into steps. Each step validates its own fields before continuing,
 * values are kept when going back, and a failed final submit jumps to the first step with an error.
 */
export function FormSteps({
  children,
  step: stepProp,
  defaultStep,
  onStepChange,
  nextLabel = "Continue",
  backLabel = "Back",
  submitLabel = "Submit",
  renderActions,
  className,
}: FormStepsProps) {
  const steps = Children.toArray(children).filter(
    (child): child is ReactElement<FormStepProps> =>
      isValidElement(child) && child.type === FormStep,
  );
  const ids = steps.map((child) => child.props.id);
  const [stepId, setStepId] = useControllableState<string>({
    value: stepProp,
    defaultValue: defaultStep ?? ids[0] ?? "",
    onChange: onStepChange,
  });
  const index = Math.max(0, ids.indexOf(stepId));
  const current = steps[index];
  const { trigger, formState } = useFormContext();
  const { stepController, formRef } = useForgeFormContext();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  const focusInvalid = () =>
    requestAnimationFrame(() =>
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
    );

  const next = async (): Promise<boolean> => {
    const fields = current?.props.fields;
    const valid = fields && fields.length > 0 ? await trigger(fields) : true;
    if (!valid) {
      focusInvalid();
      announce("Please fix the errors before continuing.", "assertive");
      return false;
    }
    const target = ids[index + 1];
    if (target) setStepId(target);
    return Boolean(target);
  };
  const back = () => {
    const target = ids[index - 1];
    if (target) setStepId(target);
  };

  const api: StepsApi = {
    stepId: current?.props.id ?? "",
    index,
    count: steps.length,
    isFirst: index === 0,
    isLast: index === steps.length - 1,
    next,
    back,
    goTo: (id) => ids.includes(id) && setStepId(id),
  };

  // Keep the form's Enter key and invalid-submit handling pointed at the latest step state.
  const latest = useRef(api);
  latest.current = api;
  const stepsRef = useRef(steps);
  stepsRef.current = steps;
  useLayoutEffect(() => {
    stepController.current = {
      intercept: () => {
        if (latest.current.isLast) return false;
        void latest.current.next();
        return true;
      },
      onInvalid: (errors: FieldErrors) => {
        const invalid = new Set(Object.keys(errors).map(topLevelKey));
        const target = stepsRef.current.find((child) =>
          child.props.fields?.some((field) => invalid.has(topLevelKey(field))),
        );
        if (target && target.props.id !== latest.current.stepId) {
          setStepId(target.props.id);
          focusInvalid();
          return true;
        }
        return false;
      },
    };
    return () => {
      stepController.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepController, setStepId]);

  // Move focus to the step heading and announce it, but not on first render.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
    announce(`Step ${index + 1} of ${steps.length}: ${current?.props.title ?? ""}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepId]);

  const memo = useMemo(() => api, [api.stepId, api.index, api.count]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!current) return null;

  return (
    <StepsContext.Provider value={{ ...memo, next, back, goTo: api.goTo }}>
      <div className={cn("forge-steps", className)}>
        <ol className="forge-steps-list" aria-label="Progress">
          {steps.map((child, i) => (
            <li
              key={child.props.id}
              className="forge-steps-item"
              aria-current={i === index ? "step" : undefined}
              data-state={i < index ? "complete" : i === index ? "current" : "upcoming"}
            >
              <span className="forge-steps-marker" aria-hidden="true">
                {i < index ? "✓" : i + 1}
              </span>
              <span className="forge-steps-title">
                {child.props.title}
                {i < index ? <span className="forge-sr-only"> (completed)</span> : null}
              </span>
            </li>
          ))}
        </ol>

        {/* The handler only reacts to Enter pressed inside a focusable input in this step. */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
        <section
          className="forge-steps-panel"
          aria-labelledby={`${current.props.id}-heading`}
          onKeyDown={(event) => {
            // Browsers only submit on Enter when the form has a submit button, which early steps do not.
            // Make Enter behave like Continue so keyboard users are not stuck.
            const target = event.target as HTMLElement;
            if (event.key !== "Enter" || api.isLast || event.nativeEvent.isComposing) return;
            if (target.tagName !== "INPUT" || (target as HTMLInputElement).type === "checkbox")
              return;
            event.preventDefault();
            void next();
          }}
        >
          <h2
            id={`${current.props.id}-heading`}
            ref={headingRef}
            tabIndex={-1}
            className="forge-steps-heading"
          >
            {current.props.title}
          </h2>
          {current.props.description ? (
            <p className="forge-steps-description">{current.props.description}</p>
          ) : null}
          {current}
        </section>

        {renderActions ? (
          renderActions(api)
        ) : (
          <div className="forge-steps-actions">
            <Button disabled={api.isFirst} onClick={back}>
              {backLabel}
            </Button>
            {api.isLast ? (
              <Button type="submit" variant="solid" loading={formState.isSubmitting}>
                {submitLabel}
              </Button>
            ) : (
              <Button variant="solid" onClick={() => void next()}>
                {nextLabel}
              </Button>
            )}
          </div>
        )}
      </div>
    </StepsContext.Provider>
  );
}
