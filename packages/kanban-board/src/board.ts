import type { CardMove, KanbanCardData, KanbanColumnData } from "./types";

export function findCard(columns: KanbanColumnData[], cardId: string) {
  for (const column of columns) {
    const index = column.cards.findIndex((card) => card.id === cardId);
    if (index !== -1) return { column, index, card: column.cards[index]! };
  }
  return null;
}

export type MoveFailure = "missing" | "limit" | "same";

/**
 * Moves a card and returns the new board, without mutating the input.
 * `toIndex` is clamped to the destination column's bounds.
 */
export function moveCard(
  columns: KanbanColumnData[],
  cardId: string,
  toColumnId: string,
  toIndex: number,
): { move: CardMove } | { error: MoveFailure } {
  const source = findCard(columns, cardId);
  const target = columns.find((column) => column.id === toColumnId);
  if (!source || !target) return { error: "missing" };

  const sameColumn = source.column.id === target.id;
  if (!sameColumn && target.limit !== undefined && target.cards.length >= target.limit)
    return { error: "limit" };

  const destinationLength = sameColumn ? target.cards.length : target.cards.length + 1;
  const index = Math.min(Math.max(toIndex, 0), destinationLength - 1);
  if (sameColumn && index === source.index) return { error: "same" };

  const next = columns.map((column) => {
    if (column.id === source.column.id && column.id === target.id) {
      const cards = column.cards.filter((card) => card.id !== cardId);
      cards.splice(index, 0, source.card);
      return { ...column, cards };
    }
    if (column.id === source.column.id)
      return { ...column, cards: column.cards.filter((card) => card.id !== cardId) };
    if (column.id === target.id) {
      const cards = [...column.cards];
      cards.splice(index, 0, source.card);
      return { ...column, cards };
    }
    return column;
  });

  return {
    move: {
      card: source.card,
      from: { columnId: source.column.id, index: source.index },
      to: { columnId: target.id, index },
      columns: next,
    },
  };
}

export function describePosition(columns: KanbanColumnData[], card: KanbanCardData): string {
  const found = findCard(columns, card.id);
  if (!found) return card.title;
  return `${card.title}, position ${found.index + 1} of ${found.column.cards.length} in ${found.column.title}`;
}
