import { expect, test } from "@playwright/test";

import {
  classifyTransportFailure,
  isTransientTransportFailure,
  NetworkTransportError,
} from "../../src/api/runtime/classifyTransportFailure";

test.describe("transport failure classification", () => {
  const statusCases = [
    [400, "bad-request"],
    [403, "forbidden"],
    [404, "not-found"],
    [405, "method-not-allowed"],
    [409, "conflict"],
    [415, "unsupported-media-type"],
    [422, "unprocessable"],
    [429, "rate-limited"],
    [500, "server"],
    [503, "server"],
    // Both specs document `401` for a request that carried no token at all, and nothing in this
    // client answers it yet, so it stays unnamed rather than folded into the token refusal below.
    [401, "unknown"],
  ] as const;

  for (const [status, kind] of statusCases) {
    test(`classifies Axios HTTP ${status}`, () => {
      const cause = { isAxiosError: true, response: { status } };
      expect(classifyTransportFailure(cause)).toEqual({ kind, status, cause });
    });

    test(`classifies Fetch response HTTP ${status}`, () => {
      const cause = new Response(undefined, { status });
      expect(classifyTransportFailure(cause)).toEqual({ kind, status, cause });
    });

    test(`classifies generated Fetch-shaped HTTP ${status}`, () => {
      const cause = { status, data: undefined, headers: new Headers() };
      expect(classifyTransportFailure(cause)).toEqual({ kind, status, cause });
    });
  }

  test("classifies Axios timeouts before status", () => {
    const cause = { isAxiosError: true, code: "ECONNABORTED", response: { status: 500 } };
    expect(classifyTransportFailure(cause)).toEqual({ kind: "timeout", cause });
  });

  test("classifies Fetch timeout and network failures", () => {
    const timeout = new DOMException("timed out", "TimeoutError");
    expect(classifyTransportFailure(timeout)).toEqual({ kind: "timeout", cause: timeout });

    const network = new NetworkTransportError(new TypeError("fetch failed"));
    expect(classifyTransportFailure(network)).toEqual({ kind: "network", cause: network });
  });

  test("classifies Axios failures without a response as network failures", () => {
    const cause = { isAxiosError: true, code: "ERR_NETWORK" };
    expect(classifyTransportFailure(cause)).toEqual({ kind: "network", cause });
  });

  test("does not infer transport meaning from messages", () => {
    const cause = new Error("Request failed with status code 404");
    expect(classifyTransportFailure(cause)).toEqual({ kind: "unknown", cause });

    const typeError = new TypeError("Failed to fetch");
    expect(classifyTransportFailure(typeError)).toEqual({ kind: "unknown", cause: typeError });
  });

  // Live, a `403` is a domain rule, a missing resource, an unknown user — or a token the service
  // will not accept. Only the last is a fact about the caller's session rather than the resource.
  test("tells a token refusal apart from a resource refusal", () => {
    const scopes = {
      isAxiosError: true,
      response: {
        status: 403,
        data: {
          detail:
            "Provided token does not have the required scopes. Provided: []; Required: ['data-manager-user']",
        },
      },
    };
    expect(classifyTransportFailure(scopes)).toEqual({
      kind: "token-refused",
      status: 403,
      cause: scopes,
    });

    const resource = {
      isAxiosError: true,
      response: { status: 403, data: { error: "Unit does not exist" } },
    };
    expect(classifyTransportFailure(resource)).toEqual({
      kind: "forbidden",
      status: 403,
      cause: resource,
    });
  });

  test("reads a token refusal through the generated Fetch envelope too", () => {
    const cause = {
      status: 403,
      data: { detail: "Provided token does not have the required scopes. Provided: []" },
      headers: new Headers(),
    };
    expect(classifyTransportFailure(cause)).toEqual({ kind: "token-refused", status: 403, cause });
  });

  test("holds no rejection worth repeating", () => {
    for (const [status] of statusCases.filter(([code]) => code < 500)) {
      const cause = { isAxiosError: true, response: { status } };
      expect(isTransientTransportFailure(cause), String(status)).toBe(status === 429);
    }
  });

  test("preserves unknown explicit status", () => {
    const cause = new Response(undefined, { status: 418 });
    expect(classifyTransportFailure(cause)).toEqual({ kind: "unknown", status: 418, cause });
  });

  test("classifies malformed and primitive causes as unknown", () => {
    expect(classifyTransportFailure(null)).toEqual({ kind: "unknown", cause: null });
    expect(classifyTransportFailure("offline")).toEqual({ kind: "unknown", cause: "offline" });
    const numericStatus = { status: 404 };
    expect(classifyTransportFailure(numericStatus)).toEqual({
      kind: "unknown",
      cause: numericStatus,
    });
    const cause = { status: "404" };
    expect(classifyTransportFailure(cause)).toEqual({ kind: "unknown", cause });
  });
});
