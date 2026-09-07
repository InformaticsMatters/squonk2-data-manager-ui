import { expect, test } from "@playwright/test";

import {
  type AdministrationReadSubject,
  decideAdministrationReadFailure,
  presentAdministrationFailure,
} from "../../src/administration/failures";
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
  // A token the service will not accept is presented as the refusal it was presented as before it
  // had a kind of its own, and each rejection status the classifier now names still reads as a
  // failure this client could not account for.
  {
    failure: { cause: null, kind: "token-refused", status: 403 },
    message: /do not have access/u,
    retryable: false,
  },
  {
    failure: { cause: null, kind: "bad-request", status: 400 },
    message: /could not be loaded/u,
    retryable: true,
  },
  {
    failure: { cause: null, kind: "method-not-allowed", status: 405 },
    message: /could not be loaded/u,
    retryable: true,
  },
  {
    failure: { cause: null, kind: "conflict", status: 409 },
    message: /could not be loaded/u,
    retryable: true,
  },
  {
    failure: { cause: null, kind: "unsupported-media-type", status: 415 },
    message: /could not be loaded/u,
    retryable: true,
  },
  {
    failure: { cause: null, kind: "unprocessable", status: 422 },
    message: /could not be loaded/u,
    retryable: true,
  },
];

test.describe("Administration failure presentation", () => {
  for (const { failure, message, retryable } of failures) {
    test(`presents ${failure.kind} distinctly`, () => {
      expect(presentAdministrationFailure(failure)).toMatchObject({ message, retryable });
    });
  }
});

test.describe("degrade versus replace", () => {
  const subjects: AdministrationReadSubject[] = ["organisation", "subscription", "unit"];

  for (const { failure, retryable } of failures) {
    if (retryable) {
      test(`a ${failure.kind} read keeps the frame for every subject`, () => {
        for (const subject of subjects) {
          expect(decideAdministrationReadFailure(subject, failure), subject).toBe("retry");
        }
      });
    }
  }

  test("a refused organisation read removes sections rather than the page", () => {
    for (const { failure, retryable } of failures) {
      if (!retryable) {
        expect(decideAdministrationReadFailure("organisation", failure), failure.kind).toBe(
          "degrade",
        );
      }
    }
  });

  test("a refused unit or subscription read replaces the page", () => {
    for (const { failure, retryable } of failures) {
      if (!retryable) {
        expect(decideAdministrationReadFailure("unit", failure), failure.kind).toBe("replace");
        expect(decideAdministrationReadFailure("subscription", failure), failure.kind).toBe(
          "replace",
        );
      }
    }
  });
});
