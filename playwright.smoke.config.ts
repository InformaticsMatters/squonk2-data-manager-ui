import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
import path from "node:path";

const localEnvironment = path.resolve(__dirname, ".env.test.local");
if (existsSync(localEnvironment)) {
  process.loadEnvFile(localEnvironment);
}

const baseURL = new URL(process.env.BASE_URL as string);
baseURL.pathname = process.env.BASE_PATH ?? "/";
const port = process.env.TEST_PORT ?? "3000";
baseURL.port = port;

export default defineConfig({
  projects: [
    { name: "setup", testMatch: "**/*.setup.ts" },
    {
      name: "browser-smoke",
      testMatch: "**/navigation.browser.ts",
      use: { baseURL: baseURL.href },
    },
    {
      dependencies: ["setup"],
      name: "authenticated-smoke",
      testMatch: "**/*.browser-authenticated.ts",
      use: { baseURL: baseURL.href, storageState: "storageState.json" },
    },
  ],
  retries: 0,
  testDir: "tests",
  timeout: 60_000,
  use: { trace: "retain-on-failure" },
  webServer: {
    command: `pnpm start -p ${port}`,
    env: { NODE_ENV: "production" },
    reuseExistingServer: true,
    timeout: 200_000,
    url: baseURL.href,
  },
});
