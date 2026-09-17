import { expect, test } from "@playwright/test";

import { createAxiosRuntime } from "../../src/api/runtime/createAxiosRuntime";

const authorizationOf = (runtime: ReturnType<typeof createAxiosRuntime>) =>
  runtime.instance.defaults.headers.common.Authorization;

test.describe("API client credentials", () => {
  test("presents the caller's token on every request once it is known", () => {
    const runtime = createAxiosRuntime();

    runtime.setAuthToken("a-token");

    expect(authorizationOf(runtime)).toBe("Bearer a-token");
  });

  test("sends no Authorization header at all when there is no token", () => {
    const runtime = createAxiosRuntime();

    runtime.setAuthToken("");

    // The failure this guards against is `Bearer `: a header the API can only reject, sent on
    // behalf of a session that has none.
    expect(authorizationOf(runtime)).toBeUndefined();
  });

  test("withdraws a token that has stopped working", () => {
    const runtime = createAxiosRuntime();

    runtime.setAuthToken("a-token");
    runtime.setAuthToken("");

    expect(authorizationOf(runtime)).toBeUndefined();
  });

  test("keeps each client's credentials to itself", () => {
    const dataManager = createAxiosRuntime();
    const accountServer = createAxiosRuntime();

    dataManager.setAuthToken("a-token");

    expect(authorizationOf(accountServer)).toBeUndefined();
  });
});
