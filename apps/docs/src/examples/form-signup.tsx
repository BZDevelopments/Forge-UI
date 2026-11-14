import { z } from "zod";
import { Field, Form, FormError, ResetButton, SubmitButton } from "@forge-ui/form";
import { notify } from "@forge-ui/notifications";
import { sleep } from "./_data";

// Zod, Valibot, and ArkType all work: Forge UI accepts any Standard Schema validator.
const schema = z.object({
  email: z.string().min(1, "Enter your email").email("That does not look like an email address"),
  username: z.string().min(3, "Use at least 3 characters"),
  password: z.string().min(8, "Use at least 8 characters"),
  business: z.boolean(),
  company: z.string().optional(),
  terms: z.literal(true, { errorMap: () => ({ message: "Accept the terms to continue" }) }),
});

// Replace with a request to your API.
const taken = new Set(["admin", "ada", "root"]);
async function checkUsername(value: unknown) {
  await sleep(400);
  return taken.has(String(value).toLowerCase()) ? "That username is taken" : undefined;
}

export default function FormSignup() {
  return (
    <Form
      schema={schema}
      defaultValues={{
        email: "",
        username: "",
        password: "",
        business: false,
        company: "",
        terms: false,
      }}
      aria-label="Create an account"
      onSubmit={async (values) => {
        await sleep(900);
        if (values.username === "boom")
          throw new Error("We could not create the account. Please try again.");
        notify.success(`Welcome, ${values.username}`);
      }}
    >
      <FormError />
      <Field name="email" label="Email" type="email" autoComplete="email" required />
      <Field
        name="username"
        label="Username"
        description="Try “ada” to see async validation. Try “boom” to see a submit error."
        validate={checkUsername}
        validateDebounceMs={300}
        required
      />
      <Field
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        required
      />
      <Field name="business" label="This is a business account" type="checkbox" />
      <Field name="company" label="Company name" when={(values) => Boolean(values.business)} />
      <Field name="terms" label="I accept the terms of service" type="checkbox" />
      <div className="flex gap-2">
        <SubmitButton>Create account</SubmitButton>
        <ResetButton />
      </div>
    </Form>
  );
}
