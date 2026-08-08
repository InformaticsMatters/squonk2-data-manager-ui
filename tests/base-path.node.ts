import { expect, test } from "@playwright/test";

import { getBasePath, withBasePath } from "../src/utils/app/basePath";
import { projectURL } from "../src/utils/app/routes";
import { getFullReturnTo } from "../src/utils/next/ssr";

const withMockedLocation = (origin: string) => {
  const previous = (globalThis as any).location;

  Object.defineProperty(globalThis, "location", {
    configurable: true,
    writable: true,
    value: { origin },
  });

  return () => {
    if (previous === undefined) {
      delete (globalThis as any).location;
    } else {
      Object.defineProperty(globalThis, "location", {
        configurable: true,
        writable: true,
        value: previous,
      });
    }
  };
};

test.describe("base path utilities", () => {
  test.afterEach(() => {
    delete process.env.NEXT_PUBLIC_BASE_PATH;
  });

  test("normalises base path values", () => {
    expect(getBasePath()).toBe("");
    expect(getBasePath(undefined)).toBe("");
    expect(getBasePath("")).toBe("");
    expect(getBasePath("/")).toBe("");
    expect(getBasePath("data-manager-ui")).toBe("/data-manager-ui");
    expect(getBasePath("/data-manager-ui/")).toBe("/data-manager-ui");
  });

  test("builds URLs with and without a base path", () => {
    expect(withBasePath("/api/auth/login", undefined)).toBe("/api/auth/login");
    expect(withBasePath("api/auth/login", "/data-manager-ui")).toBe(
      "/data-manager-ui/api/auth/login",
    );
    expect(withBasePath("", "/data-manager-ui")).toBe("/data-manager-ui");
    expect(withBasePath("", "")).toBe("");
  });

  test("project URLs respect base path and origin", () => {
    const restoreLocation = withMockedLocation("https://example.org");

    const projectId = "project-33333333-3333-3333-3333-333333333333";

    process.env.NEXT_PUBLIC_BASE_PATH = "/data-manager-ui";
    expect(projectURL(projectId)).toBe(
      `https://example.org/data-manager-ui/projects/${projectId}/files`,
    );

    process.env.NEXT_PUBLIC_BASE_PATH = "";
    expect(projectURL(projectId)).toBe(`https://example.org/projects/${projectId}/files`);

    restoreLocation();
  });

  test("full return-to URLs include base path when provided", () => {
    process.env.NEXT_PUBLIC_BASE_PATH = "/data-manager-ui";
    expect(
      getFullReturnTo({
        resolvedUrl: "/datasets?foo=bar",
        // Context properties unused by implementation
        query: {},
        params: {},
        locale: undefined,
      } as never),
    ).toBe("/data-manager-ui/datasets?foo=bar");

    process.env.NEXT_PUBLIC_BASE_PATH = "";
    expect(
      getFullReturnTo({
        resolvedUrl: "/datasets?foo=bar",
        query: {},
        params: {},
        locale: undefined,
      } as never),
    ).toBe("/datasets?foo=bar");
  });
});
