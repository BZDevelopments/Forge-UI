import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Toaster, createNotifier, type Notifier } from "../src";

let notify: Notifier;

beforeEach(() => {
  notify = createNotifier();
});
afterEach(() => vi.useRealTimers());

const region = () => screen.getByRole("region", { name: /Notifications/ });
const items = () => within(region()).queryAllByRole("listitem");

describe("Notifications", () => {
  it("shows a notification with title and description", () => {
    render(<Toaster notifier={notify} />);
    act(() => void notify("Saved", { description: "Your changes are live." }));
    expect(items()).toHaveLength(1);
    expect(within(items()[0]!).getByText("Saved")).toBeInTheDocument();
    expect(screen.getByText("Your changes are live.")).toBeInTheDocument();
  });

  it.each([
    ["success", "Success"],
    ["error", "Error"],
    ["warning", "Warning"],
    ["info", "Information"],
    ["loading", "Loading"],
  ] as const)("renders the %s variant with a text label, not just color", (variant, label) => {
    render(<Toaster notifier={notify} />);
    act(() => void notify[variant]("Something happened"));
    expect(items()[0]).toHaveAttribute("data-variant", variant);
    expect(items()[0]).toHaveAccessibleName(label);
  });

  it("auto-dismisses after the duration", async () => {
    vi.useFakeTimers();
    render(<Toaster notifier={notify} />);
    act(() => void notify.info("Heads up", { duration: 1000 }));
    expect(items()).toHaveLength(1);
    await act(async () => vi.advanceTimersByTimeAsync(1100));
    expect(items()).toHaveLength(0);
  });

  it("keeps notifications with an infinite duration until dismissed", async () => {
    vi.useFakeTimers();
    render(<Toaster notifier={notify} />);
    act(() => void notify.error("Sticky", { duration: Infinity }));
    await act(async () => vi.advanceTimersByTimeAsync(60_000));
    expect(items()).toHaveLength(1);
  });

  it("pauses the countdown while hovered and resumes with the remaining time", async () => {
    vi.useFakeTimers();
    render(<Toaster notifier={notify} />);
    act(() => void notify("Hover me", { duration: 1000 }));
    await act(async () => vi.advanceTimersByTimeAsync(600));

    const toast = items()[0]!;
    await act(async () => {
      toast.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    });
    await act(async () => vi.advanceTimersByTimeAsync(5000));
    expect(items()).toHaveLength(1);

    await act(async () => {
      toast.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
    });
    await act(async () => vi.advanceTimersByTimeAsync(300));
    expect(items()).toHaveLength(1);
    await act(async () => vi.advanceTimersByTimeAsync(200));
    expect(items()).toHaveLength(0);
  });

  it("dismisses from the close button and with Escape", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<Toaster notifier={notify} />);
    act(() => void notify("One", { duration: Infinity, onDismiss }));
    await user.click(screen.getByRole("button", { name: "Dismiss notification" }));
    expect(items()).toHaveLength(0);
    expect(onDismiss).toHaveBeenCalledOnce();

    act(() => void notify("Two", { duration: Infinity }));
    screen.getByRole("button", { name: "Dismiss notification" }).focus();
    await user.keyboard("{Escape}");
    expect(items()).toHaveLength(0);
  });

  it("queues notifications beyond the limit and shows the next as room opens", async () => {
    const user = userEvent.setup();
    render(<Toaster notifier={notify} limit={2} />);
    act(() => {
      notify("First", { duration: Infinity });
      notify("Second", { duration: Infinity });
      notify("Third", { duration: Infinity });
    });
    expect(items()).toHaveLength(2);
    expect(screen.getByText("+1 more waiting")).toBeInTheDocument();
    // Scope to the toast region: the screen reader live region also repeats announced text.
    expect(within(region()).queryByText("Third")).not.toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Dismiss notification" })[0]!);
    expect(within(region()).getByText("Third")).toBeInTheDocument();
    expect(screen.queryByText(/more waiting/)).not.toBeInTheDocument();
  });

  it("does not start the timer of a queued notification until it is visible", async () => {
    vi.useFakeTimers();
    render(<Toaster notifier={notify} limit={1} />);
    act(() => {
      notify("A", { duration: 1000 });
      notify("B", { duration: 1000 });
    });
    await act(async () => vi.advanceTimersByTimeAsync(1100));
    expect(within(region()).getByText("B")).toBeInTheDocument();
    await act(async () => vi.advanceTimersByTimeAsync(500));
    expect(within(region()).getByText("B")).toBeInTheDocument();
    await act(async () => vi.advanceTimersByTimeAsync(600));
    expect(items()).toHaveLength(0);
  });

  describe("notify.promise", () => {
    it("moves from loading to success and returns the original promise", async () => {
      render(<Toaster notifier={notify} />);
      let resolve!: (value: string) => void;
      const pending = new Promise<string>((r) => (resolve = r));

      let returned!: Promise<string>;
      act(() => {
        returned = notify.promise(pending, {
          loading: "Saving...",
          success: (name) => `Saved ${name}`,
          error: "Unable to save",
        });
      });
      expect(items()[0]).toHaveAttribute("data-variant", "loading");
      expect(screen.getByText("Saving...")).toBeInTheDocument();

      await act(async () => resolve("report"));
      await expect(returned).resolves.toBe("report");
      expect(items()).toHaveLength(1);
      expect(items()[0]).toHaveAttribute("data-variant", "success");
      expect(screen.getByText("Saved report")).toBeInTheDocument();
    });

    it("moves to error with the rejection available to the message function", async () => {
      render(<Toaster notifier={notify} />);
      const failing = Promise.reject(new Error("disk full"));
      act(() => {
        void notify
          .promise(failing, {
            loading: "Saving...",
            success: "Saved",
            error: (error) => `Failed: ${(error as Error).message}`,
          })
          .catch(() => {});
      });
      await waitFor(() => expect(items()[0]).toHaveAttribute("data-variant", "error"));
      expect(screen.getByText("Failed: disk full")).toBeInTheDocument();
    });

    it("accepts option objects and applies the duration after settling", async () => {
      vi.useFakeTimers();
      render(<Toaster notifier={notify} />);
      let resolve!: () => void;
      act(() => {
        void notify.promise(new Promise<void>((r) => (resolve = r)), {
          loading: { title: "Uploading", description: "Please wait" },
          success: { title: "Done", description: "All good", duration: 500 },
          error: "Nope",
        });
      });
      expect(screen.getByText("Please wait")).toBeInTheDocument();
      await act(async () => resolve());
      expect(screen.getByText("All good")).toBeInTheDocument();
      await act(async () => vi.advanceTimersByTimeAsync(600));
      expect(items()).toHaveLength(0);
    });
  });

  it("runs undo and closes the notification", async () => {
    const user = userEvent.setup();
    const undo = vi.fn();
    render(<Toaster notifier={notify} />);
    act(() => void notify.success("Item deleted", { undo, duration: Infinity }));
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(undo).toHaveBeenCalledOnce();
    expect(items()).toHaveLength(0);
  });

  it("supports a custom action", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Toaster notifier={notify} />);
    act(
      () =>
        void notify.info("Update ready", {
          action: { label: "Restart", onClick },
          duration: Infinity,
        }),
    );
    await user.click(screen.getByRole("button", { name: "Restart" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders and updates a progress bar", () => {
    render(<Toaster notifier={notify} />);
    let id = "";
    act(() => {
      id = notify.loading("Uploading", { progress: 10 });
    });
    expect(screen.getByRole("progressbar", { name: "Uploading progress" })).toHaveAttribute(
      "aria-valuenow",
      "10",
    );
    act(() => notify.update(id, { progress: 70 }));
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "70");
  });

  it("updates in place when the same id is reused", () => {
    render(<Toaster notifier={notify} />);
    act(() => {
      notify("Syncing", { id: "sync", duration: Infinity });
      notify.success("Synced", { id: "sync" });
    });
    expect(items()).toHaveLength(1);
    expect(items()[0]).toHaveAttribute("data-variant", "success");
  });

  it("supports custom rendering with a dismiss helper", async () => {
    const user = userEvent.setup();
    render(<Toaster notifier={notify} />);
    act(() => {
      notify("custom", {
        duration: Infinity,
        render: (n, { dismiss }) => <button onClick={dismiss}>Close {String(n.title)}</button>,
      });
    });
    await user.click(screen.getByRole("button", { name: "Close custom" }));
    expect(items()).toHaveLength(0);
  });

  it("can dismiss everything at once", () => {
    render(<Toaster notifier={notify} />);
    act(() => {
      notify("a", { duration: Infinity });
      notify("b", { duration: Infinity });
    });
    act(() => notify.dismiss());
    expect(items()).toHaveLength(0);
  });

  it("announces notifications to screen readers, assertively for errors", async () => {
    render(<Toaster notifier={notify} />);
    act(
      () =>
        void notify.error("Payment failed", { description: "Card declined", duration: Infinity }),
    );
    await waitFor(() => {
      const alert = document.querySelector('[data-forge-announcer="assertive"]');
      expect(alert).toHaveTextContent("Error. Payment failed. Card declined");
    });
    act(() => void notify.success("Saved", { duration: Infinity }));
    await waitFor(() => {
      expect(document.querySelector('[data-forge-announcer="polite"]')).toHaveTextContent(
        "Success. Saved",
      );
    });
  });

  it("moves focus into the region with the hotkey", async () => {
    const user = userEvent.setup();
    render(<Toaster notifier={notify} />);
    act(() => void notify("Focus me", { duration: Infinity }));
    await user.keyboard("{Alt>}t{/Alt}");
    expect(screen.getByRole("button", { name: "Dismiss notification" })).toHaveFocus();
  });

  it("isolates state between notifiers", () => {
    const other = createNotifier();
    render(
      <>
        <Toaster notifier={notify} label="Primary" hotkey={false} />
        <Toaster notifier={other} label="Secondary" hotkey={false} />
      </>,
    );
    act(() => void other("Only secondary", { duration: Infinity }));
    expect(
      within(screen.getByRole("region", { name: "Primary" })).queryByText("Only secondary"),
    ).toBeNull();
    expect(
      within(screen.getByRole("region", { name: "Secondary" })).getByText("Only secondary"),
    ).toBeInTheDocument();
  });

  it("has no obvious accessibility violations", async () => {
    const { container } = render(<Toaster notifier={notify} />);
    act(() => {
      notify.success("Saved", { description: "Done", undo: () => {}, duration: Infinity });
      notify.loading("Uploading", { progress: 40 });
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});
