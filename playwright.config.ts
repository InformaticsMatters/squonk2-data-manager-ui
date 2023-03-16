import { defineConfig } from "@playwright/test";
import path from "node:path";

const { BASE_URL, BASE_PATH = "" } = process.env;

require("dotenv").config({ path: path.resolve(process.cwd(), ".env.test.local") });

export default defineConfig({
  projects: [
    { name: "setup", testMatch: "**/*.setup.ts" },
    {
      name: "browser",
      dependencies: ["setup"],
      use: { storageState: "storageState.json" },
      retries: 3,
      timeout: 60000,
      testMatch: "**/*.browser.ts",
    },
    { name: "node", testMatch: "**/*.node.ts" },
  ],
  use: {
    baseURL: BASE_URL + BASE_PATH,
    screenshot: "on",
    trace: "on-first-retry", // record traces on first retry of each test
  },
  webServer: {
    command: `pnpm start`,
    port: 3000,
    timeout: 200 * 1000,
    env: {
      NODE_ENV: "test",
    },
  },
  testDir: "tests",
});
