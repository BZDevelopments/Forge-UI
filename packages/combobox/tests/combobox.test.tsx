import { useState } from "react";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Combobox, filterOptions, type ComboboxOption } from "../src";

const fruits: ComboboxOption[] = [
  { value: "apple", label: "Apple", group: "Common" },
  { value: "banana", label: "Banana", group: "Common" },
  { value: "cherry", label: "Cherry", group: "Berries", description: "Small and red" },
  { value: "durian", label: "Durian", group: "Berries", disabled: true },
  { value: "elderberry", label: "Elderberry", group: "Berries", keywords: ["sambucus"] },
];

const input = () => screen.getByRole("combobox");
const options = () => screen.queryAllByRole("option");

describe("Combobox", () => {
  it("is closed by default and opens on click with every option", async () => {
    const user = userEvent.setup();
    render(<Combobox aria-label="Fruit" options={fruits} />);
    expect(input()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    await user.click(input());
    expect(input()).toHaveAttribute("aria-expanded", "true");
    expect(input()).toHaveAttribute("aria-controls", screen.getByRole("listbox").id);
    expect(options()).toHaveLength(5);
    expect(input()).toHaveFocus();
  });

  it("renders group headings as labelled groups", async () => {
    const user = userEvent.setup();
    render(<Combobox aria-label="Fruit" options={fruits} />);
    await user.click(input());
    expect(screen.getByRole("group", { name: "Common" })).toBeInTheDocument();
    expect(
      within(screen.getByRole("group", { name: "Berries" })).getAllByRole("option"),
    ).toHaveLength(3);
  });

  it("filters while typing, including keywords, and ranks by match quality", async () => {
    const user = userEvent.setup();
    render(<Combobox aria-label="Fruit" options={fruits} />);
    await user.type(input(), "sambucus");
    expect(options().map((o) => o.textContent)).toEqual(["Elderberry"]);

    await user.clear(input());
    await user.type(input(), "an");
    expect(options()[0]).toHaveTextContent("Banana");
  });

  it("shows an empty message when nothing matches", async () => {
    const user = userEvent.setup();
    render(<Combobox aria-label="Fruit" options={fruits} emptyMessage="No fruit like that." />);
    await user.type(input(), "zzz");
    expect(screen.getByText("No fruit like that.")).toBeInTheDocument();
    expect(input()).not.toHaveAttribute("aria-activedescendant");
  });

  it("navigates with the keyboard, skips disabled options, and selects with Enter", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Combobox aria-label="Fruit" options={fruits} onValueChange={onValueChange} />);
    input().focus();
    await user.keyboard("{ArrowDown}");
    expect(options()[0]).toHaveAttribute("aria-selected", "false");
    expect(input()).toHaveAttribute("aria-activedescendant", options()[0]!.id);

    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
    // apple -> banana -> cherry -> (durian is disabled) elderberry
    expect(input()).toHaveAttribute("aria-activedescendant", options()[4]!.id);
    await user.keyboard("{ArrowDown}");
    expect(input()).toHaveAttribute("aria-activedescendant", options()[0]!.id);

    await user.keyboard("{ArrowUp}{Enter}");
    expect(onValueChange).toHaveBeenCalledWith(
      "elderberry",
      expect.objectContaining({ label: "Elderberry" }),
    );
    expect(input()).toHaveValue("Elderberry");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("supports Home, End, and Escape", async () => {
    const user = userEvent.setup();
    render(<Combobox aria-label="Fruit" options={fruits} />);
    input().focus();
    await user.keyboard("{ArrowDown}{End}");
    expect(input()).toHaveAttribute("aria-activedescendant", options()[4]!.id);
    await user.keyboard("{Home}");
    expect(input()).toHaveAttribute("aria-activedescendant", options()[0]!.id);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("does not select disabled options", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Combobox aria-label="Fruit" options={fruits} onValueChange={onValueChange} />);
    await user.click(input());
    const durian = screen.getByRole("option", { name: "Durian" });
    expect(durian).toHaveAttribute("aria-disabled", "true");
    await user.click(durian);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("selects with the pointer and marks the selected option", async () => {
    const user = userEvent.setup();
    render(<Combobox aria-label="Fruit" options={fruits} />);
    await user.click(input());
    await user.click(screen.getByRole("option", { name: "Banana" }));
    expect(input()).toHaveValue("Banana");
    await user.click(input());
    expect(screen.getByRole("option", { name: "Banana" })).toHaveAttribute("aria-selected", "true");
    // Reopening shows everything and starts on the selected option.
    expect(options()).toHaveLength(5);
    expect(input()).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "Banana" }).id,
    );
  });

  it("restores the selected label when the user leaves without choosing", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Combobox aria-label="Fruit" options={fruits} defaultValue="apple" />
        <button>elsewhere</button>
      </>,
    );
    expect(input()).toHaveValue("Apple");
    await user.click(input());
    await user.keyboard("{Control>}a{/Control}xyz");
    expect(input()).toHaveValue("xyz");
    await user.click(screen.getByText("elsewhere"));
    expect(input()).toHaveValue("Apple");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("clears the value when clearable", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Combobox
        aria-label="Fruit"
        options={fruits}
        defaultValue="apple"
        clearable
        onValueChange={onValueChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Clear selection" }));
    expect(onValueChange).toHaveBeenCalledWith(null, null);
    expect(input()).toHaveValue("");
    expect(screen.queryByRole("button", { name: "Clear selection" })).not.toBeInTheDocument();
  });

  it("works as a controlled component", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState<string | null>("cherry");
      return (
        <>
          <button onClick={() => setValue("apple")}>set apple</button>
          <Combobox aria-label="Fruit" options={fruits} value={value} onValueChange={setValue} />
          <output>{value}</output>
        </>
      );
    }
    render(<Controlled />);
    expect(input()).toHaveValue("Cherry");
    await user.click(screen.getByText("set apple"));
    expect(input()).toHaveValue("Apple");
    await user.click(input());
    await user.click(screen.getByRole("option", { name: "Banana" }));
    expect(screen.getByRole("status")).toHaveTextContent("banana");
  });

  it("keeps a controlled value unchanged when the parent ignores the change", async () => {
    const user = userEvent.setup();
    render(<Combobox aria-label="Fruit" options={fruits} value="apple" onValueChange={() => {}} />);
    await user.click(input());
    await user.click(screen.getByRole("option", { name: "Banana" }));
    expect(input()).toHaveValue("Apple");
  });

  it("posts the value through a hidden input", () => {
    const { container } = render(
      <Combobox aria-label="Fruit" options={fruits} name="fruit" defaultValue="banana" />,
    );
    expect(container.querySelector<HTMLInputElement>("input[type=hidden][name=fruit]")!.value).toBe(
      "banana",
    );
  });

  it("supports custom option rendering", async () => {
    const user = userEvent.setup();
    render(
      <Combobox
        aria-label="Fruit"
        options={fruits}
        renderOption={(option, { selected }) => (
          <span data-testid="custom">
            {option.label.toUpperCase()}
            {selected ? " ✓" : ""}
          </span>
        )}
      />,
    );
    await user.click(input());
    expect(screen.getAllByTestId("custom")[0]).toHaveTextContent("APPLE");
  });

  it("is disabled as a whole", async () => {
    const user = userEvent.setup();
    render(<Combobox aria-label="Fruit" options={fruits} disabled />);
    expect(input()).toBeDisabled();
    await user.click(input());
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  describe("async options", () => {
    it("loads options when opened, shows loading, and resolves selected labels from the cache", async () => {
      const user = userEvent.setup();
      let resolve!: (options: ComboboxOption[]) => void;
      const loadOptions = vi.fn(() => new Promise<ComboboxOption[]>((r) => (resolve = r)));
      render(<Combobox aria-label="User" loadOptions={loadOptions} loadDebounceMs={0} />);

      await user.click(input());
      await waitFor(() => expect(loadOptions).toHaveBeenCalledWith("", expect.any(AbortSignal)));
      expect(screen.getByRole("listbox")).toHaveAttribute("aria-busy", "true");
      expect(screen.getByText("Loading…")).toBeInTheDocument();

      await act(async () =>
        resolve([
          { value: "u1", label: "Ada" },
          { value: "u2", label: "Grace" },
        ]),
      );
      await user.click(await screen.findByRole("option", { name: "Ada" }));
      expect(input()).toHaveValue("Ada");
    });

    it("passes the typed query to the loader and ignores stale responses", async () => {
      const user = userEvent.setup();
      const pending = new Map<string, (options: ComboboxOption[]) => void>();
      const loadOptions = vi.fn(
        (query: string) => new Promise<ComboboxOption[]>((r) => pending.set(query, r)),
      );
      render(<Combobox aria-label="User" loadOptions={loadOptions} loadDebounceMs={0} />);
      await user.click(input());
      await waitFor(() => expect(pending.has("")).toBe(true));
      await act(async () => pending.get("")!([]));

      await user.type(input(), "a");
      await waitFor(() => expect(pending.has("a")).toBe(true));
      await user.type(input(), "d");
      await waitFor(() => expect(pending.has("ad")).toBe(true));

      await act(async () => pending.get("a")!([{ value: "old", label: "Old result" }]));
      await act(async () => pending.get("ad")!([{ value: "ada", label: "Ada" }]));
      expect(screen.queryByText("Old result")).not.toBeInTheDocument();
      expect(await screen.findByRole("option", { name: "Ada" })).toBeInTheDocument();
    });

    it("shows an error with retry when loading fails", async () => {
      const user = userEvent.setup();
      const loadOptions = vi
        .fn<(q: string) => Promise<ComboboxOption[]>>()
        .mockRejectedValueOnce(new Error("boom"))
        .mockResolvedValueOnce([{ value: "ok", label: "Recovered" }]);
      render(
        <Combobox
          aria-label="User"
          loadOptions={loadOptions}
          loadDebounceMs={0}
          errorMessage="Search is down."
        />,
      );
      await user.click(input());
      expect(await screen.findByRole("alert")).toHaveTextContent("Search is down.");
      await user.click(screen.getByRole("button", { name: "Retry" }));
      expect(await screen.findByRole("option", { name: "Recovered" })).toBeInTheDocument();
    });

    it("shows a saved value's label through selectedOptions before anything loads", () => {
      render(
        <Combobox
          aria-label="User"
          loadOptions={async () => []}
          value="u9"
          selectedOptions={[{ value: "u9", label: "Saved user" }]}
        />,
      );
      expect(input()).toHaveValue("Saved user");
    });

    it("shows the loading state from the loading prop", async () => {
      const user = userEvent.setup();
      render(<Combobox aria-label="Fruit" options={[]} loading />);
      await user.click(input());
      expect(screen.getByText("Loading…")).toBeInTheDocument();
    });
  });

  describe("large lists", () => {
    const clientHeight = Object.getOwnPropertyDescriptor(Element.prototype, "clientHeight");
    const clientWidth = Object.getOwnPropertyDescriptor(Element.prototype, "clientWidth");
    beforeAll(() => {
      Object.defineProperty(Element.prototype, "clientHeight", { configurable: true, value: 288 });
      Object.defineProperty(Element.prototype, "clientWidth", { configurable: true, value: 300 });
    });
    afterAll(() => {
      if (clientHeight) Object.defineProperty(Element.prototype, "clientHeight", clientHeight);
      if (clientWidth) Object.defineProperty(Element.prototype, "clientWidth", clientWidth);
    });

    it("windows thousands of options and keeps keyboard navigation working", async () => {
      const user = userEvent.setup();
      const many = Array.from({ length: 5000 }, (_, i) => ({
        value: `v${i}`,
        label: `Option ${i}`,
      }));
      render(<Combobox aria-label="Big" options={many} />);
      await user.click(input());

      expect(screen.getByRole("listbox")).toHaveAttribute("data-virtualized");
      expect(options().length).toBeGreaterThan(0);
      expect(options().length).toBeLessThan(40);
      expect(options()[0]).toHaveAttribute("aria-setsize", "5000");
      expect(options()[0]).toHaveAttribute("aria-posinset", "1");

      await user.keyboard("{ArrowDown}{Enter}");
      expect(input()).toHaveValue("Option 1");
    });
  });

  it("has no obvious accessibility violations, closed and open", async () => {
    const user = userEvent.setup();
    const { container } = render(<Combobox aria-label="Fruit" options={fruits} clearable />);
    expect(await axe(container)).toHaveNoViolations();
    await user.click(input());
    // The page-level landmark rule does not apply to a component rendered into a portal.
    expect(
      await axe(document.body, { rules: { region: { enabled: false } } }),
    ).toHaveNoViolations();
  });
});

describe("filterOptions", () => {
  it("keeps order for an empty query and supports a custom filter", () => {
    expect(filterOptions(fruits, "").map((r) => r.option.value)).toEqual(
      fruits.map((f) => f.value),
    );
    const custom = filterOptions(fruits, "x", (option) => option.group === "Common");
    expect(custom).toHaveLength(2);
  });
});
