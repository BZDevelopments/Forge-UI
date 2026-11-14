import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// The example app resolves Forge UI through the built packages, like any consumer would.
test.describe("example: admin dashboard", () => {
  test("navigates with the command palette and shows validation errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto("/");
    await expect(page.getByRole("grid", { name: "Customers" })).toBeVisible();

    await page.keyboard.press("Control+k");
    await page.keyboard.type("tasks");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("group", { name: "Support tasks" })).toBeVisible();

    await page
      .getByRole("navigation", { name: "Main" })
      .getByRole("button", { name: "Invite teammate" })
      .click();
    await page.getByRole("button", { name: "Send invitation" }).click();
    await expect(page.getByText("Enter an email address")).toBeVisible();
    await page.getByRole("textbox", { name: /Email/ }).fill("ada@example.com");
    await page.getByRole("button", { name: "Send invitation" }).click();
    await expect(page.getByRole("region", { name: /Notifications/ })).toContainText(
      "Invitation sent to ada@example.com",
    );
    expect(errors).toEqual([]);
  });

  test("every view passes axe", async ({ page }) => {
    await page.goto("/");
    for (const view of ["Customers", "Tasks", "Activity", "Invite teammate"]) {
      await page
        .getByRole("navigation", { name: "Main" })
        .getByRole("button", { name: view })
        .click();
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(results.violations.map((v) => `${view}: ${v.id}`)).toEqual([]);
    }
  });

  test("does not crash when the system reports a POSIX locale tag", async ({ page }) => {
    // Some Linux systems report tags like "en-US@posix", which Intl rejects.
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "language", { get: () => "en-US@posix" });
      Object.defineProperty(navigator, "languages", { get: () => ["en-US@posix"] });
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    await page
      .getByRole("navigation", { name: "Main" })
      .getByRole("button", { name: "Activity" })
      .click();
    await expect(page.getByRole("region", { name: "Account activity" })).toBeVisible();
    await expect(page.getByText(/ago/).first()).toBeVisible();
    expect(errors).toEqual([]);
  });
});
