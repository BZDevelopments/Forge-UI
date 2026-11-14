import { expect, type Page } from "@playwright/test";

export async function openDoc(page: Page, slug: string) {
  await page.goto(`/#/components/${slug}`);
  await expect(page.locator("h1[data-page-title]")).toBeVisible();
}

/** The live example whose heading matches `title`. */
export function example(page: Page, title: string | RegExp) {
  return page.locator("section[id]", { has: page.getByRole("heading", { level: 3, name: title }) });
}
