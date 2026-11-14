import { z } from "zod";
import { Field, Form, FormStep, FormSteps } from "@forge-ui/form";
import { notify } from "@forge-ui/notifications";

const schema = z.object({
  name: z.string().min(1, "Enter your name"),
  email: z.string().email("Enter a valid email"),
  plan: z.string().min(1, "Choose a plan"),
  seats: z
    .number({ invalid_type_error: "Enter a number of seats" })
    .int()
    .min(1, "At least one seat"),
});

export default function FormWizard() {
  return (
    <Form
      schema={schema}
      defaultValues={{ name: "", email: "", plan: "", seats: 1 }}
      aria-label="Set up your workspace"
      onSubmit={(values) =>
        notify.success(`Workspace created for ${values.name} on the ${values.plan} plan`)
      }
    >
      <FormSteps submitLabel="Create workspace">
        <FormStep
          id="you"
          title="About you"
          description="We use this to set up your account."
          fields={["name", "email"]}
        >
          <Field name="name" label="Full name" autoComplete="name" required />
          <Field name="email" label="Work email" type="email" autoComplete="email" required />
        </FormStep>
        <FormStep id="plan" title="Plan" fields={["plan", "seats"]}>
          <Field name="plan" label="Plan" required>
            {({ field, controlProps }) => (
              <select
                {...controlProps}
                className="forge-input"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              >
                <option value="">Choose…</option>
                <option value="Starter">Starter</option>
                <option value="Team">Team</option>
              </select>
            )}
          </Field>
          <Field name="seats" label="Seats" type="number" required />
        </FormStep>
        <FormStep id="review" title="Review">
          <p className="text-sm text-forge-muted">
            Everything is saved as you go. Go back to change anything, or create the workspace.
          </p>
        </FormStep>
      </FormSteps>
    </Form>
  );
}
