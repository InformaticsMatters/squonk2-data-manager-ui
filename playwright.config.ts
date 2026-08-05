import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
import path from "node:path";

// Local runs keep their secrets in this (gitignored) file; CI passes the same values as job-level
// environment variables and has no file to load. `process.loadEnvFile` throws on a missing path,
// unlike the `dotenv` call it replaced, so the existence check is what keeps CI working.
const envFile = path.resolve(__dirname, ".env.test.local");
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

const baseURL = new URL(process.env.BASE_URL as string);
baseURL.pathname = process.env.BASE_PATH ?? "/";
const PORT = process.env.TEST_PORT ?? "3000";
baseURL.port = PORT;

export default defineConfig({
  projects: [
    { name: "setup", testMatch: "**/*.setup.ts" },
    {
      name: "browser",
      use: { baseURL: baseURL.href, trace: "on" },
      retries: 0,
      timeout: 60_000,
      testMatch: "**/*.browser.ts",
    },
    {
      name: "browser-authenticated",
      dependencies: ["setup"],
      use: { storageState: "storageState.json", baseURL: baseURL.href, trace: "on" },
      retries: 3,
      timeout: 60_000,
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
    command: `pnpm start -p ${PORT}`,
    url: baseURL.href,
    timeout: 200 * 1000,
    reuseExistingServer: true,
    stdout: "pipe",
    stderr: "pipe",
    env: { NODE_ENV: "test" },
  },
  testDir: "tests",
});
