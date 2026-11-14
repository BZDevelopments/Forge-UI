import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";
import {
  DateRangePicker,
  addMonths,
  lastNDays,
  parseISODate,
  toISODate,
  type DateRangeValue,
} from "../src";

const today = new Date(2025, 2, 15); // 15 March 2025
const common = { locale: "en-US", today, months: 1 as const, "aria-label": "Dates" };

// The accessible name is the label followed by the current value, so match on the label prefix.
const trigger = () => screen.getByRole("button", { name: /^Dates/ });
const day = (label: RegExp | string) => screen.getByRole("button", { name: label });
const dialog = () => screen.getByRole("dialog", { name: "Choose dates" });
const d = (m: number, dd: number, y = 2025) => new Date(y, m - 1, dd);

async function open(user: ReturnType<typeof userEvent.setup>) {
  await user.click(trigger());
  return dialog();
}

describe("DateRangePicker: single mode", () => {
  it("selects a date, closes, and formats it in the trigger", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<DateRangePicker {...common} mode="single" onValueChange={onValueChange} />);
    expect(trigger()).toHaveTextContent("Select a date");
    await open(user);
    await user.click(day(/March 20, 2025/));
    expect(onValueChange).toHaveBeenCalledWith(d(3, 20));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger()).toHaveTextContent("Mar 20, 2025");
    expect(trigger()).toHaveFocus();
  });

  it("focuses the selected day when opened and marks today", async () => {
    const user = userEvent.setup();
    render(<DateRangePicker {...common} mode="single" defaultValue={d(3, 9)} />);
    await open(user);
    expect(day(/March 9, 2025/)).toHaveFocus();
    expect(day(/March 15, 2025/)).toHaveAttribute("aria-current", "date");
    expect(day(/March 9, 2025/).closest("td")).toHaveAttribute("aria-selected", "true");
  });

  it("starts on today when empty", async () => {
    const user = userEvent.setup();
    render(<DateRangePicker {...common} mode="single" />);
    await open(user);
    expect(day(/March 15, 2025/)).toHaveFocus();
  });

  it("clears the value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <DateRangePicker
        {...common}
        mode="single"
        defaultValue={d(3, 9)}
        clearable
        onValueChange={onValueChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Clear dates" }));
    expect(onValueChange).toHaveBeenCalledWith(null);
    expect(trigger()).toHaveTextContent("Select a date");
  });

  it("works controlled", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState<Date | null>(d(3, 1));
      return (
        <>
          <button onClick={() => setValue(d(4, 2))}>set</button>
          <DateRangePicker {...common} mode="single" value={value} onValueChange={setValue} />
        </>
      );
    }
    render(<Controlled />);
    expect(trigger()).toHaveTextContent("Mar 1, 2025");
    await user.click(screen.getByText("set"));
    expect(trigger()).toHaveTextContent("Apr 2, 2025");
  });

  it("posts an ISO date through a hidden input", () => {
    const { container } = render(
      <DateRangePicker {...common} mode="single" name="due" defaultValue={d(3, 9)} />,
    );
    expect(container.querySelector<HTMLInputElement>("input[name=due]")!.value).toBe("2025-03-09");
  });
});

