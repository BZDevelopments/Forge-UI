import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { announce, cn, useControllableState } from "@forge-ui/core";
import { CardMenu } from "./card-menu";
import { describePosition, findCard, moveCard } from "./board";
import type {
  CardMove,
  KanbanBoardProps,
  KanbanCardAction,
  KanbanCardData,
  KanbanColumnData,
} from "./types";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

function CardBody({ card }: { card: KanbanCardData }) {
  return (
    <>
      <div className="forge-kb-card-title">{card.title}</div>
      {card.description ? <div className="forge-kb-card-desc">{card.description}</div> : null}
      {card.labels?.length ? (
        <ul className="forge-kb-labels" aria-label="Labels">
          {card.labels.map((label) => (
            <li
              key={label.text}
              className="forge-kb-label"
              style={
                label.color ? ({ "--forge-kb-label": label.color } as CSSProperties) : undefined
              }
            >
              {label.text}
            </li>
          ))}
        </ul>
      ) : null}
      {card.assignees?.length ? (
        <ul className="forge-kb-assignees" aria-label="Assignees">
          {card.assignees.map((person) => (
            <li key={person.name} className="forge-kb-avatar" title={person.name}>
              {person.avatarUrl ? (
                <img src={person.avatarUrl} alt="" />
              ) : (
                <span aria-hidden="true">{initials(person.name)}</span>
              )}
              <span className="forge-sr-only">{person.name}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

interface CardProps {
  card: KanbanCardData;
  columnId: string;
  columns: KanbanColumnData[];
  props: KanbanBoardProps;
  onMove: (cardId: string, columnId: string, index: number, focus?: boolean) => void;
  overlay?: boolean;
}

function Card({ card, columnId, columns, props, onMove, overlay }: CardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: { columnId },
    disabled: overlay,
  });
  const style: CSSProperties = { transform: CSS.Transform.toString(transform), transition };
  const columnIndex = columns.findIndex((column) => column.id === columnId);
  const cardIndex = columns[columnIndex]?.cards.findIndex((item) => item.id === card.id) ?? 0;

  // Built-in move items first, then whatever the app adds.
  const actions: KanbanCardAction[] = [
    ...columns
      .filter((column) => column.id !== columnId)
      .map((column) => ({
        label: `Move to ${column.title}`,
        onSelect: () => onMove(card.id, column.id, column.cards.length, true),
      })),
    ...(props.cardActions?.(card, columnId) ?? []),
  ];

  const onKeyDown = (event: KeyboardEvent<HTMLLIElement>) => {
    if (!event.altKey || event.target !== event.currentTarget) return;
    const targets: Record<string, [string, number]> = {
      ArrowUp: [columnId, cardIndex - 1],
      ArrowDown: [columnId, cardIndex + 1],
      ArrowLeft: [columns[columnIndex - 1]?.id ?? columnId, cardIndex],
      ArrowRight: [columns[columnIndex + 1]?.id ?? columnId, cardIndex],
    };
    const target = targets[event.key];
    if (!target) return;
    event.preventDefault();
    onMove(card.id, target[0], target[1], true);
  };

  return (
    // The card is a focusable list item so Alt+Arrow shortcuts work on it. Clicking is a convenience only.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <li
      ref={setNodeRef}
      style={style}
      className="forge-kb-card"
      data-card-id={card.id}
      data-dragging={isDragging || overlay || undefined}
      tabIndex={overlay ? undefined : 0}
      aria-label={card.title}
      aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown Alt+ArrowLeft Alt+ArrowRight"
      onKeyDown={onKeyDown}
      onClick={(event) => {
        if (props.onCardClick && !(event.target as HTMLElement).closest("button, a, [role=menu]")) {
          props.onCardClick(card, columnId);
        }
      }}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="forge-kb-handle"
        aria-label={`Move ${card.title}`}
        {...attributes}
        {...listeners}
      >
        <span aria-hidden="true">⠿</span>
      </button>
      <div className="forge-kb-card-body">
        {props.renderCard ? (
          props.renderCard(card, { columnId, dragging: Boolean(isDragging || overlay) })
        ) : (
          <CardBody card={card} />
        )}
      </div>
      {!overlay ? <CardMenu title={card.title} actions={actions} /> : null}
    </li>
  );
}

function Column({
  column,
  columns,
  props,
  onMove,
}: {
  column: KanbanColumnData;
  columns: KanbanColumnData[];
  props: KanbanBoardProps;
  onMove: CardProps["onMove"];
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { columnId: column.id, isColumn: true },
  });
  const full = column.limit !== undefined && column.cards.length >= column.limit;
  const headingId = `forge-kb-col-${column.id}`;

  return (
    <section
      className="forge-kb-column"
      aria-labelledby={headingId}
      data-over={isOver || undefined}
      data-full={full || undefined}
    >
      <header className="forge-kb-column-header">
        <h3 id={headingId} className="forge-kb-column-title">
          {column.title}
        </h3>
        <span
          className="forge-kb-count"
          aria-label={
            column.limit !== undefined
              ? `${column.cards.length} of ${column.limit} cards`
              : `${column.cards.length} cards`
          }
        >
          {column.cards.length}
          {column.limit !== undefined ? `/${column.limit}` : ""}
        </span>
      </header>
      <SortableContext
        items={column.cards.map((card) => card.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul ref={setNodeRef} className="forge-kb-cards" aria-labelledby={headingId}>
          {column.cards.map((card) => (
            <Card
              key={card.id}
              card={card}
              columnId={column.id}
              columns={columns}
              props={props}
              onMove={onMove}
            />
          ))}
          {column.cards.length === 0 ? (
            <li className="forge-kb-empty" aria-label="Empty column">
              {props.emptyColumnMessage ?? "No cards"}
            </li>
          ) : null}
        </ul>
      </SortableContext>
      {props.onAddCard ? (
        <button type="button" className="forge-kb-add" onClick={() => props.onAddCard?.(column.id)}>
          <span aria-hidden="true">+ </span>Add card
          <span className="forge-sr-only"> to {column.title}</span>
        </button>
      ) : null}
    </section>
  );
}

/**
 * Kanban board. Drag with a pointer or finger using the handle, press Alt + arrow keys on a focused card,
 * or use each card's Move to… menu. All three paths share the same persistence callback.
 */
export function KanbanBoard(props: KanbanBoardProps) {
  const { onCardMove, onMoveError, loading, emptyState, className } = props;
  const [columns, setColumns] = useControllableState<KanbanColumnData[]>({
    value: props.columns,
    defaultValue: props.defaultColumns ?? [],
    onChange: props.onColumnsChange,
  });
  const columnsRef = useRef(columns);
  columnsRef.current = columns;

  // During a pointer drag the board is rearranged locally, then committed on drop.
  const [draft, setDraft] = useState<KanbanColumnData[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const shown = draft ?? columns;
  const dragOrigin = useRef<{ columnId: string; index: number } | null>(null);
  const focusAfterMove = useRef<string | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    // A short press-and-hold keeps vertical scrolling working on touch screens.
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    const id = focusAfterMove.current;
    if (!id) return;
    const element = boardRef.current?.querySelector<HTMLElement>(
      `[data-card-id="${escapeSelector(id)}"]`,
    );
    if (element) {
      focusAfterMove.current = null;
      element.focus();
    }
  });

  const commit = async (move: CardMove, previous: KanbanColumnData[]) => {
    setColumns(move.columns);
    if (!onCardMove) return;
    try {
      await onCardMove(move);
    } catch (error) {
      setColumns(previous);
      announce(`Could not move ${move.card.title}. It was put back.`, "assertive");
      onMoveError?.(error, move);
    }
  };

  const moveFromUi = (cardId: string, toColumnId: string, toIndex: number, focus = false) => {
    const result = moveCard(columnsRef.current, cardId, toColumnId, toIndex);
    if ("error" in result) {
      if (result.error === "limit") {
        const column = columnsRef.current.find((c) => c.id === toColumnId);
        announce(
          `${column?.title ?? "That column"} is full. The limit is ${column?.limit}.`,
          "assertive",
        );
      }
      return;
    }
    if (focus) focusAfterMove.current = cardId;
    const previous = columnsRef.current;
    void commit(result.move, previous);
    announce(
      describePosition(result.move.columns, result.move.card).replace(
        /^(.*?), position/,
        "$1 moved, position",
      ),
    );
  };

  const onDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    const found = findCard(columnsRef.current, id);
    setActiveId(id);
    setDraft(columnsRef.current);
    dragOrigin.current = found ? { columnId: found.column.id, index: found.index } : null;
  };

  const containerOf = (id: string, board: KanbanColumnData[]) =>
    board.find((column) => column.id === id)?.id ?? findCard(board, id)?.column.id;

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    setDraft((board) => {
      if (!board) return board;
      const activeContainer = containerOf(String(active.id), board);
      const overContainer = containerOf(String(over.id), board);
      if (!activeContainer || !overContainer || activeContainer === overContainer) return board;
      const target = board.find((column) => column.id === overContainer)!;
      // Respect work-in-progress limits while dragging too.
      if (target.limit !== undefined && target.cards.length >= target.limit) return board;
      const overIndex = target.cards.findIndex((card) => card.id === over.id);
      const index = overIndex === -1 ? target.cards.length : overIndex;
      const result = moveCard(board, String(active.id), overContainer, index);
      return "move" in result ? result.move.columns : board;
    });
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const origin = dragOrigin.current;
    const board = draft ?? columnsRef.current;
    setActiveId(null);
    setDraft(null);
    dragOrigin.current = null;
    if (!over || !origin) return;

    const activeId = String(active.id);
    const container = containerOf(activeId, board);
    if (!container) return;
    const column = board.find((c) => c.id === container)!;
    const currentIndex = column.cards.findIndex((card) => card.id === activeId);
    const overIndex = column.cards.findIndex((card) => card.id === over.id);
    const finalIndex = overIndex === -1 ? currentIndex : overIndex;

    // Replay the move against the original board so the callback sees an accurate from/to.
    const result = moveCard(columnsRef.current, activeId, container, finalIndex);
    if ("move" in result) {
      void commit(result.move, columnsRef.current);
      announce(
        `${result.move.card.title} dropped in ${column.title}, position ${result.move.to.index + 1} of ${
          result.move.columns.find((c) => c.id === container)!.cards.length
        }.`,
      );
    }
  };

  const onDragCancel = () => {
    setActiveId(null);
    setDraft(null);
    dragOrigin.current = null;
  };

  const activeCard = useMemo(
    () => (activeId ? findCard(shown, activeId) : null),
    [activeId, shown],
  );

  if (loading && columns.length === 0) {
    return (
      <div className={cn("forge-kb", className)} aria-busy="true">
        <p role="status" className="forge-sr-only">
          Loading board
        </p>
        <div className="forge-kb-board" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="forge-kb-column">
              <span className="forge-kb-skeleton" style={{ width: "40%" }} />
              {[0, 1, 2].slice(0, 3 - i).map((j) => (
                <span key={j} className="forge-kb-skeleton forge-kb-skeleton-card" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (columns.length === 0) {
    return (
      <div className={cn("forge-kb", className)}>
        {emptyState ?? <p className="forge-kb-empty-board">No columns yet.</p>}
      </div>
    );
  }

  return (
    <div className={cn("forge-kb", className)} aria-busy={loading || undefined}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
        accessibility={{
          screenReaderInstructions: {
            draggable:
              "To pick up a card, press space or enter on its handle. Use the arrow keys to move it, then press space or enter to drop it, or escape to cancel. You can also press Alt with an arrow key on the card itself.",
          },
          announcements: {
            onDragStart: ({ active }) =>
              `Picked up ${findCard(columnsRef.current, String(active.id))?.card.title ?? "card"}.`,
            onDragOver: ({ active, over }) => {
              if (!over) return undefined;
              const column = shown.find((c) => c.id === containerOf(String(over.id), shown));
              return `${findCard(shown, String(active.id))?.card.title ?? "Card"} is over ${column?.title ?? "a column"}.`;
            },
            onDragEnd: () => undefined, // The drop is announced from onDragEnd with the final position.
            onDragCancel: ({ active }) =>
              `Move cancelled. ${findCard(columnsRef.current, String(active.id))?.card.title ?? "Card"} returned.`,
          },
        }}
      >
        <div
          ref={boardRef}
          className="forge-kb-board"
          role="group"
          aria-label={props["aria-label"] ?? "Kanban board"}
        >
          {shown.map((column) => (
            <Column
              key={column.id}
              column={column}
              columns={shown}
              props={props}
              onMove={moveFromUi}
            />
          ))}
        </div>
        <DragOverlay>
          {activeCard ? (
            <ul className="forge-kb-cards forge-kb-overlay">
              <Card
                card={activeCard.card}
                columnId={activeCard.column.id}
                columns={shown}
                props={props}
                onMove={moveFromUi}
                overlay
              />
            </ul>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

// Minimal selector escape that works in jsdom and browsers without relying on CSS.escape.
function escapeSelector(value: string): string {
  return value.replace(/["\\]/g, "\\$&");
}
