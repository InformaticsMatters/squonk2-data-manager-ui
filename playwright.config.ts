import { defineConfig } from "@playwright/test";

import { registerStaticImageRequire } from "./tests/stubs/staticImage";

registerStaticImageRequire();

export default defineConfig({
  projects: [{ name: "node", testMatch: "**/*.node.ts" }],
  testDir: "tests",
});
