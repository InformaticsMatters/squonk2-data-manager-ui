import { defineConfig } from "@playwright/test";

export default defineConfig({
  projects: [{ name: "node", testMatch: "**/*.node.ts" }],
  testDir: "tests",
});
