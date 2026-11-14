import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { example, openDoc } from "./helpers";

const axeOpen = async (page: Page, include: string) => {
  const results = await new AxeBuilder({ page })
    .include(include)
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .disableRules(["region"])
    .analyze();
  expect(
    results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes[0]?.target.join(" ")})`),
  ).toEqual([]);
};

test.describe("data table", () => {
  test("sorts, searches, selects, and pages", async ({ page }) => {
    await openDoc(page, "data-table");
    const demo = example(page, /Search, filter, select, page/);
    const grid = demo.getByRole("grid", { name: "Customers" });

    const nameHeader = grid.getByRole("columnheader", { name: /^Name/ });
    await nameHeader.getByRole("button").click();
    await expect(nameHeader).toHaveAttribute("aria-sort", "ascending");

    await demo.getByRole("searchbox", { name: "Search table" }).fill("grace");
    const rows = grid.locator("tbody tr[role=row]");
    await expect(rows.first()).toContainText("Grace");
    expect(await rows.count()).toBeLessThan(15);

    await demo.getByRole("searchbox").fill("");
    await grid.getByRole("checkbox", { name: "Select row" }).first().check();
    await expect(grid.locator("tbody tr[aria-selected=true]")).toHaveCount(1);
    await expect(demo.getByText("1 selected")).toBeVisible();

    await demo.getByRole("button", { name: "Next page" }).click();
    await expect(demo.getByText(/Page 2 of/)).toBeVisible();
  });

  test("works with the keyboard like a grid", async ({ page }) => {
    await openDoc(page, "data-table");
    const grid = example(page, /Search, filter, select, page/).getByRole("grid", {
      name: "Customers",
    });
    await grid.getByRole("columnheader").first().focus();
    await page.keyboard.press("ArrowDown");
    await expect(grid.locator("tbody [data-grid-cell]:focus")).toHaveCount(1);
    const firstFocused = await page.evaluate(() =>
      document.activeElement?.getAttribute("data-row"),
    );
    expect(firstFocused).toBe("1");
    await page.keyboard.press("ArrowRight");
    expect(await page.evaluate(() => document.activeElement?.getAttribute("data-col"))).toBe("1");
    await page.keyboard.press("Control+End");
    expect(
      await page.evaluate(() => Number(document.activeElement?.getAttribute("data-row"))),
    ).toBeGreaterThan(5);
    // Only one cell is in the tab order.
    expect(await grid.locator('[data-grid-cell][tabindex="0"]').count()).toBe(1);
  });

  test("virtualizes 50,000 rows and still reaches the end", async ({ page }) => {
    await openDoc(page, "data-table");
    const demo = example(page, /50,000 rows/);
    const grid = demo.getByRole("grid", { name: "Fifty thousand customers" });
    await expect(grid).toHaveAttribute("aria-rowcount", "50001");
    expect(await grid.locator("tbody tr[role=row]").count()).toBeLessThan(60);

    await demo.locator(".forge-dt-scroll").evaluate((el) => (el.scrollTop = el.scrollHeight));
    await expect(grid.getByRole("gridcell", { name: "cus_50000" })).toBeVisible();
    expect(await grid.locator("tbody tr[role=row]").count()).toBeLessThan(60);
  });

  test("server-side mode shows loading, and recovers from an error with retry", async ({
    page,
  }) => {
    await openDoc(page, "data-table");
    const demo = example(page, "Server-side data");
    const grid = demo.getByRole("grid", { name: "Customers from the server" });
    await expect(grid).toHaveAttribute("aria-busy", "true");
    await expect(grid.locator("tbody tr[role=row]").first()).toBeVisible();
    await expect(grid).not.toHaveAttribute("aria-busy", "true");

    await demo.getByLabel("Simulate a failing API").check();
    await demo.getByRole("button", { name: "Next page" }).click();
    await expect(demo.getByRole("alert")).toContainText("did not respond");
    // Retrying while the API is still down fails again, with the button still available.
    await demo.getByRole("button", { name: "Try again" }).click();
    await expect(demo.getByRole("alert")).toContainText("did not respond");
    // Once the API recovers, the table loads again.
    await demo.getByLabel("Simulate a failing API").uncheck();
    await expect(grid.locator("tbody tr[role=row]").first()).toBeVisible();
    await expect(demo.getByRole("alert")).toHaveCount(0);
  });

  test("exports CSV through a real download", async ({ page }) => {
    await openDoc(page, "data-table");
    const demo = example(page, /Search, filter, select, page/);
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      demo.getByRole("button", { name: "Export CSV" }).click(),
    ]);
    expect(download.suggestedFilename()).toBe("customers.csv");
    const path = await download.path();
    const text = (await import("node:fs")).readFileSync(path, "utf8");
    expect(text.split("\r\n")[0]).toBe("\uFEFFName,Email,Plan,MRR,Joined");
  });
});

test.describe("command palette", () => {
  test("opens, searches, goes into a nested level, and runs a command", async ({ page }) => {
    await openDoc(page, "command-palette");
    const demo = example(page, /Groups, nesting/);
    await demo.getByRole("button", { name: /Open palette/ }).click();
    const dialog = page.getByRole("dialog", { name: "Command palette" });
    await expect(dialog.getByRole("combobox")).toBeFocused();

    await page.keyboard.type("theme");
    await page.keyboard.press("Enter");
    await expect(dialog.getByLabel("Command path")).toContainText("Change theme");
    await page.keyboard.press("Backspace");
    await expect(dialog.getByLabel("Command path")).toHaveCount(0);

    await dialog.getByRole("combobox").fill("deploy");
    await page.keyboard.press("Enter");
    await expect(dialog.getByRole("status", { name: "Running" })).toBeVisible();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("region", { name: /Notifications/ })).toContainText("Deployed");
  });

  test("a failing command keeps the palette open with the error; Escape closes", async ({
    page,
  }) => {
    await openDoc(page, "command-palette");
    await example(page, /Groups, nesting/)
      .getByRole("button", { name: /Open palette/ })
      .click();
    const dialog = page.getByRole("dialog", { name: "Command palette" });
    await dialog.getByRole("combobox").fill("failing");
    await page.keyboard.press("Enter");
    await expect(dialog.getByRole("alert")).toContainText("remote refused the connection");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("returns focus to the opener and has no axe violations while open", async ({ page }) => {
    await openDoc(page, "command-palette");
    const opener = example(page, /Groups, nesting/).getByRole("button", { name: /Open palette/ });
    await opener.click();
    await axeOpen(page, '[role="dialog"]');
    await page.keyboard.press("Escape");
    await expect(opener).toBeFocused();
  });
});

test.describe("file uploader", () => {
  test("accepts valid files with progress, rejects invalid ones with a reason, and retries failures", async ({
    page,
  }) => {
    await openDoc(page, "file-uploader");
    const demo = example(page, /Validation, progress, retry/);
    const input = demo.locator("input[type=file]");
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      "base64",
    );

    await input.setInputFiles([
      { name: "photo.png", mimeType: "image/png", buffer: png },
      { name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("hello") },
    ]);
    const list = demo.getByRole("list", { name: "Selected files" });
    await expect(list.getByText(/notes\.txt is not an accepted file type/)).toBeVisible();
    await expect(
      list.getByRole("progressbar", { name: "Upload progress for photo.png" }),
    ).toBeVisible();
    await expect(list.getByText("Uploaded")).toBeVisible({ timeout: 8000 });
    // A real thumbnail was created from the image.
    await expect(list.locator("img")).toHaveCount(1);

    await input.setInputFiles({
      name: "please-fail.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4"),
    });
    await expect(list.getByText("please-fail.pdf could not be uploaded.")).toBeVisible({
      timeout: 9000,
    });
    await expect(list.getByRole("button", { name: "Retry please-fail.pdf" })).toBeVisible();
  });

  test("supports drag and drop of a real file", async ({ page }) => {
    await openDoc(page, "file-uploader");
    const demo = example(page, /Validation, progress, retry/);
    const dataTransfer = await page.evaluateHandle(() => {
      const dt = new DataTransfer();
      dt.items.add(new File(["x"], "dropped.pdf", { type: "application/pdf" }));
      return dt;
    });
    const zone = demo.getByRole("group", { name: "File drop area" });
    await zone.dispatchEvent("dragenter", { dataTransfer });
    await expect(zone).toHaveAttribute("data-dragging", "true");
    await zone.dispatchEvent("drop", { dataTransfer });
    await expect(
      demo.getByRole("list", { name: "Selected files" }).getByText("dropped.pdf"),
    ).toBeVisible();
  });

  test("cancel stops an upload", async ({ page }) => {
    await openDoc(page, "file-uploader");
    const demo = example(page, /Validation, progress, retry/);
    await demo
      .locator("input[type=file]")
      .setInputFiles({ name: "slow.pdf", mimeType: "application/pdf", buffer: Buffer.from("x") });
    await demo.getByRole("button", { name: "Cancel upload of slow.pdf" }).click();
    await expect(demo.getByText("Cancelled")).toBeVisible();
  });
});

test.describe("form", () => {
  test("validates, runs async checks, focuses the first error, and submits", async ({ page }) => {
    await openDoc(page, "form");
    const demo = example(page, /Validation, async checks/);
    await demo.getByRole("button", { name: "Create account" }).click();
    await expect(demo.getByText("Enter your email")).toBeVisible();
    await expect(demo.getByRole("textbox", { name: /Email/ })).toBeFocused();

    await demo.getByRole("textbox", { name: /Email/ }).fill("ada@example.com");
    await demo.getByRole("textbox", { name: /Username/ }).fill("ada");
    await demo.getByRole("textbox", { name: /Username/ }).blur();
    await expect(demo.getByText("That username is taken")).toBeVisible();

    await demo.getByRole("textbox", { name: /Username/ }).fill("grace");
    await expect(demo.getByText("That username is taken")).toBeHidden();
    await demo.getByLabel(/Password/).fill("correct horse battery");

    await expect(demo.getByRole("textbox", { name: "Company name" })).toHaveCount(0);
    await demo.getByRole("checkbox", { name: "This is a business account" }).check();
    await expect(demo.getByRole("textbox", { name: "Company name" })).toBeVisible();
    await demo.getByRole("checkbox", { name: "This is a business account" }).uncheck();

    await demo.getByRole("checkbox", { name: /accept the terms/ }).check();
    await demo.getByRole("button", { name: "Create account" }).click();
    await expect(demo.getByRole("button", { name: "Create account" })).toBeDisabled();
    await expect(page.getByRole("region", { name: /Notifications/ })).toContainText(
      "Welcome, grace",
    );
  });

  test("the wizard blocks on invalid steps, keeps values, and submits", async ({ page }) => {
    await openDoc(page, "form");
    const demo = example(page, "Multi-step form");
    await demo.getByRole("button", { name: "Continue" }).click();
    await expect(demo.getByText("Enter your name")).toBeVisible();
    await demo.getByRole("textbox", { name: /Full name/ }).fill("Ada Lovelace");
    await demo.getByRole("textbox", { name: /Work email/ }).fill("ada@example.com");
    await demo.getByRole("textbox", { name: /Work email/ }).press("Enter");
    await expect(demo.getByRole("heading", { name: "Plan" })).toBeFocused();
    await demo.getByRole("combobox", { name: /Plan/ }).selectOption("Team");
    await demo.getByRole("button", { name: "Back" }).click();
    await expect(demo.getByRole("textbox", { name: /Full name/ })).toHaveValue("Ada Lovelace");
    await demo.getByRole("button", { name: "Continue" }).click();
    await demo.getByRole("button", { name: "Continue" }).click();
    await demo.getByRole("button", { name: "Create workspace" }).click();
    await expect(page.getByRole("region", { name: /Notifications/ })).toContainText(
      "Workspace created for Ada Lovelace on the Team plan",
    );
  });

  test("field arrays add and remove rows", async ({ page }) => {
    await openDoc(page, "form");
    const demo = example(page, "Field arrays");
    await demo.getByRole("button", { name: "Add teammate" }).click();
    await expect(demo.getByRole("listitem")).toHaveCount(2);
    await demo.getByRole("button", { name: "Remove teammate 1" }).click();
    await expect(demo.getByRole("listitem")).toHaveCount(1);
  });
});

test.describe("combobox and multi-select", () => {
  test("combobox filters with fuzzy matching and selects with the keyboard", async ({ page }) => {
    await openDoc(page, "combobox");
    const demo = example(page, /Groups, descriptions/);
    const input = demo.getByRole("combobox");
    await input.click();
    await input.fill("gmny");
    await expect(demo.page().getByRole("option")).toHaveCount(1);
    await page.keyboard.press("Enter");
    await expect(input).toHaveValue("Germany");
    await expect(demo.getByText("Selected value: de")).toBeVisible();
    await demo.getByRole("button", { name: "Clear selection" }).click();
    await expect(demo.getByText("Selected value: none")).toBeVisible();
    await axeOpen(page, "main");
  });

  test("async combobox loads, shows its loading state, and selects", async ({ page }) => {
    await openDoc(page, "combobox");
    const demo = example(page, "Async search");
    const input = demo.getByRole("combobox");
    await expect(input).toHaveValue("Ada Lovelace");
    await input.click();
    await expect(page.getByText("Loading…")).toBeVisible();
    await page.getByRole("option", { name: /Grace Hopper/ }).click();
    await expect(input).toHaveValue("Grace Hopper");
  });

  test("windows 20,000 options and keeps keyboard selection working", async ({ page }) => {
    await openDoc(page, "combobox");
    const demo = example(page, /20,000 options/);
    await demo.getByRole("combobox").click();
    expect(await page.getByRole("option").count()).toBeLessThan(40);
    await page.keyboard.press("End");
    await expect(page.getByRole("option", { name: /Inventory item 20000/ })).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(demo.getByRole("combobox")).toHaveValue("Inventory item 20000");
  });

  test("multi-select picks several, removes with Backspace, and enforces its limit", async ({
    page,
  }) => {
    await openDoc(page, "multi-select");
    const basic = example(page, /Tags, groups, clear all/);
    const input = basic.getByRole("combobox");
    await input.click();
    await page.getByRole("option", { name: "Go" }).click();
    await page.getByRole("option", { name: "Rust" }).click();
    await expect(
      basic.getByRole("list", { name: "Selected options" }).getByRole("listitem"),
    ).toHaveCount(4);
    await page.keyboard.press("Escape");
    await input.press("Backspace");
    await expect(
      basic.getByRole("list", { name: "Selected options" }).getByRole("listitem"),
    ).toHaveCount(3);

    const limited = example(page, /Selection limit/);
    await limited.getByRole("combobox").click();
    await page.getByRole("option", { name: "Design" }).click();
    await expect(limited.getByText("+1 more")).toHaveCount(0);
    await expect(page.locator('[data-forge-announcer="assertive"]')).toContainText("up to 3");
  });
});

test.describe("date-range picker", () => {
  test("chooses a range with the mouse and keyboard, and clears it", async ({ page }) => {
    await openDoc(page, "date-range-picker");
    const demo = example(page, /Range with presets/);
    const trigger = demo.getByRole("button", { name: /Reporting period/ });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Choose dates" });
    await expect(dialog).toBeVisible();

    const days = dialog.locator("button[data-day]:not([data-disabled])");
    await days.first().click();
    await days.first().hover();
    await expect(dialog).toBeVisible(); // still choosing the end date
    await page.keyboard.press("Enter");
    await expect(dialog).toBeHidden();
    await expect(trigger).not.toContainText("Select dates");

    await demo.getByRole("button", { name: "Clear dates" }).click();
    await expect(trigger).toContainText("Select dates");

    await trigger.click();
    await page.getByRole("button", { name: "Last 7 days" }).click();
    await expect(trigger).not.toContainText("Select dates");
    await expect(demo.getByText(/ to /)).toBeVisible();
  });

  test("refuses ranges that break the rules and says why", async ({ page }) => {
    await openDoc(page, "date-range-picker");
    const demo = example(page, "Constraints");
    await demo.getByRole("button", { name: /Check-in and check-out/ }).click();
    const dialog = page.getByRole("dialog", { name: "Choose dates" });
    const days = dialog.locator("button[data-day]:not([data-disabled])");
    await days.first().click();
    await days.first().click(); // same day: below the 2-night minimum
    await expect(dialog.getByRole("alert")).toContainText("Stay at least 2 nights.");
  });

  test("localizes month names, week start, and the formatted value", async ({ page }) => {
    await openDoc(page, "date-range-picker");
    const demo = example(page, /Single date and localization/);
    await demo.getByRole("combobox", { name: "Language" }).selectOption("de-DE");
    await demo.getByRole("button", { name: /Due date/ }).click();
    const dialog = page.getByRole("dialog", { name: "Choose dates" });
    await expect(dialog.getByRole("columnheader").first()).toHaveAttribute("abbr", "Montag");
    await axeOpen(page, '[role="dialog"]');
  });
});

test.describe("notifications", () => {
  test("promise toasts move from loading to a result", async ({ page }) => {
    await openDoc(page, "notifications");
    const demo = example(page, /Variants, actions, and promises/);
    await demo.getByRole("button", { name: /Promise/ }).click();
    const region = page.getByRole("region", { name: /Notifications/ });
    await expect(region.getByRole("listitem")).toContainText("Saving...");
    await expect(region.getByRole("listitem")).toContainText(/Saved record 42|Unable to save/, {
      timeout: 5000,
    });
  });

  test("undo restores a deleted item, and the hotkey reaches the toast", async ({ page }) => {
    await openDoc(page, "notifications");
    const demo = example(page, /Undo, progress, and queues/);
    await demo.getByRole("button", { name: "Delete" }).first().click();
    await expect(demo.getByText("Invoice #1042")).toHaveCount(0);
    await page.keyboard.press("Alt+t");
    await expect(page.getByRole("button", { name: "Undo" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(demo.getByText("Invoice #1042")).toBeVisible();
  });

  test("queues extra toasts and shows only three", async ({ page }) => {
    await openDoc(page, "notifications");
    const demo = example(page, /Undo, progress, and queues/);
    await demo.getByRole("button", { name: "Queue six" }).click();
    const region = page.getByRole("region", { name: /Notifications/ });
    await expect(region.getByRole("listitem")).toHaveCount(3);
    await expect(region.getByText("+3 more waiting")).toBeVisible();
    await axeOpen(page, '[aria-label^="Notifications"]');
  });
});

test.describe("activity timeline", () => {
  test("shows a loading skeleton, then events, then loads more", async ({ page }) => {
    await openDoc(page, "activity-timeline");
    const demo = example(page, /Loading, relative time/);
    await expect(demo.getByText("Loading activity")).toBeAttached();
    await expect(demo.getByRole("listitem").first()).toBeVisible();
    await expect(demo.getByText(/hours? ago|days? ago/).first()).toBeVisible();
    const before = await demo.getByRole("listitem").count();
    await demo.getByRole("button", { name: "Load more" }).click();
    await expect.poll(() => demo.getByRole("listitem").count()).toBeGreaterThan(before);
  });
});

test.describe("kanban board", () => {
  const demoOf = (page: Page) => example(page, /Persistence, rollback/);
  const column = (page: Page, name: string) => demoOf(page).getByRole("region", { name });

  test("moves a card with the keyboard and keeps focus on it", async ({ page }) => {
    await openDoc(page, "kanban-board");
    const card = demoOf(page).getByRole("listitem", { name: "Fix flaky upload test" });
    await card.focus();
    await page.keyboard.press("Alt+ArrowRight");
    await expect(
      column(page, "In progress").getByRole("listitem", { name: "Fix flaky upload test" }),
    ).toBeFocused();
    await expect(page.locator('[data-forge-announcer="polite"]')).toContainText("moved");
  });

  test("drags a card between columns with a real pointer", async ({ page }) => {
    await openDoc(page, "kanban-board");
    const handle = demoOf(page).getByRole("button", { name: "Move Write the migration guide" });
    const target = column(page, "Done");
    // Mouse coordinates are viewport-relative, so bring the board into view before measuring.
    await demoOf(page).scrollIntoViewIfNeeded();
    const from = (await handle.boundingBox())!;
    const to = (await target.boundingBox())!;
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(from.x + 20, from.y + 20, { steps: 4 });
    await page.mouse.move(to.x + to.width / 2, to.y + 70, { steps: 14 });
    await page.mouse.up();
    await expect(
      column(page, "Done").getByRole("listitem", { name: "Write the migration guide" }),
    ).toBeVisible();
    await expect(
      column(page, "To do").getByRole("listitem", { name: "Write the migration guide" }),
    ).toHaveCount(0);
  });

  test("rolls a move back when saving fails", async ({ page }) => {
    await openDoc(page, "kanban-board");
    const demo = demoOf(page);
    await demo.getByLabel(/Make saving fail/).check();
    const card = demo.getByRole("listitem", { name: "Audit color contrast" });
    await card.focus();
    await page.keyboard.press("Alt+ArrowRight");
    await expect(page.getByRole("region", { name: /Notifications/ })).toContainText(
      "Could not save the move",
    );
    await expect(
      column(page, "To do").getByRole("listitem", { name: "Audit color contrast" }),
    ).toBeVisible();
  });

  test("the Move to… menu works and refuses a full column", async ({ page }) => {
    await openDoc(page, "kanban-board");
    const demo = demoOf(page);
    await demo.getByRole("button", { name: "Actions for Write the migration guide" }).click();
    await page.getByRole("menuitem", { name: "Move to In progress" }).click();
    await expect(
      column(page, "In progress").getByRole("listitem", { name: "Write the migration guide" }),
    ).toBeVisible();
    // "In progress" has a limit of 2, so a third card is refused.
    await demo.getByRole("button", { name: "Actions for Fix flaky upload test" }).click();
    await page.getByRole("menuitem", { name: "Move to In progress" }).click();
    await expect(
      column(page, "In progress").getByRole("listitem", { name: "Fix flaky upload test" }),
    ).toHaveCount(0);
    await expect(page.locator('[data-forge-announcer="assertive"]')).toContainText("is full");
    await axeOpen(page, "main");
  });
});
