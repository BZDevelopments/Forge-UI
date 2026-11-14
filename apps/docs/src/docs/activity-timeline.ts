import type { ComponentDoc } from "./types";
import basic from "../examples/timeline-basic.tsx?raw";
import states from "../examples/timeline-states.tsx?raw";
import TimelineBasic from "../examples/timeline-basic";
import TimelineStates from "../examples/timeline-states";

export const activityTimeline: ComponentDoc = {
  slug: "activity-timeline",
  name: "Activity timeline",
  pkg: "activity-timeline",
  summary:
    "A chronological feed for audit logs, activity streams, and histories, with avatars, icons, grouping by day, metadata, relative or absolute times, and loading and empty states.",
  keywords: ["timeline", "activity", "feed", "audit log", "history", "events"],
  whenToUse: [
    "You show what happened, who did it, and when: deploys, edits, comments, status changes.",
  ],
  usage: `import { ActivityTimeline } from "@forge-ui/activity-timeline";

<ActivityTimeline events={events} aria-label="Workspace activity" />`,
  examples: [
    {
      id: "basic",
      title: "Grouped events with metadata",
      description:
        "Events are grouped under day headings (“Today”, “Yesterday”), sorted newest first, with avatars, icons, and key-value metadata.",
      Component: TimelineBasic,
      code: basic,
    },
    {
      id: "states",
      title: "Loading, relative time, and load more",
      description:
        "A skeleton on first load, relative timestamps, and a Load more button that keeps existing events visible.",
      Component: TimelineStates,
      code: states,
    },
  ],
  api: [
    {
      title: "ActivityTimeline props",
      rows: [
        {
          name: "events",
          type: "TimelineEvent[]",
          description:
            "`{ id, timestamp, title, description?, actor?, icon?, variant?, metadata?, group? }`. Events with invalid timestamps are skipped.",
        },
        {
          name: "groupBy",
          type: '"day" | "none" | (event) => string',
          default: '"day"',
          description: "Group headings. A function returns your own group key and label.",
        },
        {
          name: "order",
          type: '"desc" | "asc"',
          default: '"desc"',
          description: "Newest first by default.",
        },
        {
          name: "locale",
          type: "string",
          description: "For day headings and times. Defaults to the browser language.",
        },
        {
          name: "relativeTime",
          type: "boolean",
          default: "false",
          description: "Show “5 minutes ago”. The full date stays in a tooltip.",
        },
        { name: "formatTimestamp", type: "(date) => string", description: "Custom time text." },
        {
          name: "now",
          type: "Date",
          description: "Reference time for relative labels and “Today”.",
        },
        {
          name: "loading / loadingRows",
          type: "boolean / number",
          description: "Skeleton rows while loading with no events.",
        },
        { name: "emptyState", type: "ReactNode", description: "Shown when there are no events." },
        {
          name: "hasMore / onLoadMore / loadingMore",
          type: "—",
          description: "Adds a Load more button.",
        },
        {
          name: "groupHeadingLevel",
          type: "2–6",
          default: "3",
          description: "Heading level for group titles. Match your page outline.",
        },
        {
          name: "renderEvent",
          type: "(event, defaultContent) => ReactNode",
          description: "Custom rendering. Compose around the default content or replace it.",
        },
        {
          name: "aria-label",
          type: "string",
          default: '"Activity"',
          description: "Accessible name.",
        },
      ],
    },
  ],
  keyboard: [
    {
      keys: "Tab",
      action:
        "Reaches interactive content you render, and the Load more button. The feed itself is read in order.",
    },
  ],
  accessibility: [
    "Events are ordered lists inside labelled sections, with real headings for each group.",
    "Times use `<time datetime>` with the full date in the tooltip, so the exact moment is available to everyone.",
    "Avatars are decorative because the actor's name is in the text. Variants add icons and never rely on color alone.",
    "The loading state sets `aria-busy` and announces “Loading activity”.",
  ],
  customization: [
    "Use `icon` for markers and `renderEvent` for layout. Restyle with `.forge-tl-*` classes.",
    "Event content is rendered as React nodes, never as HTML strings.",
  ],
  mistakes: [
    "Passing strings like “2024-03-01” without a time zone and expecting a specific hour. Pass `Date` objects or ISO strings with an offset.",
    "Using `relativeTime` for old events. “14 months ago” is vague; switch to dates when precision matters.",
  ],
};
