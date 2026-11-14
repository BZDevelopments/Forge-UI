# @forge-ui/core

Design tokens, hooks, and shared primitives used by every Forge UI component.

Part of [Forge UI](https://github.com/bzdevelopments/forge-ui), accessible components for the parts of modern applications developers hate building. Created and maintained by [BZDevelopments](https://github.com/bzdevelopments).

## Install

```bash
pnpm add @forge-ui/core
```

## Usage

```tsx
import { cn, useControllableState, announce, fuzzyMatch, resolveLocale } from "@forge-ui/core";
```

Most apps only import the stylesheet:

```ts
import "@forge-ui/core/styles.css"; // tokens plus shared button, input, and popover styles
```

Override any `--forge-*` variable to re-theme every component. See the [theming guide](https://github.com/bzdevelopments/forge-ui#architecture). An optional Tailwind preset is available at `@forge-ui/core/tailwind-preset`.

## Documentation

Props, examples, keyboard behavior, and accessibility notes are in the [documentation site](https://github.com/bzdevelopments/forge-ui#readme) and the [source](https://github.com/bzdevelopments/forge-ui/tree/main/packages/core).

## License

MIT © BZDevelopments
