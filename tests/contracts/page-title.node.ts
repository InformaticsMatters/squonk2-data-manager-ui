import { expect, test } from "@playwright/test";

import { pagePolicies } from "../../src/application/pagePolicy";
import { formatPageTitle, policyTitle } from "../../src/application/pageTitle";

test.describe("page titles", () => {
  test("name the page most specific first and the application last", () => {
    expect(formatPageTitle([])).toBe("Squonk Data Manager");
    expect(formatPageTitle(["Projects"])).toBe("Projects | Squonk Data Manager");
    expect(formatPageTitle(["results.sdf", "Files"])).toBe(
      "results.sdf | Files | Squonk Data Manager",
    );
  });

  test("every page policy names its page beneath its workspace", () => {
    expect(formatPageTitle(policyTitle(pagePolicies.public))).toBe("Squonk Data Manager");
    expect(formatPageTitle(policyTitle(pagePolicies.projects("index")))).toBe(
      "Projects | Squonk Data Manager",
    );
    expect(formatPageTitle(policyTitle(pagePolicies.projects("files")))).toBe(
      "Files | Projects | Squonk Data Manager",
    );
    expect(formatPageTitle(policyTitle(pagePolicies.datasets("list")))).toBe(
      "Datasets | Squonk Data Manager",
    );
    expect(formatPageTitle(policyTitle(pagePolicies.administration("overview")))).toBe(
      "Administration | Squonk Data Manager",
    );
    expect(formatPageTitle(policyTitle(pagePolicies.administration("unit-usage")))).toBe(
      "Usage & Inventory | Administration | Squonk Data Manager",
    );
  });
});
