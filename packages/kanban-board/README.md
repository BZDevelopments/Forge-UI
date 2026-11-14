# @forge-ui/kanban-board

Kanban board with pointer, touch, and keyboard moves, WIP limits, and rollback on failed saves.

Part of [Forge UI](https://github.com/bzdevelopments/forge-ui), accessible components for the parts of modern applications developers hate building. Created and maintained by [BZDevelopments](https://github.com/bzdevelopments).

## Install

```bash
pnpm add @forge-ui/kanban-board @forge-ui/core
```

Import the styles once near the root of your app:

```ts
import "@forge-ui/core/styles.css";
import "@forge-ui/kanban-board/styles.css";
```

## Usage

```tsx
import { KanbanBoard } from "@forge-ui/kanban-board";

<KanbanBoard
  aria-label="Sprint board"
  columns={columns}
  onColumnsChange={setColumns}
  onCardMove={save}
/>;
```

## Documentation

Props, examples, keyboard behavior, and accessibility notes are in the [documentation site](https://github.com/bzdevelopments/forge-ui#readme) and the [source](https://github.com/bzdevelopments/forge-ui/tree/main/packages/kanban-board).

## License

MIT © BZDevelopments
