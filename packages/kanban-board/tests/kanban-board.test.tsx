import { useState } from "react";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";
import { KanbanBoard, moveCard, type KanbanColumnData } from "../src";

const board = (): KanbanColumnData[] => [
  {
    id: "todo",
    title: "To do",
    cards: [
      {
        id: "a",
        title: "Write docs",
        labels: [{ text: "docs", color: "#2563eb" }],
        assignees: [{ name: "Ada Lovelace" }],
      },
      { id: "b", title: "Fix login bug", description: "Users get logged out" },
      { id: "c", title: "Plan release" },
    ],
  },
  { id: "doing", title: "In progress", cards: [{ id: "d", title: "Build kanban" }] },
  { id: "done", title: "Done", cards: [] },
];

const column = (name: string) => screen.getByRole("region", { name });
const titlesIn = (name: string) =>
  within(column(name))
    .queryAllByRole("listitem")
    .filter((li) => li.hasAttribute("data-card-id"))
    .map((li) => li.getAttribute("aria-label"));
const card = (title: string) => screen.getByRole("listitem", { name: title });

describe("moveCard", () => {
  it("reorders within a column without mutating the input", () => {
    const input = board();
    const result = moveCard(input, "a", "todo", 2);
    expect("move" in result && result.move.columns[0]!.cards.map((c) => c.id)).toEqual([
      "b",
      "c",
      "a",
    ]);
    expect(input[0]!.cards.map((c) => c.id)).toEqual(["a", "b", "c"]);
  });

  it("moves between columns and reports from and to", () => {
    const result = moveCard(board(), "b", "doing", 0);
    if (!("move" in result)) throw new Error("expected a move");
    expect(result.move.from).toEqual({ columnId: "todo", index: 1 });
    expect(result.move.to).toEqual({ columnId: "doing", index: 0 });
    expect(result.move.columns[1]!.cards.map((c) => c.id)).toEqual(["b", "d"]);
  });

  it("clamps indexes and reports no-ops, missing targets, and full columns", () => {
    const clamped = moveCard(board(), "a", "doing", 99);
    expect("move" in clamped && clamped.move.to.index).toBe(1);
    expect(moveCard(board(), "a", "todo", 0)).toEqual({ error: "same" });
    expect(moveCard(board(), "zzz", "todo", 0)).toEqual({ error: "missing" });
    const limited = board();
    limited[1]!.limit = 1;
    expect(moveCard(limited, "a", "doing", 0)).toEqual({ error: "limit" });
    // Reordering inside a full column is still allowed.
    limited[0]!.limit = 3;
    expect("move" in moveCard(limited, "a", "todo", 1)).toBe(true);
  });
});

