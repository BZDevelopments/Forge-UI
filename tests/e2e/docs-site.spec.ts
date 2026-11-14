import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { componentSlugs } from "./slugs";

test.describe("documentation site", () => {
  test("home page explains the product and links to components", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Forge UI/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Production-ready, accessible components",
    );
    await expect(page.getByRole("link", { name: /Data table/ }).first()).toBeVisible();
    await expect(page.getByRole("contentinfo")).toContainText("BZDevelopments");
    await expect(
      page.getByRole("contentinfo").getByRole("link", { name: "BZDevelopments" }),
    ).toHaveAttribute("href", "https://github.com/bzdevelopments");
  });

  test("navigating moves focus to the page heading and updates the title", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("navigation", { name: "Documentation" })
      .getByRole("link", { name: "Combobox" })
      .click();
    await expect(page).toHaveTitle("Combobox · Forge UI");
    await expect(page.getByRole("heading", { level: 1, name: "Combobox" })).toBeFocused();
    await expect(
      page.getByRole("link", { name: "Combobox" }).and(page.locator('[aria-current="page"]')),
    ).toBeVisible();
  });

  test("the skip link jumps to the main content", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main")).toBeFocused();
  });

  test("dark mode toggles, persists across reloads, and is applied before first paint", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    const html = page.locator("html");
    await expect(html).not.toHaveClass(/dark/);
    await page.getByRole("button", { name: "Dark mode" }).click();
    await expect(html).toHaveClass(/dark/);
    await expect(page.getByRole("button", { name: "Dark mode" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.reload();
    await expect(html).toHaveClass(/dark/);
  });

  test("search opens with the keyboard shortcut and jumps to an example", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog", { name: "Search documentation" });
    await expect(dialog).toBeVisible();
    await page.keyboard.type("server side");
    await expect(dialog.getByRole("option").first()).toContainText("Data table: Server-side data");
    await page.keyboard.press("Enter");
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/components\/data-table\?section=server-side/);
    await expect(
      page.getByRole("heading", { level: 3, name: "Server-side data" }),
    ).toBeInViewport();
  });

  test("the code view shows the exact source and can be copied", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/#/components/notifications");
    const section = page.locator("#basic");
    await section.getByRole("button", { name: "View code" }).click();
    await expect(section.getByText("notify.promise").first()).toBeVisible();
    await section.getByRole("button", { name: "Copy code" }).click();
    await expect(section.getByRole("button", { name: "Copied" })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
      "export default function NotificationsBasic",
    );
  });

  test("unknown routes show a helpful page", async ({ page }) => {
    await page.goto("/#/nope");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page not found");
  });

  test("changelog and contributing render repository markdown without raw HTML", async ({
    page,
  }) => {
    await page.goto("/#/changelog");
    await expect(page.getByRole("heading", { level: 2, name: "0.1.0" })).toBeVisible();
    await page.goto("/#/contributing");
    await expect(page.getByRole("heading", { level: 2, name: "Set up" })).toBeVisible();
  });
});

test.describe("accessibility sweep (axe in a real browser)", () => {
  const routes = [
    "/",
    "/guides/getting-started",
    "/guides/theming",
    "/guides/accessibility",
    "/contributing",
    "/changelog",
    ...componentSlugs.map((s) => `/components/${s}`),
  ];

  for (const scheme of ["light", "dark"] as const) {
    for (const route of routes) {
      test(`${route} has no axe violations in ${scheme} mode`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme });
        await page.addInitScript(
          (value) => localStorage.setItem("forge-docs-theme", value),
          scheme,
        );
        await page.goto(`/#${route}`);
        await expect(page.locator("h1[data-page-title]")).toBeVisible();
        // Let async example data settle so skeletons do not skew results.
        await page.waitForTimeout(1300);
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .analyze();
        expect(
          results.violations.map(
            (v) =>
              `${v.id}: ${v.help} (${v.nodes.length} nodes, e.g. ${v.nodes[0]?.target.join(" ")})`,
          ),
        ).toEqual([]);
      });
    }
  }
});
