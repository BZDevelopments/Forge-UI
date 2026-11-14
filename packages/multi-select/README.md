# @forge-ui/multi-select

Multi-select with removable tags, grouping, limits, and async options, built on the Forge UI combobox.

Part of [Forge UI](https://github.com/bzdevelopments/forge-ui), accessible components for the parts of modern applications developers hate building. Created and maintained by [BZDevelopments](https://github.com/bzdevelopments).

## Install

```bash
pnpm add @forge-ui/multi-select @forge-ui/core
```

Import the styles once near the root of your app:

```ts
import "@forge-ui/core/styles.css";
import "@forge-ui/multi-select/styles.css";
```

## Usage

```tsx
import { MultiSelect } from "@forge-ui/multi-select";

<MultiSelect aria-label="Skills" options={skills} value={value} onValueChange={setValue} />;
```

Also import `@forge-ui/combobox/styles.css`, which styles the shared option list.

## Documentation

Props, examples, keyboard behavior, and accessibility notes are in the [documentation site](https://github.com/bzdevelopments/forge-ui#readme) and the [source](https://github.com/bzdevelopments/forge-ui/tree/main/packages/multi-select).

## License

MIT © BZDevelopments
