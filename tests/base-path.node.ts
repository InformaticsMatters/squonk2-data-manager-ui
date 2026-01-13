import { expect, test } from "@playwright/test";

import { getAsApiUrl, getDmApiUrl } from "../src/constants/proxies";
import { getBasePath, withBasePath } from "../src/utils/app/basePath";
import { projectURL } from "../src/utils/app/routes";
import { getFullReturnTo } from "../src/utils/next/ssr";

const withMockedLocation = (origin: string) => {
  const previous = (globalThis as any).location;

  Object.defineProperty(globalThis, "location", {
    configurable: true,
    writable: true,
    value: { origin } as Location,
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

    process.env.NEXT_PUBLIC_BASE_PATH = "/data-manager-ui";
    expect(projectURL("1234")).toBe("https://example.org/data-manager-ui/project?project=1234");

    process.env.NEXT_PUBLIC_BASE_PATH = "";
    expect(projectURL("abcd")).toBe("https://example.org/project?project=abcd");

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

  test("proxy URLs derive from base path", () => {
    expect(getDmApiUrl("/data-manager-ui")).toBe("/data-manager-ui/api/dm-api");
    expect(getAsApiUrl("/data-manager-ui")).toBe("/data-manager-ui/api/as-api");
    expect(getDmApiUrl("")).toBe("/api/dm-api");
    expect(getAsApiUrl("")).toBe("/api/as-api");
  });
});
