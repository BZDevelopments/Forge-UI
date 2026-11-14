import { ActivityTimeline, type TimelineEvent } from "@forge-ui/activity-timeline";

const now = Date.now();
const minutes = (n: number) => new Date(now - n * 60_000);

const events: TimelineEvent[] = [
  {
    id: "1",
    timestamp: minutes(4),
    title: "merged pull request #482",
    actor: { name: "Ada Lovelace" },
    variant: "success",
    icon: "✓",
    metadata: [
      { label: "Branch", value: "main" },
      { label: "Commit", value: "a3f9c21" },
    ],
  },
  {
    id: "2",
    timestamp: minutes(95),
    title: "commented on issue #471",
    description: "I can reproduce this on Safari 17 as well.",
    actor: { name: "Grace Hopper" },
  },
  {
    id: "3",
    timestamp: minutes(60 * 20),
    title: "Deployment to production failed",
    description: "Health check did not pass within 120 seconds.",
    variant: "danger",
    icon: "!",
    metadata: [{ label: "Region", value: "eu-west-1" }],
  },
  {
    id: "4",
    timestamp: minutes(60 * 30),
    title: "changed the plan to Team",
    actor: { name: "Linus Torvalds" },
    variant: "info",
  },
  {
    id: "5",
    timestamp: minutes(60 * 24 * 12),
    title: "created the workspace",
    actor: { name: "Margaret Hamilton" },
  },
];

export default function TimelineBasic() {
  return <ActivityTimeline events={events} aria-label="Workspace activity" />;
}
