import { Fragment, useMemo, type ReactNode } from "react";
import { Button, cn, resolveLocale } from "@forge-ui/core";
import {
  clockLabel,
  dayKey,
  dayLabel,
  fullLabel,
  isValidDate,
  relativeLabel,
  toDate,
} from "./time";
import type { ActivityTimelineProps, TimelineActor, TimelineEvent } from "./types";

function initialsOf(actor: TimelineActor): string {
  if (actor.initials) return actor.initials;
  return actor.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

function Avatar({ actor }: { actor: TimelineActor }) {
  // The actor's name is already in the text, so the avatar is decorative.
  return (
    <span className="forge-tl-avatar" aria-hidden="true">
      {actor.avatarUrl ? <img src={actor.avatarUrl} alt="" loading="lazy" /> : initialsOf(actor)}
    </span>
  );
}

interface Group {
  key: string;
  label?: string;
  events: Array<{ event: TimelineEvent; date: Date }>;
}

/** Chronological feed of events with avatars, icons, grouping, metadata, and loading states. */
export function ActivityTimeline({
  events,
  groupBy = "day",
  order = "desc",
  locale: localeProp,
  relativeTime = false,
  formatTimestamp,
  now,
  loading = false,
  loadingRows = 4,
  emptyState,
  hasMore,
  onLoadMore,
  loadingMore,
  groupHeadingLevel = 3,
  renderEvent,
  "aria-label": ariaLabel = "Activity",
  className,
}: ActivityTimelineProps) {
  const reference = useMemo(() => now ?? new Date(), [now]);
  const locale = useMemo(() => resolveLocale(localeProp), [localeProp]);

  const groups = useMemo<Group[]>(() => {
    const dated = events
      .map((event) => ({ event, date: toDate(event.timestamp) }))
      .filter(({ date }) => isValidDate(date)) // Skip bad data instead of rendering "Invalid Date".
      .sort((a, b) =>
        order === "desc"
          ? b.date.getTime() - a.date.getTime()
          : a.date.getTime() - b.date.getTime(),
      );

    if (groupBy === "none") return dated.length ? [{ key: "all", events: dated }] : [];

    const result: Group[] = [];
    const index = new Map<string, Group>();
    for (const item of dated) {
      const key = typeof groupBy === "function" ? groupBy(item.event) : dayKey(item.date);
      let group = index.get(key);
      if (!group) {
        group = {
          key,
          label: typeof groupBy === "function" ? key : dayLabel(item.date, reference, locale),
          events: [],
        };
        index.set(key, group);
        result.push(group);
      }
      group.events.push(item);
    }
    return result;
  }, [events, groupBy, order, locale, reference]);

  const Heading = `h${groupHeadingLevel}` as const;
  const showSkeleton = loading && events.length === 0;
  const isEmpty = !loading && groups.length === 0;

  const renderTime = (date: Date) => {
    const label = formatTimestamp
      ? formatTimestamp(date)
      : relativeTime
        ? relativeLabel(date, reference, locale)
        : clockLabel(date, locale);
    return (
      <time className="forge-tl-time" dateTime={date.toISOString()} title={fullLabel(date, locale)}>
        {label}
      </time>
    );
  };

  const renderBody = (event: TimelineEvent, date: Date): ReactNode => (
    <>
      <div className="forge-tl-head">
        {event.actor ? <Avatar actor={event.actor} /> : null}
        <div className="forge-tl-title">
          {event.actor ? <strong className="forge-tl-actor">{event.actor.name} </strong> : null}
          {event.title}
        </div>
        {renderTime(date)}
      </div>
      {event.description ? <div className="forge-tl-desc">{event.description}</div> : null}
      {event.metadata?.length ? (
        <dl className="forge-tl-meta">
          {event.metadata.map((item) => (
            <div key={item.label} className="forge-tl-meta-item">
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </>
  );

  return (
    <div className={cn("forge-tl", className)} aria-busy={loading || undefined}>
      {showSkeleton ? (
        <ol className="forge-tl-list" aria-label={ariaLabel}>
          {Array.from({ length: loadingRows }, (_, i) => (
            <li key={i} className="forge-tl-item" aria-hidden="true">
              <span className="forge-tl-marker" />
              <div className="forge-tl-content">
                <span className="forge-tl-skeleton" style={{ width: `${60 + ((i * 13) % 30)}%` }} />
                <span className="forge-tl-skeleton" style={{ width: "35%" }} />
              </div>
            </li>
          ))}
        </ol>
      ) : null}
      {loading ? (
        <p role="status" className="forge-sr-only">
          Loading activity
        </p>
      ) : null}

      {isEmpty ? <div className="forge-tl-empty">{emptyState ?? "No activity yet."}</div> : null}

      {groups.map((group) => (
        <section
          key={group.key}
          className="forge-tl-group"
          aria-label={group.label ? undefined : ariaLabel}
          aria-labelledby={group.label ? `forge-tl-${group.key}` : undefined}
        >
          {group.label ? (
            <Heading id={`forge-tl-${group.key}`} className="forge-tl-group-title">
              {group.label}
            </Heading>
          ) : null}
          <ol className="forge-tl-list">
            {group.events.map(({ event, date }) => {
              const body = renderBody(event, date);
              return (
                <li
                  key={event.id}
                  className="forge-tl-item"
                  data-variant={event.variant ?? "default"}
                >
                  <span className="forge-tl-marker" aria-hidden="true">
                    {event.icon}
                  </span>
                  <div className="forge-tl-content">
                    {renderEvent ? <Fragment>{renderEvent(event, body)}</Fragment> : body}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}

      {hasMore ? (
        <div className="forge-tl-more">
          <Button onClick={onLoadMore} loading={loadingMore}>
            Load more
          </Button>
        </div>
      ) : null}
    </div>
  );
}