describe("DateRangePicker: range mode", () => {
  it("selects a range in two clicks and commits only when complete", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<DateRangePicker {...common} onValueChange={onValueChange} />);
    await open(user);
    await user.click(day(/March 10, 2025/));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(dialog()).toBeInTheDocument();

    await user.click(day(/March 14, 2025/));
    expect(onValueChange).toHaveBeenCalledWith({ from: d(3, 10), to: d(3, 14) });
    expect(trigger()).toHaveTextContent("Mar 10, 2025 – Mar 14, 2025");
  });

  it("swaps the ends when the second click is earlier", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<DateRangePicker {...common} onValueChange={onValueChange} />);
    await open(user);
    await user.click(day(/March 20, 2025/));
    await user.click(day(/March 18, 2025/));
    expect(onValueChange).toHaveBeenCalledWith({ from: d(3, 18), to: d(3, 20) });
  });

  it("previews the range while hovering and marks range cells", async () => {
    const user = userEvent.setup();
    render(<DateRangePicker {...common} />);
    await open(user);
    await user.click(day(/March 10, 2025/));
    await user.hover(day(/March 13, 2025/));
    expect(day(/March 11, 2025/)).toHaveAttribute("data-in-range");
    expect(day(/March 12, 2025/)).toHaveAttribute("data-in-range");
    expect(day(/March 13, 2025/)).toHaveAttribute("data-range-end");
  });

  it("discards an unfinished selection when closed", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <DateRangePicker
        {...common}
        defaultValue={{ from: d(3, 1), to: d(3, 3) }}
        onValueChange={onValueChange}
      />,
    );
    await open(user);
    await user.click(day(/March 10, 2025/));
    await user.keyboard("{Escape}");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(trigger()).toHaveTextContent("Mar 1, 2025 – Mar 3, 2025");
    await open(user);
    expect(day(/March 3, 2025/).closest("td")).toHaveAttribute("aria-selected", "true");
  });

  it("starts a new range after a complete one", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <DateRangePicker
        {...common}
        defaultValue={{ from: d(3, 1), to: d(3, 3) }}
        onValueChange={onValueChange}
      />,
    );
    await open(user);
    await user.click(day(/March 20, 2025/));
    expect(onValueChange).not.toHaveBeenCalled();
    await user.click(day(/March 22, 2025/));
    expect(onValueChange).toHaveBeenCalledWith({ from: d(3, 20), to: d(3, 22) });
  });

  it("applies presets", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const range = lastNDays(7, today);
    render(
      <DateRangePicker
        {...common}
        presets={[{ label: "Last 7 days", value: range }]}
        onValueChange={onValueChange}
      />,
    );
    await open(user);
    await user.click(screen.getByRole("button", { name: "Last 7 days" }));
    expect(onValueChange).toHaveBeenCalledWith({ from: d(3, 9), to: d(3, 15) });
  });

  it("enforces minimum and maximum range length with an announced message", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <DateRangePicker
        {...common}
        minRangeDays={3}
        maxRangeDays={5}
        onValueChange={onValueChange}
      />,
    );
    await open(user);
    await user.click(day(/March 10, 2025/));
    await user.click(day(/March 11, 2025/));
    expect(within(dialog()).getByRole("alert")).toHaveTextContent("Choose at least 3 days.");
    await user.click(day(/March 20, 2025/));
    expect(within(dialog()).getByRole("alert")).toHaveTextContent("Choose at most 5 days.");
    expect(onValueChange).not.toHaveBeenCalled();
    await user.click(day(/March 12, 2025/));
    expect(onValueChange).toHaveBeenCalledWith({ from: d(3, 10), to: d(3, 12) });
  });

  it("refuses ranges that cross a disabled date", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <DateRangePicker {...common} disabledDates={[d(3, 12)]} onValueChange={onValueChange} />,
    );
    await open(user);
    await user.click(day(/March 10, 2025/));
    await user.click(day(/March 14, 2025/));
    expect(within(dialog()).getByRole("alert")).toHaveTextContent("not available");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("shows two months by default on wide screens", async () => {
    const user = userEvent.setup();
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: true,
      media: query,
      addEventListener() {},
      removeEventListener() {},
    })) as never;
    render(<DateRangePicker locale="en-US" today={today} aria-label="Dates" />);
    await open(user);
    expect(within(dialog()).getAllByRole("grid")).toHaveLength(2);
    expect(within(dialog()).getByRole("grid", { name: "April 2025" })).toBeInTheDocument();
    window.matchMedia = original;
  });

  it("posts both ends as ISO dates", () => {
    const { container } = render(
      <DateRangePicker {...common} name="stay" defaultValue={{ from: d(3, 1), to: d(3, 4) }} />,
    );
    expect(
      container.ownerDocument.querySelector<HTMLInputElement>("input[name=stay_from]")!.value,
    ).toBe("2025-03-01");
    expect(
      container.ownerDocument.querySelector<HTMLInputElement>("input[name=stay_to]")!.value,
    ).toBe("2025-03-04");
  });

  it("works controlled and ignores changes the parent rejects", async () => {
    const user = userEvent.setup();
    render(
      <DateRangePicker
        {...common}
        value={{ from: d(3, 1), to: d(3, 2) }}
        onValueChange={() => {}}
      />,
    );
    await open(user);
    await user.click(day(/March 10, 2025/));
    await user.click(day(/March 12, 2025/));
    expect(trigger()).toHaveTextContent("Mar 1, 2025 – Mar 2, 2025");
  });
});

