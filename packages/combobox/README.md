# @forge-ui/combobox

Accessible searchable select with async options, groups, and virtualized large lists.

Part of [Forge UI](https://github.com/bzdevelopments/forge-ui), accessible components for the parts of modern applications developers hate building. Created and maintained by [BZDevelopments](https://github.com/bzdevelopments).

## Install

```bash
pnpm add @forge-ui/combobox @forge-ui/core
```

Import the styles once near the root of your app:

```ts
import "@forge-ui/core/styles.css";
import "@forge-ui/combobox/styles.css";
```

## Usage

```tsx
import { Combobox } from "@forge-ui/combobox";

<Combobox
  aria-label="Country"
  options={countries}
  value={value}
  onValueChange={setValue}
  clearable
/>;
```

## Documentation

Props, examples, keyboard behavior, and accessibility notes are in the [documentation site](https://github.com/bzdevelopments/forge-ui#readme) and the [source](https://github.com/bzdevelopments/forge-ui/tree/main/packages/combobox).

## License

MIT © BZDevelopments
