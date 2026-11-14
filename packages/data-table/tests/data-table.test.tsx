import { useState } from "react";
import { render, screen, within, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { DataTable, escapeCsvCell, toCsv, type DataTableColumn } from "../src";

interface Person {
  id: string;
  name: string;
  role: string;
  age: number;
}

const people: Person[] = [
  { id: "1", name: "Ada Lovelace", role: "Engineer", age: 36 },
  { id: "2", name: "Grace Hopper", role: "Admiral", age: 85 },
  { id: "3", name: "Linus Torvalds", role: "Maintainer", age: 54 },
  { id: "4", name: "Margaret Hamilton", role: "Engineer", age: 87 },
];

const columns: DataTableColumn<Person>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "role", header: "Role" },
  { accessorKey: "age", header: "Age", meta: { align: "right" } },
];

const getRowId = (row: Person) => row.id;

function bodyRows() {
  return screen.getAllByRole("row").slice(1);
}
function names() {
  return screen
    .getAllByRole("gridcell")
    .filter((cell) => cell.getAttribute("data-col") === "0")
    .map((cell) => cell.textContent);
}

describe("DataTable", () => {
  it("renders headers and rows", () => {
    render(<DataTable aria-label="People" columns={columns} data={people} getRowId={getRowId} />);
    expect(screen.getByRole("grid", { name: "People" })).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")).toHaveLength(3);
    expect(names()).toEqual(people.map((p) => p.name));
  });

  it("sorts when a header is clicked and cycles direction", async () => {
    const user = userEvent.setup();
    render(<DataTable aria-label="People" columns={columns} data={people} getRowId={getRowId} />);
    const header = screen.getByRole("columnheader", { name: /age/i });
    expect(header).toHaveAttribute("aria-sort", "none");

    await user.click(within(header).getByRole("button"));
    expect(header).toHaveAttribute("aria-sort", "ascending");
    expect(names()[0]).toBe("Ada Lovelace");

    await user.click(within(header).getByRole("button"));
    expect(header).toHaveAttribute("aria-sort", "descending");
    expect(names()[0]).toBe("Margaret Hamilton");
  });

  it("filters with the global search box", async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        aria-label="People"
        columns={columns}
        data={people}
        searchable
        getRowId={getRowId}
      />,
    );
    await user.type(screen.getByRole("searchbox", { name: "Search table" }), "engineer");
    expect(names()).toEqual(["Ada Lovelace", "Margaret Hamilton"]);
  });

  it("shows an empty state when nothing matches", async () => {
    const user = userEvent.setup();
    render(<DataTable aria-label="People" columns={columns} data={people} searchable />);
    await user.type(screen.getByRole("searchbox"), "zzz");
    expect(screen.getByText("No results match your filters.")).toBeInTheDocument();
  });

  it("supports a custom empty state and loading skeleton", () => {
    const { rerender } = render(
      <DataTable aria-label="People" columns={columns} data={[]} emptyState={<p>Nobody here</p>} />,
    );
    expect(screen.getByText("Nobody here")).toBeInTheDocument();
    rerender(<DataTable aria-label="People" columns={columns} data={[]} loading />);
    expect(screen.getByRole("grid")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Loading data")).toBeInTheDocument();
    expect(screen.queryByText("Nobody here")).not.toBeInTheDocument();
  });

  it("shows an error with a retry action", async () => {
    const onRetry = vi.fn();
    render(
      <DataTable
        aria-label="People"
        columns={columns}
        data={[]}
        error="Could not load people"
        onRetry={onRetry}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Could not load people");
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("paginates client-side data", async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        aria-label="People"
        columns={columns}
        data={people}
        pagination={{ pageSize: 2, pageSizeOptions: [2, 4] }}
      />,
    );
    expect(names()).toHaveLength(2);
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(names()).toEqual(["Linus Torvalds", "Margaret Hamilton"]);
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  it("selects rows and reports them", async () => {
    const user = userEvent.setup();
    const onSelectedRowsChange = vi.fn();
    render(
      <DataTable
        aria-label="People"
        columns={columns}
        data={people}
        selectable
        getRowId={getRowId}
        onSelectedRowsChange={onSelectedRowsChange}
      />,
    );
    const boxes = screen.getAllByRole("checkbox", { name: "Select row" });
    await user.click(boxes[1]!);
    expect(onSelectedRowsChange).toHaveBeenLastCalledWith([people[1]]);
    expect(bodyRows()[1]).toHaveAttribute("aria-selected", "true");

    await user.click(screen.getByRole("checkbox", { name: "Select all rows on this page" }));
    expect(onSelectedRowsChange).toHaveBeenLastCalledWith(people);
  });

  it("works as a controlled component", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [filter, setFilter] = useState("hopper");
      return (
        <>
          <button onClick={() => setFilter("")}>clear</button>
          <DataTable
            aria-label="People"
            columns={columns}
            data={people}
            searchable
            globalFilter={filter}
            onGlobalFilterChange={setFilter}
          />
        </>
      );
    }
    render(<Controlled />);
    expect(names()).toEqual(["Grace Hopper"]);
    await user.click(screen.getByText("clear"));
    expect(names()).toHaveLength(4);
  });

  it("expands rows to show details", async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        aria-label="People"
        columns={columns}
        data={people}
        getRowId={getRowId}
        renderExpandedRow={(row) => <p>Details for {row.original.name}</p>}
      />,
    );
    const [first] = screen.getAllByRole("button", { name: "Expand row" });
    await user.click(first!);
    expect(screen.getByText("Details for Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Collapse row" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("hides columns from the column menu", async () => {
    const user = userEvent.setup();
    render(<DataTable aria-label="People" columns={columns} data={people} />);
    await user.click(screen.getByRole("button", { name: "Columns" }));
    await user.click(screen.getByRole("checkbox", { name: "Role" }));
    expect(screen.queryByRole("columnheader", { name: /role/i })).not.toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("group", { name: "Visible columns" })).not.toBeInTheDocument();
  });

  it("applies per-column filters", async () => {
    const user = userEvent.setup();
    render(<DataTable aria-label="People" columns={columns} data={people} filterable />);
    await user.type(screen.getByRole("textbox", { name: "Filter Role" }), "admiral");
    expect(names()).toEqual(["Grace Hopper"]);
  });

  describe("keyboard navigation", () => {
    it("moves between cells with the arrow keys", async () => {
      const user = userEvent.setup();
      render(<DataTable aria-label="People" columns={columns} data={people} />);
      const firstHeader = screen.getAllByRole("columnheader")[0]!;
      firstHeader.focus();

      await user.keyboard("{ArrowDown}");
      expect(document.activeElement).toHaveTextContent("Ada Lovelace");
      await user.keyboard("{ArrowRight}");
      expect(document.activeElement).toHaveTextContent("Engineer");
      await user.keyboard("{End}");
      expect(document.activeElement).toHaveTextContent("36");
      await user.keyboard("{Home}");
      expect(document.activeElement).toHaveTextContent("Ada Lovelace");
      await user.keyboard("{Control>}{End}{/Control}");
      expect(document.activeElement).toHaveTextContent("87");
    });

    it("keeps a single tab stop and toggles sorting with Enter on a header", async () => {
      const user = userEvent.setup();
      render(<DataTable aria-label="People" columns={columns} data={people} />);
      const stops = screen
        .getAllByRole("gridcell")
        .concat(screen.getAllByRole("columnheader"))
        .filter((cell) => cell.getAttribute("tabindex") === "0");
      expect(stops).toHaveLength(1);

      screen.getByRole("columnheader", { name: /name/i }).focus();
      await user.keyboard("{Enter}");
      expect(screen.getByRole("columnheader", { name: /name/i })).toHaveAttribute(
        "aria-sort",
        "ascending",
      );
    });

    it("toggles row selection with Space and activates rows with Enter", async () => {
      const user = userEvent.setup();
      const onRowClick = vi.fn();
      render(
        <DataTable
          aria-label="People"
          columns={columns}
          data={people}
          selectable
          onRowClick={onRowClick}
          getRowId={getRowId}
        />,
      );
      // Column 1 is the first data column (column 0 holds the checkboxes).
      screen.getAllByRole("columnheader")[1]!.focus();
      await user.keyboard("{ArrowDown}");
      await user.keyboard(" ");
      expect(bodyRows()[0]).toHaveAttribute("aria-selected", "true");
      await user.keyboard("{Enter}");
      expect(onRowClick).toHaveBeenCalledWith(people[0]);
    });
  });

  describe("server-side mode", () => {
    it("reports state changes without sorting locally and resets to the first page", async () => {
      const user = userEvent.setup();
      const onSortingChange = vi.fn();
      const onPaginationChange = vi.fn();
      render(
        <DataTable
          aria-label="People"
          columns={columns}
          data={people}
          serverSide
          rowCount={40}
          pagination={{ pageSize: 4 }}
          paginationState={{ pageIndex: 3, pageSize: 4 }}
          onPaginationChange={onPaginationChange}
          onSortingChange={onSortingChange}
        />,
      );
      expect(screen.getByText("Page 4 of 10")).toBeInTheDocument();

      await user.click(
        within(screen.getByRole("columnheader", { name: /age/i })).getByRole("button"),
      );
      expect(onSortingChange).toHaveBeenCalledWith([{ id: "age", desc: false }]);
      expect(names()[0]).toBe("Ada Lovelace");
      expect(onPaginationChange).toHaveBeenCalledWith({ pageIndex: 0, pageSize: 4 });
    });

    it("debounces server-side search", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const onGlobalFilterChange = vi.fn();
      render(
        <DataTable
          aria-label="People"
          columns={columns}
          data={people}
          serverSide
          searchable
          onGlobalFilterChange={onGlobalFilterChange}
        />,
      );
      fireEvent.change(screen.getByRole("searchbox"), { target: { value: "ada" } });
      expect(onGlobalFilterChange).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(350);
      expect(onGlobalFilterChange).toHaveBeenCalledWith("ada");
      vi.useRealTimers();
    });
  });

  describe("virtualization", () => {
    const clientHeight = Object.getOwnPropertyDescriptor(Element.prototype, "clientHeight");
    const clientWidth = Object.getOwnPropertyDescriptor(Element.prototype, "clientWidth");
    beforeAll(() => {
      // jsdom has no layout, so give every element a fixed 800x240 box for the virtualizer to measure.
      Object.defineProperty(Element.prototype, "clientHeight", { configurable: true, value: 240 });
      Object.defineProperty(Element.prototype, "clientWidth", { configurable: true, value: 800 });
    });
    afterAll(() => {
      if (clientHeight) Object.defineProperty(Element.prototype, "clientHeight", clientHeight);
      if (clientWidth) Object.defineProperty(Element.prototype, "clientWidth", clientWidth);
    });

    it("renders only a window of a large dataset but reports the full row count", () => {
      const big: Person[] = Array.from({ length: 5000 }, (_, i) => ({
        id: String(i),
        name: `Person ${i}`,
        role: "Tester",
        age: 20 + (i % 50),
      }));
      render(
        <DataTable
          aria-label="Big"
          columns={columns}
          data={big}
          virtualized={{ rowHeight: 40, overscan: 2 }}
          maxHeight={240}
        />,
      );
      const rendered = screen
        .getAllByRole("gridcell")
        .filter((cell) => cell.getAttribute("data-col") === "0");
      expect(rendered.length).toBeGreaterThan(0);
      expect(rendered.length).toBeLessThan(40);
      expect(screen.getByRole("grid")).toHaveAttribute("aria-rowcount", "5001");
    });
  });

  it("exports the visible rows as CSV through onExport", async () => {
    const onExport = vi.fn();
    render(
      <DataTable
        aria-label="People"
        columns={columns}
        data={people}
        exportable={{ filename: "people" }}
        onExport={onExport}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Export CSV" }));
    const payload = onExport.mock.calls[0]![0];
    expect(payload.filename).toBe("people");
    expect(payload.csv.split("\r\n")[0]).toBe("Name,Role,Age");
    expect(payload.rows).toHaveLength(4);
  });

  it("has no obvious accessibility violations", async () => {
    const { container } = render(
      <DataTable
        aria-label="People"
        columns={columns}
        data={people}
        searchable
        selectable
        pagination
        getRowId={getRowId}
      />,
    );
    await waitFor(async () => expect(await axe(container)).toHaveNoViolations());
  });
});

describe("csv helpers", () => {
  it("quotes values and neutralizes spreadsheet formulas", () => {
    expect(escapeCsvCell('say "hi", ok')).toBe('"say ""hi"", ok"');
    expect(escapeCsvCell("=SUM(A1:A9)")).toBe("'=SUM(A1:A9)");
    expect(escapeCsvCell("@cmd")).toBe("'@cmd");
    expect(escapeCsvCell(-5)).toBe("-5");
    expect(escapeCsvCell(null)).toBe("");
    expect(escapeCsvCell(new Date("2024-01-02T00:00:00Z"))).toBe("2024-01-02T00:00:00.000Z");
  });

  it("exports through toCsv with custom export values", () => {
    const captured: string[] = [];
    function Probe() {
      return (
        <DataTable
          aria-label="Probe"
          columns={[
            { accessorKey: "name", header: "Name" },
            {
              accessorKey: "age",
              header: "Age",
              meta: { exportHeader: "Years", exportValue: (p: Person) => `${p.age} years` },
            },
          ]}
          data={people.slice(0, 1)}
          exportable
          onExport={({ csv }) => captured.push(csv)}
        />
      );
    }
    render(<Probe />);
    fireEvent.click(screen.getByRole("button", { name: "Export CSV" }));
    expect(captured[0]).toBe("Name,Years\r\nAda Lovelace,36 years");
    expect(typeof toCsv).toBe("function");
  });
});