describe("constraints", () => {
  it("disables dates before min and after max and blocks selecting them", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <DateRangePicker
        {...common}
        mode="single"
        minDate={d(3, 10)}
        maxDate={d(3, 20)}
        onValueChange={onValueChange}
      />,
    );
    await open(user);
    expect(day(/March 9, 2025/)).toHaveAttribute("aria-disabled", "true");
    expect(day(/March 21, 2025/)).toHaveAttribute("aria-disabled", "true");
    await user.click(day(/March 9, 2025/));
    expect(onValueChange).not.toHaveBeenCalled();
    await user.click(day(/March 10, 2025/));
    expect(onValueChange).toHaveBeenCalledWith(d(3, 10));
  });

  it("supports a predicate for disabled dates, such as weekends", async () => {
    const user = userEvent.setup();
    render(
      <DateRangePicker
        {...common}
        mode="single"
        disabledDates={(date) => date.getDay() === 0 || date.getDay() === 6}
      />,
    );
    await open(user);
    expect(day(/Saturday, March 15, 2025/)).toHaveAttribute("aria-disabled", "true");
    expect(day(/Monday, March 17, 2025/)).not.toHaveAttribute("aria-disabled");
  });

  it("stops month navigation at the limits", async () => {
    const user = userEvent.setup();
    render(<DateRangePicker {...common} mode="single" minDate={d(3, 1)} maxDate={d(3, 31)} />);
    await open(user);
    expect(screen.getByRole("button", { name: "Previous month" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();
  });
});

describe("keyboard navigation", () => {
  it("moves by day, week, and week edge with the arrow, Home, and End keys", async () => {
    const user = userEvent.setup();
    render(<DateRangePicker {...common} mode="single" weekStartsOn={0} />);
    await open(user);
    await user.keyboard("{ArrowRight}");
    expect(day(/March 16, 2025/)).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(day(/March 23, 2025/)).toHaveFocus();
    await user.keyboard("{ArrowLeft}{ArrowUp}");
    expect(day(/March 15, 2025/)).toHaveFocus();
    await user.keyboard("{Home}");
    expect(day(/March 9, 2025/)).toHaveFocus();
    await user.keyboard("{End}");
    expect(day(/March 15, 2025/)).toHaveFocus();
  });

  it("changes month with PageUp and PageDown, and year with Shift", async () => {
    const user = userEvent.setup();
    render(<DateRangePicker {...common} mode="single" />);
    await open(user);
    await user.keyboard("{PageDown}");
    expect(day(/April 15, 2025/)).toHaveFocus();
    expect(screen.getByRole("combobox", { name: "Month" })).toHaveValue("3");
    await user.keyboard("{PageUp}{PageUp}");
    expect(day(/February 15, 2025/)).toHaveFocus();
    await user.keyboard("{Shift>}{PageDown}{/Shift}");
    expect(day(/February 15, 2026/)).toHaveFocus();
  });

  it("crosses month boundaries with the arrow keys and clamps to min and max", async () => {
    const user = userEvent.setup();
    render(<DateRangePicker {...common} mode="single" defaultValue={d(3, 31)} maxDate={d(4, 2)} />);
    await open(user);
    await user.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}");
    expect(day(/April 2, 2025/)).toHaveFocus();
  });

  it("selects with Enter and Space, and closes with Escape", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<DateRangePicker {...common} mode="single" onValueChange={onValueChange} />);
    await open(user);
    await user.keyboard("{ArrowRight}{Enter}");
    expect(onValueChange).toHaveBeenCalledWith(d(3, 16));

    await open(user);
    await user.keyboard("{ArrowRight} ");
    expect(onValueChange).toHaveBeenLastCalledWith(d(3, 17));

    await open(user);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger()).toHaveFocus();
  });

  it("keeps exactly one day in the tab order", async () => {
    const user = userEvent.setup();
    render(<DateRangePicker {...common} mode="single" />);
    await open(user);
    const tabbable = within(dialog())
      .getAllByRole("button")
      .filter(
        (button) => button.hasAttribute("data-day") && button.getAttribute("tabindex") === "0",
      );
    expect(tabbable).toHaveLength(1);
  });

  it("supports keyboard range selection", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<DateRangePicker {...common} onValueChange={onValueChange} />);
    await open(user);
    await user.keyboard("{Enter}{ArrowRight}{ArrowRight}{Enter}");
    expect(onValueChange).toHaveBeenCalledWith({ from: d(3, 15), to: d(3, 17) });
  });
});

