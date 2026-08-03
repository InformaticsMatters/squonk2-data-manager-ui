import { defineConfig } from "@playwright/test";

import { acceptanceEnvironment, acceptanceUrls } from "./tests/acceptance/environment";

export default defineConfig({
  expect: { timeout: 15_000 },
  fullyParallel: true,
  outputDir: "test-results/acceptance",
  projects: [{ name: "acceptance", use: { browserName: "chromium", timezoneId: "UTC" } }],
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  retries: process.env.CI ? 1 : 0,
  testDir: "tests",
  testMatch: ["**/acceptance/*.acceptance.ts", "**/dark-mode.browser.ts"],
  timeout: 60_000,
  use: {
    baseURL: acceptanceUrls.app,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  webServer: [
    {
      command: "pnpm exec tsx tests/acceptance/services/server.ts",
      env: acceptanceEnvironment,
      reuseExistingServer: false,
      stderr: "pipe",
      stdout: "pipe",
      timeout: 30_000,
      url: `${acceptanceUrls.control}/health`,
    },
    {
      command: `pnpm start -p ${acceptanceEnvironment.TEST_PORT}`,
      env: acceptanceEnvironment,
      reuseExistingServer: false,
      stderr: "pipe",
      stdout: "pipe",
      timeout: 200_000,
      url: acceptanceUrls.app,
    },
  ],
  workers: process.env.CI ? 2 : undefined,
});
