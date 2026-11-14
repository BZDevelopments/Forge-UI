# @forge-ui/command-palette

Accessible command palette with fuzzy search, nested commands, async results, and recent history.

Part of [Forge UI](https://github.com/bzdevelopments/forge-ui), accessible components for the parts of modern applications developers hate building. Created and maintained by [BZDevelopments](https://github.com/bzdevelopments).

## Install

```bash
pnpm add @forge-ui/command-palette @forge-ui/core
```

Import the styles once near the root of your app:

```ts
import "@forge-ui/core/styles.css";
import "@forge-ui/command-palette/styles.css";
```

## Usage

```tsx
import { CommandPalette } from "@forge-ui/command-palette";

<CommandPalette commands={commands} shortcut="mod+k" onSelect={handleCommand} />;
```

## Documentation

Props, examples, keyboard behavior, and accessibility notes are in the [documentation site](https://github.com/bzdevelopments/forge-ui#readme) and the [source](https://github.com/bzdevelopments/forge-ui/tree/main/packages/command-palette).

## License

MIT © BZDevelopments
