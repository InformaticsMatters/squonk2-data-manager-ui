import { defineConfig, devices } from "@playwright/test";

import { registerStaticImageRequire } from "./tests/stubs/staticImage";

registerStaticImageRequire();

const galleryURL = "http://localhost:3100/playwright/gallery/index.html";

export default defineConfig({
  projects: [
    { name: "node", testMatch: "**/*.node.ts" },
    {
      name: "components",
      testDir: "./tests/components",
      use: {
        ...devices["Desktop Chrome"],
        // `mount` navigates to the gallery, so the base URL is the gallery page itself.
        baseURL: galleryURL,
        reuseContext: true,
        serviceWorkers: "block",
      },
    },
  ],
  testDir: "tests",
  webServer: {
    // The gallery has its own Vite server; the Next dev server does not serve it.
    command: "pnpm exec vite --config playwright/vite.config.mts",
    reuseExistingServer: !process.env.CI,
    url: galleryURL,
  },
});
