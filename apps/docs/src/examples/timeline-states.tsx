import { useEffect, useState } from "react";
import { Button } from "@forge-ui/core";
import { ActivityTimeline, type TimelineEvent } from "@forge-ui/activity-timeline";
import { sleep } from "./_data";

const names = ["Ada Lovelace", "Grace Hopper", "Linus Torvalds"];
const page = (n: number): TimelineEvent[] =>
  Array.from({ length: 4 }, (_, i) => ({
    id: `p${n}-${i}`,
    timestamp: new Date(Date.now() - (n * 4 + i) * 3_600_000 * 5),
    title: `updated record ${1000 - (n * 4 + i)}`,
    actor: { name: names[(n + i) % names.length]! },
  }));

export default function TimelineStates() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageNumber, setPageNumber] = useState(0);

  useEffect(() => {
    sleep(1000).then(() => {
      setEvents(page(0));
      setLoading(false);
    });
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    await sleep(700);
    setEvents((list) => [...list, ...page(pageNumber + 1)]);
    setPageNumber((n) => n + 1);
    setLoadingMore(false);
  };

  return (
    <div className="space-y-3">
      <Button
        size="sm"
        onClick={() => {
          setEvents([]);
          setPageNumber(0);
          setLoading(true);
          sleep(1000).then(() => {
            setEvents(page(0));
            setLoading(false);
          });
        }}
      >
        Reload
      </Button>
      <ActivityTimeline
        events={events}
        loading={loading}
        relativeTime
        groupBy="none"
        hasMore={pageNumber < 3}
        onLoadMore={loadMore}
        loadingMore={loadingMore}
        emptyState="No activity in this period."
      />
    </div>
  );
}
