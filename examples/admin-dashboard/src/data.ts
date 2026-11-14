import type { KanbanColumnData } from "@forge-ui/kanban-board";
import type { TimelineEvent } from "@forge-ui/activity-timeline";

export interface Customer {
  id: string;
  name: string;
  email: string;
  plan: "Free" | "Pro" | "Team";
  seats: number;
}

const plans = ["Free", "Pro", "Team"] as const;
const names = [
  "Ada Lovelace",
  "Grace Hopper",
  "Linus Torvalds",
  "Margaret Hamilton",
  "Alan Turing",
  "Barbara Liskov",
];

export const customers: Customer[] = Array.from({ length: 60 }, (_, i) => {
  const name = names[i % names.length]!;
  return {
    id: `c${i + 1}`,
    name,
    email: `${name.split(" ")[0]!.toLowerCase()}${i}@example.com`,
    plan: plans[i % plans.length]!,
    seats: 1 + ((i * 7) % 25),
  };
});

export const initialBoard: KanbanColumnData[] = [
  {
    id: "new",
    title: "New",
    cards: [
      {
        id: "t1",
        title: "Review enterprise request",
        labels: [{ text: "sales", color: "#2563eb" }],
      },
      { id: "t2", title: "Fix invoice rounding" },
    ],
  },
  {
    id: "doing",
    title: "In progress",
    limit: 3,
    cards: [{ id: "t3", title: "Migrate billing webhooks", assignees: [{ name: "Ada Lovelace" }] }],
  },
  { id: "done", title: "Done", cards: [{ id: "t4", title: "Rotate API keys" }] },
];

const now = Date.now();
export const activity: TimelineEvent[] = [
  {
    id: "a1",
    timestamp: new Date(now - 12 * 60_000),
    title: "upgraded Initech to Team",
    actor: { name: "Grace Hopper" },
    variant: "success",
    icon: "↑",
  },
  {
    id: "a2",
    timestamp: new Date(now - 3 * 3_600_000),
    title: "failed login for admin@acme.test",
    variant: "warning",
    icon: "!",
    metadata: [{ label: "IP", value: "203.0.113.9" }],
  },
  {
    id: "a3",
    timestamp: new Date(now - 26 * 3_600_000),
    title: "invited margaret@example.com",
    actor: { name: "Linus Torvalds" },
  },
];
