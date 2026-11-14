import { useState } from "react";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";
import { MultiSelect, type ComboboxOption } from "../src";

const people: ComboboxOption[] = [
  { value: "ada", label: "Ada Lovelace", group: "Pioneers" },
  { value: "grace", label: "Grace Hopper", group: "Pioneers" },
  { value: "linus", label: "Linus Torvalds", group: "Builders" },
  { value: "margaret", label: "Margaret Hamilton", group: "Builders" },
  { value: "retired", label: "Retired Person", disabled: true },
];

const input = () => screen.getByRole("combobox");
const tags = () =>
  within(screen.queryByRole("list", { name: "Selected options" }) ?? document.body).queryAllByRole(
    "listitem",
  );
const polite = () => document.querySelector('[data-forge-announcer="polite"]');

describe("MultiSelect", () => {
  it("selects several options and keeps the list open between choices", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<MultiSelect aria-label="People" options={people} onValueChange={onValueChange} />);
    await user.click(input());
    await user.click(screen.getByRole("option", { name: "Ada Lovelace" }));
    await user.click(screen.getByRole("option", { name: "Linus Torvalds" }));

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByRole("listbox")).toHaveAttribute("aria-multiselectable", "true");
    expect(tags().map((tag) => tag.textContent)).toEqual(["Ada Lovelace×", "Linus Torvalds×"]);
    expect(onValueChange).toHaveBeenLastCalledWith(
      ["ada", "linus"],
      [expect.objectContaining({ value: "ada" }), expect.objectContaining({ value: "linus" })],
    );
    expect(screen.getByRole("option", { name: "Ada Lovelace" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("toggles an option off when chosen again", async () => {
    const user = userEvent.setup();
    render(<MultiSelect aria-label="People" options={people} defaultValue={["ada"]} />);
    await user.click(input());
    await user.click(screen.getByRole("option", { name: "Ada Lovelace" }));
    expect(tags()).toHaveLength(0);
  });

  it("works with the keyboard end to end", async () => {
    const user = userEvent.setup();
    render(<MultiSelect aria-label="People" options={people} />);
    input().focus();
    await user.keyboard("{ArrowDown}{Enter}{ArrowDown}{Enter}");
    expect(tags().map((t) => t.textContent)).toEqual(["Ada Lovelace×", "Grace Hopper×"]);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("filters while typing and clears the query after choosing", async () => {
    const user = userEvent.setup();
    render(<MultiSelect aria-label="People" options={people} />);
    await user.type(input(), "hopp");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    await user.keyboard("{Enter}");
    expect(input()).toHaveValue("");
    expect(tags()).toHaveLength(1);
    expect(screen.getAllByRole("option").length).toBeGreaterThan(1);
  });

  it("removes tags with their buttons and with Backspace on an empty input", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <MultiSelect
        aria-label="People"
        options={people}
        defaultValue={["ada", "grace", "linus"]}
        onValueChange={onValueChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Remove Grace Hopper" }));
    expect(onValueChange).toHaveBeenLastCalledWith(["ada", "linus"], expect.any(Array));
    expect(input()).toHaveFocus();

    await user.keyboard("{Backspace}");
    expect(tags().map((t) => t.textContent)).toEqual(["Ada Lovelace×"]);

    await user.type(input(), "x");
    await user.keyboard("{Backspace}{Backspace}");
    // The second Backspace hit an empty input and removed the last tag.
    expect(tags()).toHaveLength(0);
  });

  it("enforces maxSelected and announces the limit", async () => {
    const user = userEvent.setup();
    render(
      <MultiSelect
        aria-label="People"
        options={people}
        maxSelected={2}
        defaultValue={["ada", "grace"]}
      />,
    );
    await user.click(input());
    await user.click(screen.getByRole("option", { name: "Linus Torvalds" }));
    expect(tags()).toHaveLength(2);
    await waitFor(() =>
      expect(document.querySelector('[data-forge-announcer="assertive"]')).toHaveTextContent(
        "You can select up to 2 options.",
      ),
    );
  });

  it("announces selection changes politely", async () => {
    const user = userEvent.setup();
    render(<MultiSelect aria-label="People" options={people} />);
    await user.click(input());
    await user.click(screen.getByRole("option", { name: "Ada Lovelace" }));
    await waitFor(() => expect(polite()).toHaveTextContent("Ada Lovelace selected. 1 selected."));
  });

  it("can close after each choice", async () => {
    const user = userEvent.setup();
    render(<MultiSelect aria-label="People" options={people} closeOnSelect />);
    await user.click(input());
    await user.click(screen.getByRole("option", { name: "Ada Lovelace" }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("clears everything when clearable", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <MultiSelect
        aria-label="People"
        options={people}
        defaultValue={["ada", "grace"]}
        clearable
        onValueChange={onValueChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Clear all selections" }));
    expect(onValueChange).toHaveBeenCalledWith([], []);
    expect(tags()).toHaveLength(0);
  });

  it("collapses extra tags while closed", async () => {
    const user = userEvent.setup();
    render(
      <MultiSelect
        aria-label="People"
        options={people}
        defaultValue={["ada", "grace", "linus", "margaret"]}
        maxVisibleTags={2}
      />,
    );
    expect(tags().map((t) => t.textContent)).toEqual(["Ada Lovelace×", "Grace Hopper×", "+2 more"]);
    await user.click(input());
    expect(tags()).toHaveLength(4);
  });

  it("works as a controlled component", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState<string[]>(["ada"]);
      return (
        <>
          <button onClick={() => setValue(["grace"])}>reset</button>
          <MultiSelect
            aria-label="People"
            options={people}
            value={value}
            onValueChange={setValue}
          />
        </>
      );
    }
    render(<Controlled />);
    expect(tags().map((t) => t.textContent)).toEqual(["Ada Lovelace×"]);
    await user.click(screen.getByText("reset"));
    expect(tags().map((t) => t.textContent)).toEqual(["Grace Hopper×"]);
  });

  it("keeps labels of selected values that are not in the current async results", async () => {
    const user = userEvent.setup();
    const loadOptions = vi.fn(async (query: string) =>
      people.filter((p) => p.label.toLowerCase().includes(query.toLowerCase())),
    );
    render(<MultiSelect aria-label="People" loadOptions={loadOptions} loadDebounceMs={0} />);
    await user.click(input());
    await user.click(await screen.findByRole("option", { name: "Ada Lovelace" }));
    await user.type(input(), "linus");
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(1));
    await user.click(screen.getByRole("option", { name: "Linus Torvalds" }));
    // Ada is no longer in the result list but keeps her tag label.
    expect(tags().map((t) => t.textContent)).toEqual(["Ada Lovelace×", "Linus Torvalds×"]);
  });

  it("shows async loading and empty states", async () => {
    const user = userEvent.setup();
    let resolve!: (options: ComboboxOption[]) => void;
    render(
      <MultiSelect
        aria-label="People"
        loadOptions={() => new Promise<ComboboxOption[]>((r) => (resolve = r))}
        loadDebounceMs={0}
        emptyMessage="Nobody found."
      />,
    );
    await user.click(input());
    expect(await screen.findByText("Loading…")).toBeInTheDocument();
    await act(async () => resolve([]));
    expect(await screen.findByText("Nobody found.")).toBeInTheDocument();
  });

  it("posts one hidden input per value", () => {
    const { container } = render(
      <MultiSelect
        aria-label="People"
        options={people}
        name="people"
        defaultValue={["ada", "grace"]}
      />,
    );
    const values = [
      ...container.querySelectorAll<HTMLInputElement>("input[type=hidden][name=people]"),
    ].map((i) => i.value);
    expect(values).toEqual(["ada", "grace"]);
  });

  it("disables tag removal and interaction when disabled", () => {
    render(<MultiSelect aria-label="People" options={people} defaultValue={["ada"]} disabled />);
    expect(input()).toBeDisabled();
    expect(screen.queryByRole("button", { name: /Remove/ })).not.toBeInTheDocument();
  });

  it("has no obvious accessibility violations", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <MultiSelect aria-label="People" options={people} defaultValue={["ada"]} clearable />,
    );
    expect(await axe(container)).toHaveNoViolations();
    await user.click(input());
    expect(
      await axe(document.body, { rules: { region: { enabled: false } } }),
    ).toHaveNoViolations();
  });
});
