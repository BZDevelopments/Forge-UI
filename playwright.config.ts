import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;
const EXAMPLE_PORT = 4174;

// Some sandboxes cannot download Playwright's browsers. Point this at any Chromium build to run anyway.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
const launchOptions = executablePath
  ? {
      executablePath,
      args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-zygote"],
    }
  : {};

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 2,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  timeout: 30_000,
  expect: { timeout: 7_000 },
  use: {
    baseURL: `http://localhost:${PORT}/`,
    trace: "on-first-retry",
    launchOptions,
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 }, launchOptions },
      testIgnore: /(mobile|example)\.spec\.ts/,
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], launchOptions },
      testMatch: /mobile\.spec\.ts/,
    },
    {
      name: "example",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 900 },
        baseURL: `http://localhost:${EXAMPLE_PORT}/`,
        launchOptions,
      },
      testMatch: /example\.spec\.ts/,
    },
  ],
  webServer: [
    {
      command: `pnpm --filter @forge-ui/docs build && pnpm --filter @forge-ui/docs preview --port ${PORT} --strictPort`,
      url: `http://localhost:${PORT}/`,
      reuseExistingServer: !process.env.CI,
      timeout: 240_000,
    },
    {
      // Builds the packages first, so the example runs against their published entry points.
      command: `pnpm turbo run build --filter=@forge-ui/example-admin-dashboard && pnpm --filter @forge-ui/example-admin-dashboard preview --port ${EXAMPLE_PORT} --strictPort`,
      url: `http://localhost:${EXAMPLE_PORT}/`,
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
    },
  ],
});
