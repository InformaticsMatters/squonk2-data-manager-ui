import { defineConfig } from "@playwright/test";

import { liveBaseURL, livePort } from "./tests/liveEnvironment";

/**
 * The live user journey: one mutating run of a whole user's working life against the DLS test
 * deployment. It is manual and scheduled only, never a merge gate — `pnpm test:acceptance` is where
 * behaviour is specified, and this is the only evidence that real services still carry it end to
 * end.
 */
export default defineConfig({
  projects: [
    // Preparation clears the journey user's workspace and makes every identity known to the
    // services. The journey depends on it, so a run that cannot be prepared never starts.
    { name: "journey-preparation", testMatch: "**/journey/preparation.setup.ts" },
    {
      dependencies: ["journey-preparation"],
      name: "journey",
      testMatch: "**/journey/journey.live.ts",
      use: { baseURL: liveBaseURL },
    },
  ],
  // Every wait the journey really needs is asked for where it is needed, so a click or an assertion
  // that finds nothing fails in seconds instead of holding the whole run open.
  expect: { timeout: 15_000 },
  // A second attempt would start from the first attempt's leftovers, so there is nothing to retry.
  retries: 0,
  testDir: "tests",
  timeout: 20 * 60_000,
  use: { actionTimeout: 30_000, trace: "retain-on-failure" },
  webServer: {
    command: `pnpm start -p ${livePort}`,
    env: { NODE_ENV: "production" },
    reuseExistingServer: true,
    timeout: 200_000,
    url: liveBaseURL,
  },
  workers: 1,
});
