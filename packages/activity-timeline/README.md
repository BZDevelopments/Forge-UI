# @forge-ui/activity-timeline

Activity timeline with grouped events, avatars, metadata, and custom rendering.

Part of [Forge UI](https://github.com/bzdevelopments/forge-ui), accessible components for the parts of modern applications developers hate building. Created and maintained by [BZDevelopments](https://github.com/bzdevelopments).

## Install

```bash
pnpm add @forge-ui/activity-timeline @forge-ui/core
```

Import the styles once near the root of your app:

```ts
import "@forge-ui/core/styles.css";
import "@forge-ui/activity-timeline/styles.css";
```

## Usage

```tsx
import { ActivityTimeline } from "@forge-ui/activity-timeline";

<ActivityTimeline events={events} aria-label="Workspace activity" />;
```

## Documentation

Props, examples, keyboard behavior, and accessibility notes are in the [documentation site](https://github.com/bzdevelopments/forge-ui#readme) and the [source](https://github.com/bzdevelopments/forge-ui/tree/main/packages/activity-timeline).

## License

MIT © BZDevelopments
