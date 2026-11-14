# @forge-ui/notifications

Toast notifications with promise helpers, undo, progress, queues, and screen reader announcements.

Part of [Forge UI](https://github.com/bzdevelopments/forge-ui), accessible components for the parts of modern applications developers hate building. Created and maintained by [BZDevelopments](https://github.com/bzdevelopments).

## Install

```bash
pnpm add @forge-ui/notifications @forge-ui/core
```

Import the styles once near the root of your app:

```ts
import "@forge-ui/core/styles.css";
import "@forge-ui/notifications/styles.css";
```

## Usage

```tsx
import { Toaster, notify } from "@forge-ui/notifications";

<Toaster />;

notify.promise(saveData(), { loading: "Saving...", success: "Saved", error: "Unable to save" });
```

Mount `<Toaster />` once near the root.

## Documentation

Props, examples, keyboard behavior, and accessibility notes are in the [documentation site](https://github.com/bzdevelopments/forge-ui#readme) and the [source](https://github.com/bzdevelopments/forge-ui/tree/main/packages/notifications).

## License

MIT © BZDevelopments
