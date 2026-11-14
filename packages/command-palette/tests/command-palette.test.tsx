import { useState } from "react";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CommandPalette, searchCommands, type Command } from "../src";

const baseCommands: Command[] = [
  { id: "dashboard", label: "Go to dashboard", group: "Navigation", keywords: ["home"] },
  { id: "settings", label: "Open settings", group: "Navigation", shortcut: "ctrl+," },
  {
    id: "invite",
    label: "Invite teammate",
    group: "Team",
    description: "Send an invitation email",
  },
  { id: "archive", label: "Archive project", group: "Team", disabled: true },
];

function setup(props: Partial<React.ComponentProps<typeof CommandPalette>> = {}) {
  const onSelect = vi.fn();
  const utils = render(
    <CommandPalette
      commands={baseCommands}
      defaultOpen
      shortcut="ctrl+k"
      onSelect={onSelect}
      {...props}
    />,
  );
  return { onSelect, user: userEvent.setup(), ...utils };
}

const options = () => screen.queryAllByRole("option");
const input = () => screen.getByRole("combobox");

describe("CommandPalette", () => {
  beforeEach(() => window.localStorage.clear());

  it("opens and closes with the keyboard shortcut", async () => {
    const user = userEvent.setup();
    render(<CommandPalette commands={baseCommands} shortcut="ctrl+k" />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.keyboard("{Control>}k{/Control}");
    expect(screen.getByRole("dialog", { name: "Command palette" })).toBeInTheDocument();
    expect(input()).toHaveFocus();
    await user.keyboard("{Control>}k{/Control}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders grouped commands with headings and shortcut hints", () => {
    setup();
    expect(options()).toHaveLength(4);
    expect(screen.getByText("Navigation")).toBeInTheDocument();
    expect(screen.getByText("Team")).toBeInTheDocument();
    expect(screen.getByText("Send an invitation email")).toBeInTheDocument();
    expect(screen.getByText(/Ctrl ,|⌃,|Ctrl,/)).toBeInTheDocument();
  });

  it("fuzzy searches labels, keywords, and descriptions", async () => {
    const { user } = setup();
    await user.type(input(), "gtd");
    expect(options().map((option) => option.textContent)).toEqual([
      expect.stringContaining("Go to dashboard"),
    ]);

    await user.clear(input());
    await user.type(input(), "home");
    expect(options()).toHaveLength(1);

    await user.clear(input());
    await user.type(input(), "invitation");
    expect(options()[0]).toHaveTextContent("Invite teammate");
  });

  it("shows an empty state when nothing matches", async () => {
    const { user } = setup({ emptyMessage: "Nothing found." });
    await user.type(input(), "qqqq");
    expect(screen.getByText("Nothing found.")).toBeInTheDocument();
    expect(input()).not.toHaveAttribute("aria-activedescendant");
  });

  it("navigates with arrow keys, wraps around, and selects with Enter", async () => {
    const { user, onSelect } = setup();
    expect(options()[0]).toHaveAttribute("aria-selected", "true");
    expect(input()).toHaveAttribute("aria-activedescendant", options()[0]!.id);

    await user.keyboard("{ArrowDown}");
    expect(options()[1]).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowUp}{ArrowUp}");
    expect(options()[3]).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "dashboard" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("selects with the pointer and runs the command's own handler", async () => {
    const run = vi.fn();
    const { user, onSelect } = setup({
      commands: [{ id: "a", label: "Run a thing", onSelect: run }],
    });
    await user.click(screen.getByRole("option", { name: /Run a thing/ }));
    expect(run).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("does not run disabled commands", async () => {
    const { user, onSelect } = setup();
    const archive = screen.getByRole("option", { name: /Archive project/ });
    expect(archive).toHaveAttribute("aria-disabled", "true");
    await user.click(archive);
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("supports nested commands, Backspace to go back, and Escape to step out before closing", async () => {
    const commands: Command[] = [
      {
        id: "theme",
        label: "Change theme",
        children: [
          { id: "light", label: "Light" },
          { id: "dark", label: "Dark" },
        ],
      },
      { id: "other", label: "Something else" },
    ];
    const { user, onSelect } = setup({ commands });

    await user.click(screen.getByRole("option", { name: /Change theme/ }));
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Command path")).toHaveTextContent("Change theme");
    expect(options().map((o) => o.textContent)).toEqual(["Light", "Dark"]);

    await user.keyboard("{Backspace}");
    expect(screen.queryByLabelText("Command path")).not.toBeInTheDocument();
    expect(options()).toHaveLength(2);

    await user.click(screen.getByRole("option", { name: /Change theme/ }));
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByLabelText("Command path")).not.toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("loads nested commands lazily", async () => {
    const loadChildren = vi.fn().mockResolvedValue([{ id: "repo-1", label: "forge-ui" }]);
    const { user } = setup({ commands: [{ id: "repos", label: "Open repository", loadChildren }] });
    await user.click(screen.getByRole("option"));
    expect(await screen.findByRole("option", { name: "forge-ui" })).toBeInTheDocument();
  });

  it("shows a pending state for async commands and closes when they finish", async () => {
    let resolve!: () => void;
    const pending = new Promise<void>((r) => (resolve = r));
    const { user } = setup({
      commands: [{ id: "deploy", label: "Deploy", onSelect: () => pending }],
    });
    await user.click(screen.getByRole("option"));
    expect(screen.getByRole("status", { name: "Running" })).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await act(async () => resolve());
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("keeps the palette open and reports the error when an async command fails", async () => {
    const { user, onSelect } = setup({
      commands: [
        { id: "x", label: "Fail", onSelect: () => Promise.reject(new Error("Deploy failed")) },
      ],
    });
    await user.click(screen.getByRole("option"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Deploy failed");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("loads async results for the query and shows a loading state", async () => {
    let resolve!: (commands: Command[]) => void;
    const loadCommands = vi.fn(() => new Promise<Command[]>((r) => (resolve = r)));
    const { user } = setup({ loadCommands, loadDebounceMs: 0, commands: [] });
    await user.type(input(), "ab");
    await waitFor(() => expect(loadCommands).toHaveBeenCalled());
    expect(screen.getByText("Loading…")).toBeInTheDocument();
    expect(screen.getByRole("listbox")).toHaveAttribute("aria-busy", "true");

    await act(async () => resolve([{ id: "r1", label: "Remote result" }]));
    expect(await screen.findByRole("option", { name: "Remote result" })).toBeInTheDocument();
    expect(screen.getByText("Results")).toBeInTheDocument();
  });

  it("ignores stale async responses after the query changes", async () => {
    const pending = new Map<string, (commands: Command[]) => void>();
    const loadCommands = vi.fn(
      (query: string) => new Promise<Command[]>((resolve) => pending.set(query, resolve)),
    );
    const { user } = setup({ loadCommands, loadDebounceMs: 0, commands: [] });
    await user.type(input(), "a");
    await waitFor(() => expect(pending.has("a")).toBe(true));
    await user.type(input(), "b");
    await waitFor(() => expect(pending.has("ab")).toBe(true));

    // The response for "a" arrives late and must be ignored.
    await act(async () => pending.get("a")!([{ id: "old", label: "Old result" }]));
    await act(async () => pending.get("ab")!([{ id: "new", label: "New result" }]));
    expect(screen.queryByText("Old result")).not.toBeInTheDocument();
    expect(await screen.findByText("New result")).toBeInTheDocument();
  });

  it("remembers recent commands and lists them first", async () => {
    const user = userEvent.setup();
    function Harness() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <button onClick={() => setOpen(true)}>open</button>
          <CommandPalette
            commands={baseCommands}
            open={open}
            onOpenChange={setOpen}
            shortcut={false}
            recent
          />
        </>
      );
    }
    render(<Harness />);
    await user.click(screen.getByRole("option", { name: /Invite teammate/ }));
    expect(JSON.parse(window.localStorage.getItem("forge-ui:command-palette:recent")!)).toEqual([
      "invite",
    ]);

    await user.click(screen.getByText("open"));
    expect(screen.getByText("Recent")).toBeInTheDocument();
    expect(options()[0]).toHaveTextContent("Invite teammate");
    expect(options()).toHaveLength(5);
    // The recent copy and the grouped copy must have distinct DOM ids.
    const ids = options().map((option) => option.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("can keep recent history in memory only", async () => {
    const { user } = setup({ recent: { storageKey: null } });
    await user.click(screen.getByRole("option", { name: /Go to dashboard/ }));
    expect(window.localStorage.length).toBe(0);
  });

  it("works as a controlled component", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <CommandPalette
        commands={baseCommands}
        open={false}
        onOpenChange={onOpenChange}
        shortcut="ctrl+k"
      />,
    );
    await user.keyboard("{Control>}k{/Control}");
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    rerender(
      <CommandPalette commands={baseCommands} open onOpenChange={onOpenChange} shortcut="ctrl+k" />,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("highlights matched characters without injecting markup", async () => {
    const { user } = setup({ commands: [{ id: "x", label: "<img src=x onerror=alert(1)>" }] });
    await user.type(input(), "img");
    expect(document.querySelector("img")).toBeNull();
    expect(screen.getByRole("option")).toHaveTextContent("<img src=x onerror=alert(1)>");
  });

  it("has no obvious accessibility violations", async () => {
    setup();
    const dialog = screen.getByRole("dialog");
    expect(await axe(dialog)).toHaveNoViolations();
    expect(within(dialog).getByRole("listbox")).toBeInTheDocument();
  });
});

describe("searchCommands", () => {
  it("keeps order for an empty query and ranks label matches first", () => {
    expect(searchCommands(baseCommands, "").map((r) => r.command.id)).toEqual(
      baseCommands.map((c) => c.id),
    );
    const ranked = searchCommands(
      [
        { id: "kw", label: "Zebra", keywords: ["settings"] },
        { id: "label", label: "Settings" },
      ],
      "settings",
    );
    expect(ranked[0]!.command.id).toBe("label");
  });
});

describe("focus return", () => {
  it("returns focus to the element that opened a palette that has no trigger of its own", async () => {
    const user = userEvent.setup();
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>open palette</button>
          <CommandPalette
            commands={baseCommands}
            open={open}
            onOpenChange={setOpen}
            shortcut={false}
          />
        </>
      );
    }
    render(<Harness />);
    const opener = screen.getByRole("button", { name: "open palette" });
    await user.click(opener);
    expect(input()).toHaveFocus();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(opener).toHaveFocus());
  });
});
