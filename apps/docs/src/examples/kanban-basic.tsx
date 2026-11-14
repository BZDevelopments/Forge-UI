import { useState } from "react";
import { KanbanBoard, type KanbanColumnData } from "@forge-ui/kanban-board";
import { notify } from "@forge-ui/notifications";
import { sleep } from "./_data";

const initial: KanbanColumnData[] = [
  {
    id: "todo",
    title: "To do",
    cards: [
      {
        id: "1",
        title: "Write the migration guide",
        labels: [{ text: "docs", color: "#2563eb" }],
        assignees: [{ name: "Ada Lovelace" }],
      },
      {
        id: "2",
        title: "Fix flaky upload test",
        description: "Fails about 1 in 20 runs on CI",
        labels: [{ text: "bug", color: "#dc2626" }],
      },
      {
        id: "3",
        title: "Audit color contrast",
        labels: [{ text: "a11y", color: "#16a34a" }],
        assignees: [{ name: "Grace Hopper" }, { name: "Linus Torvalds" }],
      },
    ],
  },
  {
    id: "doing",
    title: "In progress",
    limit: 2,
    cards: [
      { id: "4", title: "Kanban keyboard support", assignees: [{ name: "Margaret Hamilton" }] },
    ],
  },
  { id: "done", title: "Done", cards: [{ id: "5", title: "Ship the data table" }] },
];

export default function KanbanBasic() {
  const [columns, setColumns] = useState(initial);
  const [flaky, setFlaky] = useState(false);

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={flaky} onChange={(e) => setFlaky(e.target.checked)} />
        Make saving fail, so moves are rolled back
      </label>
      <KanbanBoard
        aria-label="Sprint board"
        columns={columns}
        onColumnsChange={setColumns}
        onCardMove={async () => {
          await sleep(500); // Replace with PATCH /api/cards/:id
          if (flaky) throw new Error("offline");
        }}
        onMoveError={() =>
          notify.error("Could not save the move", { description: "The card was put back." })
        }
        onAddCard={(columnId) => notify.info(`Add a card to “${columnId}” here`)}
        cardActions={(card) => [
          {
            label: "Delete card",
            danger: true,
            onSelect: () =>
              setColumns((cols) =>
                cols.map((c) => ({ ...c, cards: c.cards.filter((x) => x.id !== card.id) })),
              ),
          },
        ]}
      />
    </div>
  );
}
