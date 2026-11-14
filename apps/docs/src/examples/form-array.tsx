import { z } from "zod";
import { Field, FieldArray, Form, SubmitButton } from "@forge-ui/form";
import { notify } from "@forge-ui/notifications";

const schema = z.object({
  teammates: z
    .array(
      z.object({
        name: z.string().min(1, "Enter a name"),
        email: z.string().email("Enter a valid email"),
      }),
    )
    .min(1, "Invite at least one teammate")
    .max(5),
});

export default function FormArray() {
  return (
    <Form
      schema={schema}
      defaultValues={{ teammates: [{ name: "", email: "" }] }}
      aria-label="Invite teammates"
      onSubmit={(values) => notify.success(`Invited ${values.teammates.length} teammate(s)`)}
    >
      <FieldArray
        name="teammates"
        legend="Teammates"
        itemLabel="teammate"
        defaultItem={{ name: "", email: "" }}
        max={5}
      >
        {(index) => (
          <>
            <Field name={`teammates.${index}.name`} label="Name" />
            <Field name={`teammates.${index}.email`} label="Email" type="email" />
          </>
        )}
      </FieldArray>
      <div>
        <SubmitButton>Send invitations</SubmitButton>
      </div>
    </Form>
  );
}
