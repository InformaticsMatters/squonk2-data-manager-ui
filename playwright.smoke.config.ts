import { defineConfig } from "@playwright/test";

import { liveBaseURL, livePort } from "./tests/liveEnvironment";

export default defineConfig({
  projects: [
    // A real login and logout against the live Keycloak. The authenticated project journeys that
    // consumed its storage state drove the removed selected-project and Settings UI; the same
    // behavior is now proven deterministically in `tests/acceptance`, so this suite is live
    // credential and navigation evidence alone.
    // Named exactly, so the live journey's own preparation — also a `.setup.ts` — stays out of this
    // read-only suite.
    { name: "setup", testMatch: "**/login.setup.ts" },
    { name: "browser-smoke", testMatch: "**/navigation.browser.ts", use: { baseURL: liveBaseURL } },
  ],
  retries: 0,
  testDir: "tests",
  timeout: 60_000,
  use: { trace: "retain-on-failure" },
  webServer: {
    command: `pnpm start -p ${livePort}`,
    env: { NODE_ENV: "production" },
    reuseExistingServer: true,
    timeout: 200_000,
    url: liveBaseURL,
  },
});
