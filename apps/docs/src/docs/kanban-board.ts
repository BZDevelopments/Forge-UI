import type { ComponentDoc } from "./types";
import basic from "../examples/kanban-basic.tsx?raw";
import custom from "../examples/kanban-custom.tsx?raw";
import KanbanBasic from "../examples/kanban-basic";
import KanbanCustom from "../examples/kanban-custom";

export const kanbanBoard: ComponentDoc = {
  slug: "kanban-board",
  name: "Kanban board",
  pkg: "kanban-board",
  summary:
    "A board of columns and cards with drag and drop for pointer and touch, keyboard shortcuts, a Move to… menu, work-in-progress limits, card actions, and optimistic persistence with automatic rollback.",
  keywords: ["kanban", "board", "drag", "drop", "cards", "columns", "tasks"],
  whenToUse: [
    "Work moves through stages: tasks, tickets, candidates, deals.",
    "You want drag and drop that does not leave keyboard and screen reader users behind.",
  ],
  usage: `import { KanbanBoard } from "@forge-ui/kanban-board";

<KanbanBoard
  aria-label="Sprint board"
  columns={columns}
  onColumnsChange={setColumns}
  onCardMove={(move) => api.moveCard(move.card.id, move.to)}
/>`,
  examples: [
    {
      id: "basic",
      title: "Persistence, rollback, limits, and actions",
      description:
        "Drag a card by its handle, press Alt+arrow keys on a focused card, or use the ⋯ menu. “In progress” has a limit of 2. Turn on “Make saving fail” to watch a move roll back.",
      Component: KanbanBasic,
      code: basic,
    },
    {
      id: "custom",
      title: "Custom cards",
      description:
        "`renderCard` replaces the card content and receives `data` you attached to the card. The drag handle and menu stay.",
      Component: KanbanCustom,
      code: custom,
    },
  ],
  api: [
    {
      title: "KanbanBoard props",
      rows: [
        {
          name: "columns / defaultColumns / onColumnsChange",
          type: "KanbanColumnData[]",
          description:
            "Controlled or uncontrolled board. A column is `{ id, title, cards, limit? }`.",
        },
        {
          name: "onCardMove",
          type: "(move) => unknown",
          description:
            "Persist a move. `move` has `card`, `from`, `to` (`{ columnId, index }`), and the new `columns`. Return a promise: if it rejects, the move is undone.",
        },
        {
          name: "onMoveError",
          type: "(error, move) => void",
          description: "Called after a rollback.",
        },
        {
          name: "onAddCard",
          type: "(columnId) => void",
          description: "Adds an Add card button to each column.",
        },
        {
          name: "onCardClick",
          type: "(card, columnId) => void",
          description: "Called when a card (not one of its buttons) is clicked.",
        },
        {
          name: "cardActions",
          type: "(card, columnId) => KanbanCardAction[]",
          description: "Extra items in each card's ⋯ menu, after Move to… items.",
        },
        {
          name: "renderCard",
          type: "(card, { columnId, dragging }) => ReactNode",
          description: "Custom card content.",
        },
        {
          name: "loading / emptyColumnMessage / emptyState",
          type: "—",
          description: "Loading skeleton, empty column text, and the no-columns state.",
        },
        { name: "aria-label / className", type: "—", description: "Accessible name and classes." },
      ],
    },
    {
      title: "Card and column data",
      rows: [
        {
          name: "card",
          type: "{ id, title, description?, labels?, assignees?, data? }",
          description: "`labels` are `{ text, color? }`; `assignees` are `{ name, avatarUrl? }`.",
        },
        {
          name: "column.limit",
          type: "number",
          description:
            "Work-in-progress limit. Moves into a full column are refused and announced.",
        },
        {
          name: "moveCard(columns, cardId, toColumnId, toIndex)",
          type: "{ move } | { error }",
          description:
            "The pure function behind every move, exported for your own logic and tests.",
        },
      ],
    },
  ],
  keyboard: [
    { keys: "Alt+↑ / Alt+↓", action: "On a focused card: move up or down within its column." },
    { keys: "Alt+← / Alt+→", action: "On a focused card: move to the previous or next column." },
    {
      keys: "Space or Enter on the handle",
      action: "Pick up with the drag keyboard mode. Arrow keys move, Space drops, Escape cancels.",
    },
    {
      keys: "⋯ menu",
      action: "Open with Enter. Arrow keys move, Enter chooses “Move to…”, Escape closes.",
    },
  ],
  accessibility: [
    "Dragging has three non-pointer alternatives: Alt+arrow shortcuts, the keyboard drag mode on the handle, and the Move to… menu (WCAG 2.5.7).",
    "Moves are announced with the final position: “Write docs moved, position 2 of 4 in In progress”. Limits and failures are announced assertively.",
    "Columns are labelled regions with a count; WIP-limited columns read “2 of 3 cards”. Focus stays on a card after it moves.",
    "On touch screens, press and hold to drag so vertical scrolling still works.",
  ],
  customization: [
    "Restyle `.forge-kb-*` classes. Label colors are a CSS variable, so any color works in light and dark themes.",
    "Use `renderCard` for custom content and `cardActions` for per-card commands.",
  ],
  mistakes: [
    "Not returning the promise from `onCardMove`. Rollback only works if the board can tell when saving failed.",
    "Using index as card id. Ids must be stable across moves.",
    "Expecting pointer dragging inside automated tests. Use the keyboard shortcuts or the menu, which share the same code path.",
  ],
};
