# @forge-ui/form

Schema-driven forms with async validation, conditional fields, field arrays, and multi-step flows.

Part of [Forge UI](https://github.com/bzdevelopments/forge-ui), accessible components for the parts of modern applications developers hate building. Created and maintained by [BZDevelopments](https://github.com/bzdevelopments).

## Install

```bash
pnpm add @forge-ui/form @forge-ui/core
```

Import the styles once near the root of your app:

```ts
import "@forge-ui/core/styles.css";
import "@forge-ui/form/styles.css";
```

## Usage

```tsx
import { Form, Field, SubmitButton } from "@forge-ui/form";

<Form schema={schema} defaultValues={{ email: "" }} onSubmit={save}>
  <Field name="email" label="Email" type="email" />
  <SubmitButton>Save</SubmitButton>
</Form>;
```

Works with any [Standard Schema](https://standardschema.dev) validator: Zod 3.24+, Valibot, ArkType.

## Documentation

Props, examples, keyboard behavior, and accessibility notes are in the [documentation site](https://github.com/bzdevelopments/forge-ui#readme) and the [source](https://github.com/bzdevelopments/forge-ui/tree/main/packages/form).

## License

MIT © BZDevelopments
