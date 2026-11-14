import type { ReactNode } from "react";

export interface TimelineActor {
  name: string;
  avatarUrl?: string;
  /** Shown when there is no avatar image. Defaults to the first letters of the name. */
  initials?: string;
}

export type TimelineVariant = "default" | "success" | "warning" | "danger" | "info";

export interface TimelineEvent {
  id: string;
  timestamp: Date | string | number;
  title: ReactNode;
  description?: ReactNode;
  actor?: TimelineActor;
  /** Replaces the default marker dot. */
  icon?: ReactNode;
  variant?: TimelineVariant;
  /** Key and value pairs shown under the event, such as IP address or record id. */
  metadata?: Array<{ label: string; value: ReactNode }>;
  /** Your own grouping key. Used when `groupBy` is a function-less custom setup. */
  group?: string;
}

export interface ActivityTimelineProps {
  events: TimelineEvent[];
  /** Group headings by calendar day, or not at all. A function returns your own group key. Defaults to `day`. */
  groupBy?: "day" | "none" | ((event: TimelineEvent) => string);
  /** Newest first by default. */
  order?: "desc" | "asc";
  locale?: string;
  /** Show "5 minutes ago" instead of a clock time. The full date stays in a tooltip and `<time>` attribute. */
  relativeTime?: boolean;
  formatTimestamp?: (date: Date) => string;
  /** The reference time for relative labels and "Today". Useful for tests. */
  now?: Date;
  loading?: boolean;
  /** Skeleton rows while loading with no events. */
  loadingRows?: number;
  emptyState?: ReactNode;
  /** Show a "Load more" button. */
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  /** Heading level for group titles. Defaults to 3. */
  groupHeadingLevel?: 2 | 3 | 4 | 5 | 6;
  renderEvent?: (event: TimelineEvent, defaultContent: ReactNode) => ReactNode;
  "aria-label"?: string;
  className?: string;
}
