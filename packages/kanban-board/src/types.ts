import type { ReactNode } from "react";

export interface KanbanLabel {
  text: string;
  /** Any CSS color. Text on the label is chosen for contrast automatically in the default style. */
  color?: string;
}

export interface KanbanAssignee {
  name: string;
  avatarUrl?: string;
}

export interface KanbanCardData {
  id: string;
  title: string;
  description?: string;
  labels?: KanbanLabel[];
  assignees?: KanbanAssignee[];
  /** Anything you need back in callbacks and custom renderers. */
  data?: unknown;
}

export interface KanbanColumnData {
  id: string;
  title: string;
  cards: KanbanCardData[];
  /** Work-in-progress limit. Cards cannot be moved into a full column. */
  limit?: number;
}

export interface CardPosition {
  columnId: string;
  index: number;
}

export interface CardMove {
  card: KanbanCardData;
  from: CardPosition;
  to: CardPosition;
  /** The board after the move. */
  columns: KanbanColumnData[];
}

export interface KanbanCardAction {
  label: string;
  onSelect: () => void;
  danger?: boolean;
}

export interface KanbanBoardProps {
  columns?: KanbanColumnData[];
  defaultColumns?: KanbanColumnData[];
  /** Called with the new board after every change. */
  onColumnsChange?: (columns: KanbanColumnData[]) => void;
  /**
   * Persist a move. The board updates immediately; if this rejects, the move is undone
   * and `onMoveError` is called.
   */
  onCardMove?: (move: CardMove) => unknown;
  onMoveError?: (error: unknown, move: CardMove) => void;
  /** Adds an "Add card" button to each column. */
  onAddCard?: (columnId: string) => void;
  onCardClick?: (card: KanbanCardData, columnId: string) => void;
  /** Extra items in each card's actions menu, after the built-in Move to… items. */
  cardActions?: (card: KanbanCardData, columnId: string) => KanbanCardAction[];
  /** Replace a card's content. The drag handle and actions menu stay. */
  renderCard?: (
    card: KanbanCardData,
    context: { columnId: string; dragging: boolean },
  ) => ReactNode;
  loading?: boolean;
  emptyColumnMessage?: ReactNode;
  /** Shown when there are no columns at all. */
  emptyState?: ReactNode;
  "aria-label"?: string;
  className?: string;
}