describe("KanbanBoard", () => {
  it("renders columns with counts, cards, labels, and assignees", () => {
    render(<KanbanBoard defaultColumns={board()} />);
    expect(screen.getByRole("group", { name: "Kanban board" })).toBeInTheDocument();
    expect(within(column("To do")).getByLabelText("3 cards")).toBeInTheDocument();
    expect(titlesIn("To do")).toEqual(["Write docs", "Fix login bug", "Plan release"]);
    expect(within(card("Write docs")).getByText("docs")).toBeInTheDocument();
    expect(within(card("Write docs")).getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("Users get logged out")).toBeInTheDocument();
  });

  it("shows empty columns", () => {
    render(<KanbanBoard defaultColumns={board()} emptyColumnMessage="Drop cards here" />);
    expect(within(column("Done")).getByText("Drop cards here")).toBeInTheDocument();
  });

  it("shows loading and empty-board states", () => {
    const { rerender, container } = render(<KanbanBoard loading />);
    expect(container.firstElementChild).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Loading board")).toBeInTheDocument();
    rerender(<KanbanBoard emptyState={<p>Create your first column</p>} />);
    expect(screen.getByText("Create your first column")).toBeInTheDocument();
  });

  describe("keyboard", () => {
    it("moves a card within a column with Alt+Arrow and keeps focus on it", async () => {
      const user = userEvent.setup();
      render(<KanbanBoard defaultColumns={board()} />);
      card("Write docs").focus();
      await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
      expect(titlesIn("To do")).toEqual(["Fix login bug", "Write docs", "Plan release"]);
      await waitFor(() => expect(card("Write docs")).toHaveFocus());
      await user.keyboard("{Alt>}{ArrowUp}{/Alt}");
      expect(titlesIn("To do")[0]).toBe("Write docs");
    });

    it("moves between columns with Alt+Left and Alt+Right, keeping focus", async () => {
      const user = userEvent.setup();
      render(<KanbanBoard defaultColumns={board()} />);
      card("Fix login bug").focus();
      await user.keyboard("{Alt>}{ArrowRight}{/Alt}");
      expect(titlesIn("In progress")).toEqual(["Build kanban", "Fix login bug"]);
      await waitFor(() => expect(card("Fix login bug")).toHaveFocus());
      await user.keyboard("{Alt>}{ArrowRight}{/Alt}");
      expect(titlesIn("Done")).toEqual(["Fix login bug"]);
      await user.keyboard("{Alt>}{ArrowLeft}{/Alt}");
      expect(titlesIn("In progress")).toContain("Fix login bug");
    });

    it("does nothing at the edges", async () => {
      const user = userEvent.setup();
      const onCardMove = vi.fn();
      render(<KanbanBoard defaultColumns={board()} onCardMove={onCardMove} />);
      card("Write docs").focus();
      await user.keyboard("{Alt>}{ArrowUp}{ArrowLeft}{/Alt}");
      expect(onCardMove).not.toHaveBeenCalled();
    });

    it("announces the new position", async () => {
      const user = userEvent.setup();
      render(<KanbanBoard defaultColumns={board()} />);
      card("Write docs").focus();
      await user.keyboard("{Alt>}{ArrowRight}{/Alt}");
      await waitFor(() =>
        expect(document.querySelector('[data-forge-announcer="polite"]')).toHaveTextContent(
          "Write docs moved, position 1 of 2 in In progress",
        ),
      );
    });
  });

  describe("actions menu", () => {
    it("offers Move to… for every other column and moves the card", async () => {
      const user = userEvent.setup();
      render(<KanbanBoard defaultColumns={board()} />);
      await user.click(screen.getByRole("button", { name: "Actions for Plan release" }));
      const menu = screen.getByRole("menu", { name: "Actions for Plan release" });
      expect(
        within(menu)
          .getAllByRole("menuitem")
          .map((i) => i.textContent),
      ).toEqual(["Move to In progress", "Move to Done"]);
      await waitFor(() => expect(within(menu).getAllByRole("menuitem")[0]).toHaveFocus());

      await user.keyboard("{ArrowDown}{Enter}");
      expect(titlesIn("Done")).toEqual(["Plan release"]);
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });

    it("closes with Escape and returns focus to the trigger", async () => {
      const user = userEvent.setup();
      render(<KanbanBoard defaultColumns={board()} />);
      const trigger = screen.getByRole("button", { name: "Actions for Write docs" });
      await user.click(trigger);
      await user.keyboard("{Escape}");
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });

    it("adds app-defined actions after the built-in ones", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(
        <KanbanBoard
          defaultColumns={board()}
          cardActions={(c) => [{ label: `Delete ${c.title}`, danger: true, onSelect }]}
        />,
      );
      await user.click(screen.getByRole("button", { name: "Actions for Write docs" }));
      await user.click(screen.getByRole("menuitem", { name: "Delete Write docs" }));
      expect(onSelect).toHaveBeenCalledOnce();
    });
  });

  describe("persistence", () => {
    it("reports the move with accurate positions and the new board", async () => {
      const user = userEvent.setup();
      const onCardMove = vi.fn();
      const onColumnsChange = vi.fn();
      render(
        <KanbanBoard
          defaultColumns={board()}
          onCardMove={onCardMove}
          onColumnsChange={onColumnsChange}
        />,
      );
      card("Fix login bug").focus();
      await user.keyboard("{Alt>}{ArrowRight}{/Alt}");
      expect(onCardMove).toHaveBeenCalledWith(
        expect.objectContaining({
          card: expect.objectContaining({ id: "b" }),
          from: { columnId: "todo", index: 1 },
          to: { columnId: "doing", index: 1 },
        }),
      );
      expect(onColumnsChange).toHaveBeenCalled();
    });

    it("puts the card back and reports an error when saving fails", async () => {
      const user = userEvent.setup();
      const onMoveError = vi.fn();
      render(
        <KanbanBoard
          defaultColumns={board()}
          onCardMove={() => Promise.reject(new Error("offline"))}
          onMoveError={onMoveError}
        />,
      );
      card("Write docs").focus();
      await user.keyboard("{Alt>}{ArrowRight}{/Alt}");
      await waitFor(() => expect(onMoveError).toHaveBeenCalledOnce());
      expect(titlesIn("To do")).toEqual(["Write docs", "Fix login bug", "Plan release"]);
      expect(titlesIn("In progress")).toEqual(["Build kanban"]);
      await waitFor(() =>
        expect(document.querySelector('[data-forge-announcer="assertive"]')).toHaveTextContent(
          "Could not move Write docs",
        ),
      );
    });

    it("keeps the optimistic move while saving", async () => {
      const user = userEvent.setup();
      let finish!: () => void;
      render(
        <KanbanBoard
          defaultColumns={board()}
          onCardMove={() => new Promise<void>((r) => (finish = r))}
        />,
      );
      card("Write docs").focus();
      await user.keyboard("{Alt>}{ArrowRight}{/Alt}");
      expect(titlesIn("In progress")).toContain("Write docs");
      await act(async () => finish());
      expect(titlesIn("In progress")).toContain("Write docs");
    });
  });

  it("works controlled and lets the parent veto changes", async () => {
    const user = userEvent.setup();
    function Controlled({ accept }: { accept: boolean }) {
      const [columns, setColumns] = useState(board());
      return (
        <KanbanBoard columns={columns} onColumnsChange={(next) => accept && setColumns(next)} />
      );
    }
    const { unmount } = render(<Controlled accept />);
    card("Write docs").focus();
    await user.keyboard("{Alt>}{ArrowRight}{/Alt}");
    expect(titlesIn("In progress")).toContain("Write docs");
    unmount();

    render(<Controlled accept={false} />);
    card("Write docs").focus();
    await user.keyboard("{Alt>}{ArrowRight}{/Alt}");
    expect(titlesIn("To do")[0]).toBe("Write docs");
  });

  it("blocks moves into a full column and announces why", async () => {
    const user = userEvent.setup();
    const columns = board();
    columns[1]!.limit = 1;
    render(<KanbanBoard defaultColumns={columns} />);
    expect(within(column("In progress")).getByLabelText("1 of 1 cards")).toBeInTheDocument();
    card("Write docs").focus();
    await user.keyboard("{Alt>}{ArrowRight}{/Alt}");
    expect(titlesIn("To do")[0]).toBe("Write docs");
    await waitFor(() =>
      expect(document.querySelector('[data-forge-announcer="assertive"]')).toHaveTextContent(
        "In progress is full. The limit is 1.",
      ),
    );
  });

  it("adds cards through onAddCard and handles card clicks", async () => {
    const user = userEvent.setup();
    const onAddCard = vi.fn();
    const onCardClick = vi.fn();
    render(
      <KanbanBoard defaultColumns={board()} onAddCard={onAddCard} onCardClick={onCardClick} />,
    );
    await user.click(screen.getByRole("button", { name: "Add card to Done" }));
    expect(onAddCard).toHaveBeenCalledWith("done");
    await user.click(screen.getByText("Fix login bug"));
    expect(onCardClick).toHaveBeenCalledWith(expect.objectContaining({ id: "b" }), "todo");
    // Using the menu must not count as opening the card.
    onCardClick.mockClear();
    await user.click(screen.getByRole("button", { name: "Actions for Plan release" }));
    expect(onCardClick).not.toHaveBeenCalled();
  });

  it("supports custom card rendering", () => {
    render(
      <KanbanBoard
        defaultColumns={board()}
        renderCard={(c, { columnId }) => (
          <span data-testid="x">
            {c.title}@{columnId}
          </span>
        )}
      />,
    );
    expect(screen.getAllByTestId("x")[0]).toHaveTextContent("Write docs@todo");
    // The handle stays available for custom cards.
    expect(screen.getByRole("button", { name: "Move Write docs" })).toBeInTheDocument();
  });

  it("exposes drag instructions to screen readers through the handle", () => {
    render(<KanbanBoard defaultColumns={board()} />);
    const handle = screen.getByRole("button", { name: "Move Write docs" });
    expect(handle).toHaveAttribute("aria-roledescription", "sortable");
    expect(handle).toHaveAccessibleDescription(/press space or enter/i);
  });

  it("has no obvious accessibility violations", async () => {
    const user = userEvent.setup();
    const { container } = render(<KanbanBoard defaultColumns={board()} onAddCard={() => {}} />);
    expect(await axe(container)).toHaveNoViolations();
    await user.click(screen.getByRole("button", { name: "Actions for Write docs" }));
    expect(await axe(container, { rules: { region: { enabled: false } } })).toHaveNoViolations();
  });
});