describe("month and year navigation", () => {
  it("uses the buttons and selects", async () => {
    const user = userEvent.setup();
    render(<DateRangePicker {...common} mode="single" />);
    await open(user);
    await user.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByRole("grid", { name: "April 2025" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Previous month" }));
    await user.click(screen.getByRole("button", { name: "Previous month" }));
    expect(screen.getByRole("grid", { name: "February 2025" })).toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox", { name: "Month" }), "11");
    await user.selectOptions(screen.getByRole("combobox", { name: "Year" }), "2027");
    expect(screen.getByRole("grid", { name: "December 2027" })).toBeInTheDocument();
  });
});

describe("localization and formatting", () => {
  it("renders month and weekday names, week start, and the trigger in another locale", async () => {
    const user = userEvent.setup();
    render(<DateRangePicker {...common} locale="de-DE" mode="single" defaultValue={d(3, 9)} />);
    expect(trigger()).toHaveTextContent("09.03.2025");
    await open(user);
    expect(screen.getByRole("grid", { name: "März 2025" })).toBeInTheDocument();
    expect(within(dialog()).getAllByRole("columnheader")[0]).toHaveAttribute("abbr", "Montag");
    expect(day(/Sonntag, 9\. März 2025/)).toBeInTheDocument();
  });

  it("accepts custom formatting and labels", async () => {
    const user = userEvent.setup();
    render(
      <DateRangePicker
        {...common}
        defaultValue={{ from: d(3, 1), to: d(3, 4) }}
        formatDate={(date) => toISODate(date)}
        labels={{ separator: "to", dialog: "Pick range", nextMonth: "Weiter" }}
      />,
    );
    expect(trigger()).toHaveTextContent("2025-03-01 to 2025-03-04");
    await user.click(trigger());
    expect(screen.getByRole("dialog", { name: "Pick range" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Weiter" })).toBeInTheDocument();
  });

  it("supports Intl format options", () => {
    render(
      <DateRangePicker
        {...common}
        mode="single"
        defaultValue={d(3, 9)}
        dateFormat={{ dateStyle: "full" }}
      />,
    );
    expect(trigger()).toHaveTextContent("Sunday, March 9, 2025");
  });
});

it("is disabled as a whole", async () => {
  const user = userEvent.setup();
  render(<DateRangePicker {...common} disabled />);
  expect(trigger()).toBeDisabled();
  await user.click(trigger());
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("has no obvious accessibility violations, closed and open", async () => {
  const user = userEvent.setup();
  const { container } = render(
    <DateRangePicker {...common} defaultValue={{ from: d(3, 1), to: d(3, 4) }} clearable />,
  );
  expect(await axe(container)).toHaveNoViolations();
  await user.click(trigger());
  expect(await axe(document.body, { rules: { region: { enabled: false } } })).toHaveNoViolations();
});

describe("date helpers", () => {
  it("clamps month arithmetic and parses ISO dates strictly", () => {
    expect(addMonths(d(1, 31), 1)).toEqual(d(2, 28));
    expect(addMonths(d(3, 31, 2024), -1)).toEqual(d(2, 29, 2024));
    expect(parseISODate("2025-02-30")).toBeNull();
    expect(parseISODate("2025-2-3")).toBeNull();
    expect(parseISODate("2025-03-09")).toEqual(d(3, 9));
    expect(toISODate(d(3, 9))).toBe("2025-03-09");
  });

  it("builds a last-N-days range", () => {
    const range: DateRangeValue = lastNDays(30, d(3, 15));
    expect(range).toEqual({ from: d(2, 14), to: d(3, 15) });
  });
});

it("includes the visible value in the trigger's accessible name (label in name)", () => {
  render(<DateRangePicker {...common} defaultValue={{ from: d(3, 1), to: d(3, 4) }} />);
  expect(trigger()).toHaveAccessibleName("Dates Mar 1, 2025 – Mar 4, 2025");
});

it("falls back to a valid locale instead of crashing on an invalid one", async () => {
  const user = userEvent.setup();
  render(
    <DateRangePicker
      mode="single"
      locale="en-US@posix"
      today={today}
      months={1}
      aria-label="Dates"
    />,
  );
  await user.click(trigger());
  expect(screen.getByRole("grid", { name: "March 2025" })).toBeInTheDocument();
});
