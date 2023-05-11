import { defineConfig } from "@playwright/test";
import path from "node:path";

require("dotenv").config({ path: path.resolve(process.cwd(), ".env.test.local") });

const baseURL = new URL(process.env.BASE_URL as string);
baseURL.pathname = process.env.BASE_PATH ?? "/";

export default defineConfig({
  projects: [
    { name: "setup", testMatch: "**/*.setup.ts" },
    {
      name: "browser",
      dependencies: ["setup"],
      use: {
        storageState: "storageState.json",
        baseURL: baseURL.href,
        screenshot: "on",
        trace: "on-first-retry",
      },
      retries: 3,
      timeout: 60000,
      testMatch: "**/*.browser.ts",
    },
    { name: "node", testMatch: "**/*.node.ts" },
  ],
  use: {
    baseURL: baseURL.href,
    screenshot: "on",
    trace: "on-first-retry", // record traces on first retry of each test
  },
  webServer: {
    command: `next start`,
    url: baseURL.href,
    timeout: 200 * 1000,
    env: {
      NODE_ENV: "test",
    },
  },
  testDir: "tests",
});
