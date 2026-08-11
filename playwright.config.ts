import { defineConfig, devices } from "@playwright/test";

const viewports = [
  ["chromium-320", "chromium", 320, 568],
  ["chromium-390", "chromium", 390, 844],
  ["chromium-412", "chromium", 412, 915],
  ["chromium-tablet", "chromium", 768, 1024],
  ["chromium-desktop", "chromium", 1440, 900],
  ["webkit-mobile", "webkit", 390, 844],
] as const;
const port = Number(process.env.PLAYWRIGHT_PORT ?? 3000);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "tests/e2e",
  snapshotPathTemplate: "{testDir}/{testFilePath}-snapshots/{arg}-{projectName}-{platform}.png",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL, trace: "retain-on-failure" },
  projects: viewports.map(([name, browserName, width, height]) => ({
    name,
    use: {
      ...devices[browserName === "webkit" ? "Desktop Safari" : "Desktop Chrome"],
      browserName,
      viewport: { width, height },
    },
  })),
  webServer: [
    {
      command: "node tests/e2e/api-server.mjs",
      url: "http://127.0.0.1:4000/v1/proposals",
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: `pnpm --filter @kuvend/web exec next start -p ${port}`,
      url: baseURL,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
  expect: { toHaveScreenshot: { animations: "disabled", maxDiffPixelRatio: 0.07 } },
});
