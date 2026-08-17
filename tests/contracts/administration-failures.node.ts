import { expect, test } from "@playwright/test";

import { presentAdministrationFailure } from "../../src/administration/failures";
import { type TransportFailure } from "../../src/api/runtime/classifyTransportFailure";

const failures: { failure: TransportFailure; message: RegExp; retryable: boolean }[] = [
  {
    failure: { cause: null, kind: "forbidden", status: 403 },
    message: /do not have access/u,
    retryable: false,
  },
  {
    failure: { cause: null, kind: "not-found", status: 404 },
    message: /no longer available/u,
    retryable: false,
  },
  {
    failure: { cause: null, kind: "rate-limited", status: 429 },
    message: /rate-limited/u,
    retryable: true,
  },
  { failure: { cause: null, kind: "timeout" }, message: /timed out/u, retryable: true },
  { failure: { cause: null, kind: "network" }, message: /connection/u, retryable: true },
  {
    failure: { cause: null, kind: "server", status: 503 },
    message: /service failed/u,
    retryable: true,
  },
  { failure: { cause: null, kind: "unknown" }, message: /could not be loaded/u, retryable: true },
];

test.describe("Administration failure presentation", () => {
  for (const { failure, message, retryable } of failures) {
    test(`presents ${failure.kind} distinctly`, () => {
      expect(presentAdministrationFailure(failure)).toMatchObject({ message, retryable });
    });
  }
});
