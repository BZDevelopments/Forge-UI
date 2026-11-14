# @forge-ui/date-range-picker

Date and date-range picker with constraints, presets, keyboard navigation, and locale-aware formatting.

Part of [Forge UI](https://github.com/bzdevelopments/forge-ui), accessible components for the parts of modern applications developers hate building. Created and maintained by [BZDevelopments](https://github.com/bzdevelopments).

## Install

```bash
pnpm add @forge-ui/date-range-picker @forge-ui/core
```

Import the styles once near the root of your app:

```ts
import "@forge-ui/core/styles.css";
import "@forge-ui/date-range-picker/styles.css";
```

## Usage

```tsx
import { DateRangePicker } from "@forge-ui/date-range-picker";

<DateRangePicker aria-label="Reporting period" value={range} onValueChange={setRange} />;
```

## Documentation

Props, examples, keyboard behavior, and accessibility notes are in the [documentation site](https://github.com/bzdevelopments/forge-ui#readme) and the [source](https://github.com/bzdevelopments/forge-ui/tree/main/packages/date-range-picker).

## License

MIT © BZDevelopments
