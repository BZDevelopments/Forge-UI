import type { ComponentDoc } from "./types";
import signup from "../examples/form-signup.tsx?raw";
import wizard from "../examples/form-wizard.tsx?raw";
import array from "../examples/form-array.tsx?raw";
import FormSignup from "../examples/form-signup";
import FormWizard from "../examples/form-wizard";
import FormArray from "../examples/form-array";

export const form: ComponentDoc = {
  slug: "form",
  name: "Form system",
  pkg: "form",
  summary:
    "Schema-driven forms on top of React Hook Form. Bring any Standard Schema validator (Zod, Valibot, ArkType) and get accessible errors, async validation, conditional fields, field arrays, multi-step flows, and submit states.",
  keywords: [
    "form",
    "validation",
    "schema",
    "zod",
    "wizard",
    "steps",
    "field array",
    "react-hook-form",
  ],
  whenToUse: [
    "You need validation messages, focus handling, and error wiring that are right by default.",
    "Your form has several steps, repeating rows, or fields that depend on other fields.",
  ],
  alsoInstall: ["zod"],
  usage: `import { z } from "zod";
import { Form, Field, SubmitButton } from "@forge-ui/form";

const schema = z.object({ email: z.string().email() });

<Form schema={schema} defaultValues={{ email: "" }} onSubmit={save}>
  <Field name="email" label="Email" type="email" />
  <SubmitButton>Save</SubmitButton>
</Form>`,
  examples: [
    {
      id: "signup",
      title: "Validation, async checks, conditional fields, and submit errors",
      description:
        "Errors appear after a field is first blurred, then update as you type. Submitting with errors moves focus to the first invalid field. “ada” is taken (async check, debounced), the company field only exists for business accounts, and the username “boom” makes the submit fail so you can see the form-level error.",
      Component: FormSignup,
      code: signup,
    },
    {
      id: "wizard",
      title: "Multi-step form",
      description:
        "Each step validates its own fields before Continue. Values survive Back. Enter on an early step acts like Continue. If the final submit fails on a field from an earlier step, the form jumps to that step.",
      Component: FormWizard,
      code: wizard,
    },
    {
      id: "field-array",
      title: "Field arrays",
      description:
        "Rows with Add and Remove, min and max, row-level and array-level errors, and announcements as rows change.",
      Component: FormArray,
      code: array,
    },
  ],
  api: [
    {
      title: "Form props",
      rows: [
        {
          name: "schema",
          type: "StandardSchemaV1",
          description: "Any Standard Schema validator. Async schemas work.",
        },
        {
          name: "defaultValues / values",
          type: "object",
          description:
            "Initial values, or values controlled from outside (changing them resets the form).",
        },
        {
          name: "mode",
          type: "Mode",
          default: '"onTouched"',
          description: "When fields first validate. After that they revalidate on every change.",
        },
        {
          name: "onSubmit",
          type: "(values, form) => unknown",
          description:
            "Receives parsed values. Throw or reject to show a form-level error. Use `form.setError` for server field errors.",
        },
        {
          name: "onSubmitError",
          type: "(error) => void",
          description: "Called when `onSubmit` throws.",
        },
        {
          name: "resetOnSuccess",
          type: "boolean",
          default: "false",
          description: "Reset to the submitted values, clearing the dirty state.",
        },
        {
          name: "form",
          type: "UseFormReturn",
          description:
            "An instance from `useForgeForm`, for `watch`, `setValue`, and `reset` outside the form.",
        },
      ],
    },
    {
      title: "Field props",
      rows: [
        {
          name: "name",
          type: "string",
          description: "Dot path, such as `address.street` or `items.0.name`.",
        },
        {
          name: "label / description",
          type: "ReactNode",
          description: "Wired to the control with `htmlFor` and `aria-describedby`.",
        },
        {
          name: "required",
          type: "boolean",
          description:
            "Marks the field required visually and with `aria-required`. Your schema decides validity.",
        },
        {
          name: "type",
          type: "text | email | password | number | tel | url | date | search | checkbox | textarea",
          default: '"text"',
          description: "Built-in controls. `number` stores a number or `undefined`.",
        },
        {
          name: "validate / validateDebounceMs",
          type: "(value, values) => string | undefined | Promise",
          description:
            "Field-level and async checks. Return a message to fail. Debouncing skips stale values.",
        },
        {
          name: "when",
          type: "(values) => boolean",
          description: "Render and validate only while true. Hidden fields drop their value.",
        },
        {
          name: "children",
          type: "({ field, fieldState, controlProps }) => ReactNode",
          description:
            "Render your own control, such as a Combobox. Spread `controlProps` for accessibility wiring.",
        },
      ],
    },
    {
      title: "Other exports",
      rows: [
        {
          name: "FieldArray",
          type: "{ name, legend, defaultItem, children(index), itemLabel, min, max }",
          description: "Repeatable rows with labelled Add and Remove buttons.",
        },
        {
          name: "FormSteps / FormStep",
          type: "{ id, title, fields }",
          description: "Multi-step flow. `fields` lists what to validate before Continue.",
        },
        {
          name: "useFormSteps",
          type: "() => { index, count, next, back, goTo }",
          description: "Custom step navigation or progress UI.",
        },
        {
          name: "SubmitButton / ResetButton / FormError",
          type: "components",
          description:
            "Submit shows a spinner while submitting. FormError shows submit and root errors.",
        },
        {
          name: "standardSchemaResolver",
          type: "(schema) => Resolver",
          description: "Use the resolver with plain React Hook Form.",
        },
        {
          name: "useForgeForm, useFormContext, useWatch",
          type: "hooks",
          description: "Form instance and React Hook Form hooks.",
        },
      ],
    },
  ],
  keyboard: [
    {
      keys: "Tab / Shift+Tab",
      action: "Move between fields. Invalid fields get focus after a failed submit.",
    },
    {
      keys: "Enter",
      action: "Submit. On an early step of a multi-step form, continue to the next step.",
    },
    {
      keys: "Escape",
      action: "Leaves behavior to the focused control (for example a combobox list).",
    },
  ],
  accessibility: [
    "Every control has a visible label tied with `htmlFor`. Descriptions and errors are linked with `aria-describedby`.",
    "Invalid controls get `aria-invalid`. Error messages are alerts, so they are announced when they appear.",
    "Failed submits announce that the form has errors and move focus to the first invalid control, even across steps.",
    'Steps are an ordered list with `aria-current="step"`. Moving between steps focuses the step heading and announces it.',
    "Native browser validation bubbles are turned off (`noValidate`) so messages come from your schema, in your wording.",
  ],
  customization: [
    "Style with `.forge-field-*`, `.forge-steps-*`, and the `--forge-*` variables.",
    "Use the `children` render prop to put any component inside a Field, including the Forge UI combobox and date picker.",
  ],
  mistakes: [
    "Duplicating validation: put rules in the schema, and use `validate` only for checks that need I/O.",
    "Forgetting to forward `field.ref` in custom controls. Forge UI still focuses the first invalid control by its `aria-invalid` attribute, so spread `controlProps`.",
    "Skipping server validation. Client-side checks improve the experience but never secure anything.",
  ],
};
