import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";
import { ActivityTimeline, type TimelineEvent } from "../src";

const now = new Date(2025, 2, 15, 12, 0, 0);
const at = (days: number, hours: number, minutes = 0) =>
  new Date(2025, 2, 15 - days, hours, minutes);

const events: TimelineEvent[] = [
  {
    id: "1",
    timestamp: at(0, 11, 30),
    title: "merged pull request #42",
    actor: { name: "Ada Lovelace" },
    variant: "success",
    icon: "✓",
    metadata: [{ label: "Branch", value: "main" }],
  },
  {
    id: "2",
    timestamp: at(0, 9, 5),
    title: "commented on issue #7",
    description: "Looks good to me.",
    actor: { name: "Grace Hopper", avatarUrl: "https://example.com/g.png" },
  },
  { id: "3", timestamp: at(1, 17, 0), title: "deployed to production", variant: "info" },
  { id: "4", timestamp: at(30, 8, 0), title: "created the repository" },
];

const base = { locale: "en-US", now };

describe("ActivityTimeline", () => {
  it("does not crash when the browser reports a locale tag that Intl rejects", () => {
    const original = Object.getOwnPropertyDescriptor(window.navigator, "language");
    Object.defineProperty(window.navigator, "language", {
      configurable: true,
      value: "en-US@posix",
    });
    Object.defineProperty(window.navigator, "languages", {
      configurable: true,
      value: ["en-US@posix"],
    });
    try {
      render(<ActivityTimeline events={events} now={now} relativeTime />);
      expect(screen.getAllByRole("listitem").length).toBeGreaterThan(0);
    } finally {
      if (original) Object.defineProperty(window.navigator, "language", original);
      Object.defineProperty(window.navigator, "languages", {
        configurable: true,
        value: ["en-US"],
      });
    }
  });

  it("groups events by day with relative headings, newest first", () => {
    render(<ActivityTimeline events={events} {...base} />);
    const headings = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual(["Today", "Yesterday", "Thursday, February 13"]);
    const today = screen.getByRole("region", { name: "Today" });
    const titles = within(today)
      .getAllByRole("listitem")
      .map((li) => li.textContent);
    expect(titles[0]).toContain("merged pull request #42");
    expect(titles[1]).toContain("commented on issue #7");
  });

  it("can render oldest first", () => {
    render(<ActivityTimeline events={events} order="asc" {...base} />);
    expect(screen.getAllByRole("heading", { level: 3 })[0]).toHaveTextContent(
      "Thursday, February 13",
    );
  });

  it("renders actor names, descriptions, metadata, and icons", () => {
    render(<ActivityTimeline events={events} {...base} />);
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("Looks good to me.")).toBeInTheDocument();
    const metadata = screen.getByText("Branch").closest("dl")!;
    expect(within(metadata).getByText("main")).toBeInTheDocument();
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("uses decorative avatars: image alt is empty and initials are hidden from assistive tech", () => {
    const { container } = render(<ActivityTimeline events={events} {...base} />);
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
    const initials = screen.getByText("AL");
    expect(initials).toHaveAttribute("aria-hidden", "true");
  });

  it("exposes machine-readable times with a full date tooltip", () => {
    render(<ActivityTimeline events={events} {...base} />);
    const time = screen.getByText("11:30 AM");
    expect(time.tagName).toBe("TIME");
    expect(time).toHaveAttribute("datetime", at(0, 11, 30).toISOString());
    expect(time.getAttribute("title")).toContain("March 15, 2025");
  });

  it("supports relative times and custom formatting", () => {
    const { rerender } = render(
      <ActivityTimeline events={events.slice(0, 1)} relativeTime {...base} />,
    );
    expect(screen.getByText("30 minutes ago")).toBeInTheDocument();
    rerender(
      <ActivityTimeline
        events={events.slice(0, 1)}
        formatTimestamp={(d) => `T${d.getHours()}`}
        {...base}
      />,
    );
    expect(screen.getByText("T11")).toBeInTheDocument();
  });

  it("can skip grouping or group with a custom key", () => {
    const { rerender } = render(<ActivityTimeline events={events} groupBy="none" {...base} />);
    expect(screen.queryAllByRole("heading")).toHaveLength(0);
    expect(screen.getAllByRole("listitem")).toHaveLength(4);

    rerender(
      <ActivityTimeline
        events={events}
        groupBy={(e) => (e.actor ? "People" : "System")}
        groupHeadingLevel={2}
        {...base}
      />,
    );
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual([
      "People",
      "System",
    ]);
  });

  it("skips events with invalid timestamps instead of crashing", () => {
    render(
      <ActivityTimeline
        events={[...events, { id: "bad", timestamp: "not a date", title: "broken" }]}
        {...base}
      />,
    );
    expect(screen.queryByText("broken")).not.toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
  });

  it("shows an empty state, custom or default", () => {
    const { rerender } = render(<ActivityTimeline events={[]} {...base} />);
    expect(screen.getByText("No activity yet.")).toBeInTheDocument();
    rerender(<ActivityTimeline events={[]} emptyState={<p>Nothing to see</p>} {...base} />);
    expect(screen.getByText("Nothing to see")).toBeInTheDocument();
  });

  it("shows a loading skeleton and announces it", () => {
    const { container } = render(
      <ActivityTimeline events={[]} loading loadingRows={3} {...base} />,
    );
    expect(container.firstElementChild).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Loading activity")).toBeInTheDocument();
    expect(screen.queryByText("No activity yet.")).not.toBeInTheDocument();
  });

  it("keeps existing events visible while loading more", async () => {
    const user = userEvent.setup();
    const onLoadMore = vi.fn();
    const { rerender } = render(
      <ActivityTimeline events={events} hasMore onLoadMore={onLoadMore} {...base} />,
    );
    await user.click(screen.getByRole("button", { name: "Load more" }));
    expect(onLoadMore).toHaveBeenCalledOnce();
    rerender(
      <ActivityTimeline
        events={events}
        hasMore
        loadingMore
        onLoadMore={onLoadMore}
        loading
        {...base}
      />,
    );
    expect(screen.getByRole("button", { name: "Load more" })).toBeDisabled();
    expect(screen.getAllByRole("listitem").length).toBe(4);
  });

  it("supports custom event rendering and keeps the default body available", () => {
    render(
      <ActivityTimeline
        events={events.slice(2, 3)}
        renderEvent={(event, body) => (
          <div data-testid="custom">
            <span>custom:{event.id}</span>
            {body}
          </div>
        )}
        {...base}
      />,
    );
    expect(screen.getByTestId("custom")).toHaveTextContent("custom:3");
    expect(screen.getByTestId("custom")).toHaveTextContent("deployed to production");
  });

  it("does not render event text as HTML", () => {
    render(
      <ActivityTimeline
        events={[{ id: "x", timestamp: now, title: "<img src=x onerror=alert(1)>" }]}
        {...base}
      />,
    );
    expect(document.querySelector("img")).toBeNull();
    expect(screen.getByText("<img src=x onerror=alert(1)>")).toBeInTheDocument();
  });

  it("has no obvious accessibility violations", async () => {
    const { container } = render(<ActivityTimeline events={events} hasMore {...base} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
