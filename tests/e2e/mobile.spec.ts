import { expect, test } from "@playwright/test";
import { example, openDoc } from "./helpers";

test.describe("mobile layout", () => {
  test("the navigation collapses into a menu and the page does not scroll sideways", async ({
    page,
  }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Documentation" });
    await expect(nav).toBeHidden();
    await page.getByRole("button", { name: "Menu" }).click();
    await expect(nav).toBeVisible();
    await nav.getByRole("link", { name: "Kanban board" }).click();
    await expect(nav).toBeHidden();
    await expect(page.getByRole("heading", { level: 1, name: "Kanban board" })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("no component page overflows the viewport", async ({ page }) => {
    for (const slug of [
      "data-table",
      "form",
      "date-range-picker",
      "file-uploader",
      "activity-timeline",
    ]) {
      await openDoc(page, slug);
      await page.waitForTimeout(400);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${slug} overflows horizontally`).toBeLessThanOrEqual(1);
    }
  });

  test("the date picker opens as a single month that fits the screen", async ({ page }) => {
    await openDoc(page, "date-range-picker");
    await example(page, /Range with presets/)
      .getByRole("button", { name: /Reporting period/ })
      .click();
    const dialog = page.getByRole("dialog", { name: "Choose dates" });
    await expect(dialog.getByRole("grid")).toHaveCount(1);
    const box = (await dialog.boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
  });

  test("the command palette is usable by touch", async ({ page }) => {
    await openDoc(page, "command-palette");
    await example(page, /Groups, nesting/)
      .getByRole("button", { name: /Open palette/ })
      .tap();
    const dialog = page.getByRole("dialog", { name: "Command palette" });
    await expect(dialog).toBeVisible();
    const box = (await dialog.boundingBox())!;
    expect(box.width).toBeGreaterThan(300);
    await dialog.getByRole("option", { name: /Go to dashboard/ }).tap();
    await expect(dialog).toBeHidden();
  });

  test("the kanban board scrolls horizontally inside its own container", async ({ page }) => {
    await openDoc(page, "kanban-board");
    const board = example(page, /Persistence, rollback/).getByRole("group", {
      name: "Sprint board",
    });
    const scrolls = await board.evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(scrolls).toBe(true);
  });
});
