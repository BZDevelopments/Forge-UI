import { KanbanBoard, type KanbanColumnData } from "@forge-ui/kanban-board";

interface Ticket {
  points: number;
}

const columns: KanbanColumnData[] = [
  {
    id: "backlog",
    title: "Backlog",
    cards: [
      { id: "a", title: "Single sign-on", data: { points: 8 } satisfies Ticket },
      { id: "b", title: "Audit log export", data: { points: 3 } satisfies Ticket },
    ],
  },
  {
    id: "review",
    title: "In review",
    cards: [{ id: "c", title: "Billing portal", data: { points: 5 } satisfies Ticket }],
  },
  { id: "shipped", title: "Shipped", cards: [] },
];

export default function KanbanCustom() {
  return (
    <KanbanBoard
      aria-label="Roadmap"
      defaultColumns={columns}
      emptyColumnMessage="Nothing shipped yet"
      renderCard={(card, { dragging }) => (
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium">{card.title}</span>
          <span className="rounded-full bg-forge-accent-soft px-2 text-xs font-semibold">
            {(card.data as Ticket).points} pts{dragging ? " ·" : ""}
          </span>
        </div>
      )}
    />
  );
}
