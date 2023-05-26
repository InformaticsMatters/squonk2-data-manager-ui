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
      use: {
        baseURL: baseURL.href,
        trace: "on",
      },
      retries: 3,
      timeout: 60000,
      testMatch: "**/*.browser.ts",
    },
    {
      name: "browser-authenticated",
      dependencies: ["setup"],
      use: {
        storageState: "storageState.json",
        baseURL: baseURL.href,
        trace: "on",
      },
      retries: 3,
      timeout: 60000,
      testMatch: "**/*.browser-authenticated.ts",
    },
    { name: "node", testMatch: "**/*.node.ts" },
  ],
  use: {
    baseURL: baseURL.href,
    trace: "on", // record traces on first retry of each test
  },
  webServer: {
    // needs to use the package manager here to avoid an error when not running playwright from the
    // terminal
    command: `pnpm start`,
    url: baseURL.href,
    timeout: 200 * 1000,
    env: {
      NODE_ENV: "test",
    },
  },
  testDir: "tests",
});
