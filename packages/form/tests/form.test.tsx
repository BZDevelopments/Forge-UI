import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  Field,
  FieldArray,
  Form,
  FormError,
  FormStep,
  FormSteps,
  ResetButton,
  SubmitButton,
  issuesToErrors,
  useForgeForm,
  useFormContext,
  type StandardSchemaV1,
} from "../src";

const signup = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  age: z
    .number({ required_error: "Age is required", invalid_type_error: "Age is required" })
    .min(18, "You must be 18 or older"),
});

const textbox = (name: RegExp | string) => screen.getByRole("textbox", { name });

describe("Form", () => {
  it("shows schema errors after submit, wires aria attributes, and focuses the first invalid field", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <Form schema={signup} defaultValues={{ email: "" }} onSubmit={onSubmit}>
        <Field name="email" label="Email" description="We never share it." required />
        <Field name="age" label="Age" type="number" />
        <SubmitButton>Create account</SubmitButton>
      </Form>,
    );
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Age is required")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    const email = textbox(/Email/);
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAttribute("aria-required", "true");
    expect(email).toHaveAccessibleDescription("We never share it. Email is required");
    await waitFor(() => expect(email).toHaveFocus());
  });

  it("submits parsed values once valid", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <Form schema={signup} onSubmit={onSubmit}>
        <Field name="email" label="Email" />
        <Field name="age" label="Age" type="number" />
        <SubmitButton>Go</SubmitButton>
      </Form>,
    );
    await user.type(textbox("Email"), "ada@example.com");
    await user.type(screen.getByRole("spinbutton", { name: "Age" }), "36");
    await user.click(screen.getByRole("button", { name: "Go" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit.mock.calls[0]![0]).toEqual({ email: "ada@example.com", age: 36 });
  });

  it("validates on blur first, then on every change", async () => {
    const user = userEvent.setup();
    render(
      <Form schema={signup} onSubmit={() => {}}>
        <Field name="email" label="Email" />
      </Form>,
    );
    expect(screen.queryByText("Enter a valid email")).not.toBeInTheDocument();
    await user.type(textbox("Email"), "nope");
    expect(screen.queryByText("Enter a valid email")).not.toBeInTheDocument();
    await user.tab();
    expect(await screen.findByText("Enter a valid email")).toBeInTheDocument();
    await user.type(textbox("Email"), "@example.com");
    await waitFor(() => expect(screen.queryByText("Enter a valid email")).not.toBeInTheDocument());
  });

  it("shows submitting state, disables the button, and blocks double submits", async () => {
    const user = userEvent.setup();
    let finish!: () => void;
    const onSubmit = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    render(
      <Form onSubmit={onSubmit}>
        <SubmitButton>Save</SubmitButton>
      </Form>,
    );
    await user.click(screen.getByRole("button", { name: "Save" }));
    const button = await screen.findByRole("button", { name: "Save" });
    await waitFor(() => expect(button).toBeDisabled());
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(document.querySelector("form")).toHaveAttribute("aria-busy", "true");
    await user.click(button);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    finish();
    await waitFor(() => expect(button).toBeEnabled());
  });

  it("shows an error thrown by onSubmit and keeps the user's input", async () => {
    const user = userEvent.setup();
    const onSubmitError = vi.fn();
    render(
      <Form
        defaultValues={{ name: "Ada" }}
        onSubmit={async () => {
          throw new Error("Server is unavailable");
        }}
        onSubmitError={onSubmitError}
      >
        <FormError />
        <Field name="name" label="Name" />
        <SubmitButton>Save</SubmitButton>
      </Form>,
    );
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(
      await screen.findByText("Server is unavailable", { selector: ".forge-form-error" }),
    ).toBeInTheDocument();
    expect(textbox("Name")).toHaveValue("Ada");
    expect(onSubmitError).toHaveBeenCalledOnce();
  });

  it("lets onSubmit attach server errors to fields", async () => {
    const user = userEvent.setup();
    render(
      <Form
        defaultValues={{ username: "taken" }}
        onSubmit={(_values, form) =>
          form.setError("username", { message: "That username is taken" })
        }
      >
        <Field name="username" label="Username" />
        <SubmitButton>Save</SubmitButton>
      </Form>,
    );
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("That username is taken")).toBeInTheDocument();
    expect(textbox("Username")).toHaveAttribute("aria-invalid", "true");
  });

  it("resets to default values and clears errors", async () => {
    const user = userEvent.setup();
    render(
      <Form schema={signup} defaultValues={{ email: "start@example.com" }} onSubmit={() => {}}>
        <Field name="email" label="Email" />
        <ResetButton />
      </Form>,
    );
    await user.clear(textbox("Email"));
    await user.tab();
    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(textbox("Email")).toHaveValue("start@example.com");
    expect(screen.queryByText("Email is required")).not.toBeInTheDocument();
  });

  it("supports an external form instance and values from outside", async () => {
    function Harness() {
      const form = useForgeForm<{ name: string }>({ defaultValues: { name: "A" } });
      return (
        <>
          <button onClick={() => form.setValue("name", "Changed")}>change</button>
          <Form form={form} onSubmit={() => {}}>
            <Field name="name" label="Name" />
          </Form>
        </>
      );
    }
    render(<Harness />);
    await userEvent.click(screen.getByText("change"));
    expect(textbox("Name")).toHaveValue("Changed");
  });

  it("renders checkbox and textarea fields", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <Form defaultValues={{ agree: false, notes: "" }} onSubmit={onSubmit}>
        <Field name="agree" label="I agree" type="checkbox" />
        <Field name="notes" label="Notes" type="textarea" />
        <SubmitButton>Send</SubmitButton>
      </Form>,
    );
    await user.click(screen.getByRole("checkbox", { name: "I agree" }));
    await user.type(screen.getByRole("textbox", { name: "Notes" }), "hello");
    await user.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0]![0]).toEqual({ agree: true, notes: "hello" });
  });

  it("supports custom controls through the render prop", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <Form defaultValues={{ plan: "free" }} onSubmit={onSubmit}>
        <Field name="plan" label="Plan">
          {({ field, controlProps }) => (
            <select {...controlProps} value={field.value} onChange={field.onChange}>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
            </select>
          )}
        </Field>
        <SubmitButton>Save</SubmitButton>
      </Form>,
    );
    await user.selectOptions(screen.getByRole("combobox", { name: "Plan" }), "pro");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onSubmit.mock.calls[0]![0]).toEqual({ plan: "pro" }));
  });

  describe("async validation", () => {
    it("runs field-level async validators and shows their message", async () => {
      const user = userEvent.setup();
      const check = vi.fn(async (value: unknown) =>
        value === "ada" ? "Username is taken" : undefined,
      );
      render(
        <Form onSubmit={() => {}}>
          <Field name="username" label="Username" validate={check} />
        </Form>,
      );
      await user.type(textbox("Username"), "ada");
      await user.tab();
      expect(await screen.findByText("Username is taken")).toBeInTheDocument();
      await user.clear(textbox("Username"));
      await user.type(textbox("Username"), "grace");
      await waitFor(() => expect(screen.queryByText("Username is taken")).not.toBeInTheDocument());
    });

    it("debounces async validators so only the settled value is checked", async () => {
      const user = userEvent.setup();
      const check = vi.fn(async () => undefined);
      render(
        <Form onSubmit={() => {}} mode="onChange">
          <Field name="handle" label="Handle" validate={check} validateDebounceMs={60} />
        </Form>,
      );
      await user.type(textbox("Handle"), "abcd");
      await waitFor(() => expect(check).toHaveBeenCalled());
      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(check).toHaveBeenCalledTimes(1);
      expect(check).toHaveBeenCalledWith("abcd", expect.any(Object));
    });

    it("runs field-level validators together with a schema (not instead of it)", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      const schema = z.object({ username: z.string().min(3, "Use at least 3 characters") });
      render(
        <Form schema={schema} defaultValues={{ username: "" }} onSubmit={onSubmit}>
          <Field
            name="username"
            label="Username"
            validate={async (value) => (value === "ada" ? "Username is taken" : undefined)}
          />
          <SubmitButton>Save</SubmitButton>
        </Form>,
      );
      // The schema rule still applies...
      await user.type(textbox("Username"), "ad");
      await user.tab();
      expect(await screen.findByText("Use at least 3 characters")).toBeInTheDocument();
      // ...and so does the async check, once the schema is satisfied.
      await user.type(textbox("Username"), "a");
      expect(await screen.findByText("Username is taken")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Save" }));
      await waitFor(() => expect(screen.getByText("Username is taken")).toBeInTheDocument());
      expect(onSubmit).not.toHaveBeenCalled();

      await user.clear(textbox("Username"));
      await user.type(textbox("Username"), "grace");
      await user.click(screen.getByRole("button", { name: "Save" }));
      await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    });

    it("supports async schemas", async () => {
      const user = userEvent.setup();
      const asyncSchema: StandardSchemaV1 = {
        "~standard": {
          version: 1,
          vendor: "test",
          validate: async (value) => {
            await Promise.resolve();
            const v = value as { code?: string };
            return v.code === "42"
              ? { value: v }
              : { issues: [{ message: "Wrong code", path: ["code"] }] };
          },
        },
      };
      const onSubmit = vi.fn();
      render(
        <Form schema={asyncSchema} onSubmit={onSubmit}>
          <Field name="code" label="Code" />
          <SubmitButton>Verify</SubmitButton>
        </Form>,
      );
      await user.type(textbox("Code"), "1");
      await user.click(screen.getByRole("button", { name: "Verify" }));
      expect(await screen.findByText("Wrong code")).toBeInTheDocument();
      await user.clear(textbox("Code"));
      await user.type(textbox("Code"), "42");
      await user.click(screen.getByRole("button", { name: "Verify" }));
      await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    });
  });

  describe("conditional fields", () => {
    it("shows a field only while its condition holds and drops its value when hidden", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(
        <Form defaultValues={{ business: false, company: "" }} onSubmit={onSubmit}>
          <Field name="business" label="Business account" type="checkbox" />
          <Field name="company" label="Company" when={(values) => Boolean(values.business)} />
          <SubmitButton>Save</SubmitButton>
        </Form>,
      );
      expect(screen.queryByRole("textbox", { name: "Company" })).not.toBeInTheDocument();

      await user.click(screen.getByRole("checkbox", { name: "Business account" }));
      await user.type(
        await screen.findByRole("textbox", { name: "Company" }),
        "Analytical Engines",
      );
      await user.click(screen.getByRole("checkbox", { name: "Business account" }));
      expect(screen.queryByRole("textbox", { name: "Company" })).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Save" }));
      await waitFor(() => expect(onSubmit).toHaveBeenCalled());
      expect(onSubmit.mock.calls[0]![0]).not.toHaveProperty("company", "Analytical Engines");
    });

    it("does not validate hidden required fields", async () => {
      const user = userEvent.setup();
      const schema = z.object({
        business: z.boolean(),
        company: z.string().optional(),
      });
      const onSubmit = vi.fn();
      render(
        <Form schema={schema} defaultValues={{ business: false }} onSubmit={onSubmit}>
          <Field name="business" label="Business" type="checkbox" />
          <Field
            name="company"
            label="Company"
            when={(v) => Boolean(v.business)}
            validate={(v) => (v ? undefined : "Company is required")}
          />
          <SubmitButton>Save</SubmitButton>
        </Form>,
      );
      await user.click(screen.getByRole("button", { name: "Save" }));
      await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    });
  });

  describe("field arrays", () => {
    const schema = z.object({
      members: z
        .array(z.object({ name: z.string().min(1, "Name is required") }))
        .min(1, "Add at least one member"),
    });

    function Team({ onSubmit = () => {} }: { onSubmit?: (v: unknown) => void }) {
      return (
        <Form schema={schema} defaultValues={{ members: [{ name: "Ada" }] }} onSubmit={onSubmit}>
          <FieldArray
            name="members"
            legend="Members"
            itemLabel="member"
            defaultItem={{ name: "" }}
            min={0}
            max={3}
          >
            {(index) => <Field name={`members.${index}.name`} label={`Member ${index + 1} name`} />}
          </FieldArray>
          <SubmitButton>Save team</SubmitButton>
        </Form>
      );
    }

    it("adds and removes rows with labelled controls", async () => {
      const user = userEvent.setup();
      render(<Team />);
      expect(screen.getAllByRole("listitem")).toHaveLength(1);
      await user.click(screen.getByRole("button", { name: "Add member" }));
      expect(screen.getAllByRole("listitem")).toHaveLength(2);
      expect(textbox("Member 2 name")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Remove member 1" }));
      expect(screen.getAllByRole("listitem")).toHaveLength(1);
    });

    it("respects max and shows row and array-level errors", async () => {
      const user = userEvent.setup();
      render(<Team />);
      await user.click(screen.getByRole("button", { name: "Add member" }));
      await user.click(screen.getByRole("button", { name: "Add member" }));
      expect(screen.getByRole("button", { name: "Add member" })).toBeDisabled();

      await user.click(screen.getByRole("button", { name: "Save team" }));
      expect(await screen.findAllByText("Name is required")).toHaveLength(2);

      // Remove every row to hit the array-level rule.
      await user.click(screen.getByRole("button", { name: "Remove member 3" }));
      await user.click(screen.getByRole("button", { name: "Remove member 2" }));
      await user.click(screen.getByRole("button", { name: "Remove member 1" }));
      await user.click(screen.getByRole("button", { name: "Save team" }));
      expect(await screen.findByText("Add at least one member")).toBeInTheDocument();
    });
  });

  describe("multi-step forms", () => {
    const schema = z.object({
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Enter a valid email"),
      plan: z.string().min(1, "Choose a plan"),
    });

    function Wizard({ onSubmit = () => {} }: { onSubmit?: (v: unknown) => void }) {
      return (
        <Form schema={schema} defaultValues={{ name: "", email: "", plan: "" }} onSubmit={onSubmit}>
          <FormSteps>
            <FormStep id="profile" title="Profile" fields={["name", "email"]}>
              <Field name="name" label="Name" />
              <Field name="email" label="Email" />
            </FormStep>
            <FormStep id="plan" title="Plan" fields={["plan"]}>
              <Field name="plan" label="Plan" />
            </FormStep>
          </FormSteps>
        </Form>
      );
    }

    it("blocks Continue until the step is valid, then moves on and announces the new step", async () => {
      const user = userEvent.setup();
      render(<Wizard />);
      expect(screen.getByRole("heading", { name: "Profile" })).toBeInTheDocument();
      expect(
        within(screen.getByRole("list", { name: "Progress" }))
          .getByText("Profile")
          .closest("li"),
      ).toHaveAttribute("aria-current", "step");

      await user.click(screen.getByRole("button", { name: "Continue" }));
      expect(await screen.findByText("Name is required")).toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: "Plan" })).not.toBeInTheDocument();

      await user.type(textbox("Name"), "Ada");
      await user.type(textbox("Email"), "ada@example.com");
      await user.click(screen.getByRole("button", { name: "Continue" }));
      const heading = await screen.findByRole("heading", { name: "Plan" });
      await waitFor(() => expect(heading).toHaveFocus());
    });

    it("keeps values when going back and submits everything from the last step", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<Wizard onSubmit={onSubmit} />);
      await user.type(textbox("Name"), "Ada");
      await user.type(textbox("Email"), "ada@example.com");
      await user.click(screen.getByRole("button", { name: "Continue" }));
      await user.type(await screen.findByRole("textbox", { name: "Plan" }), "pro");

      await user.click(screen.getByRole("button", { name: "Back" }));
      expect(textbox("Name")).toHaveValue("Ada");
      await user.click(screen.getByRole("button", { name: "Continue" }));
      await user.click(screen.getByRole("button", { name: "Submit" }));
      await waitFor(() => expect(onSubmit).toHaveBeenCalled());
      expect(onSubmit.mock.calls[0]![0]).toEqual({
        name: "Ada",
        email: "ada@example.com",
        plan: "pro",
      });
    });

    it("treats Enter as Continue on early steps instead of submitting", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<Wizard onSubmit={onSubmit} />);
      await user.type(textbox("Name"), "Ada");
      await user.type(textbox("Email"), "ada@example.com{Enter}");
      expect(await screen.findByRole("heading", { name: "Plan" })).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("jumps back to the step that has an error when the final submit fails", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      // The step only validates "plan", so the invalid email slips through until the final submit.
      render(
        <Form
          schema={schema}
          defaultValues={{ name: "Ada", email: "bad", plan: "" }}
          onSubmit={onSubmit}
        >
          <FormSteps defaultStep="plan">
            <FormStep id="profile" title="Profile" fields={["name", "email"]}>
              <Field name="name" label="Name" />
              <Field name="email" label="Email" />
            </FormStep>
            <FormStep id="plan" title="Plan" fields={[]}>
              <Field name="plan" label="Plan" />
            </FormStep>
          </FormSteps>
        </Form>,
      );
      // Land on the last step, then submit with errors on both steps.
      await user.click(screen.getByRole("button", { name: "Submit" }));
      expect(await screen.findByRole("heading", { name: "Profile" })).toBeInTheDocument();
      expect(await screen.findByText("Enter a valid email")).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  it("exposes form context to custom children", async () => {
    function Echo() {
      const { watch } = useFormContext();
      return <output>{String(watch("name") ?? "")}</output>;
    }
    render(
      <Form defaultValues={{ name: "Grace" }} onSubmit={() => {}}>
        <Field name="name" label="Name" />
        <Echo />
      </Form>,
    );
    expect(document.querySelector("output")).toHaveTextContent("Grace");
  });

  it("has no obvious accessibility violations, including with errors showing", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Form schema={signup} defaultValues={{ email: "" }} onSubmit={() => {}} aria-label="Sign up">
        <Field name="email" label="Email" description="Used for receipts" required />
        <Field name="age" label="Age" type="number" />
        <SubmitButton>Create</SubmitButton>
      </Form>,
    );
    expect(await axe(container)).toHaveNoViolations();
    await user.click(screen.getByRole("button", { name: "Create" }));
    await screen.findByText("Email is required");
    expect(await axe(container)).toHaveNoViolations();
    expect(within(container).getByRole("form", { name: "Sign up" })).toBeInTheDocument();
  });
});

describe("issuesToErrors", () => {
  it("builds nested objects and arrays and keeps the first error per path", () => {
    const errors = issuesToErrors([
      { message: "bad street", path: ["address", "street"] },
      { message: "second street error", path: ["address", "street"] },
      { message: "bad item", path: ["items", 1, "name"] },
      { message: "too few", path: ["items"] },
      { message: "form-level" },
    ]) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(errors.address.street.message).toBe("bad street");
    expect(Array.isArray(errors.items)).toBe(true);
    expect(errors.items[1].name.message).toBe("bad item");
    expect(errors.items.root.message).toBe("too few");
    expect(errors.root.message).toBe("form-level");
  });

  it("moves a parent error to .root when a child error arrives later", () => {
    const errors = issuesToErrors([
      { message: "list invalid", path: ["items"] },
      { message: "row invalid", path: ["items", 0, "name"] },
    ]) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(errors.items.root.message).toBe("list invalid");
    expect(errors.items[0].name.message).toBe("row invalid");
  });
});
