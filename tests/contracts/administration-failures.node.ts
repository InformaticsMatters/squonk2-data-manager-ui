import { expect, test } from "@playwright/test";

import {
  administrationMutationFailureMessage,
  type AdministrationReadSubject,
  decideAdministrationReadFailure,
  presentAdministrationFailure,
  unitDeletionFailureMessage,
} from "../../src/administration/failures";
import {
  classifyTransportFailure,
  NetworkTransportError,
  type TransportFailure,
} from "../../src/api/runtime/classifyTransportFailure";

/**
 * Every shape a refused Administration answer arrives in.
 *
 * Both specs document `{ error }`, and Connexion request-validation and framework failures answer
 * `application/problem+json` with `detail` instead. A body carrying neither is what a proxy, a
 * gateway or a bodiless refusal leaves, and is the only case in which this client's own sentence is
 * the best one available.
 */
const bodies: { body: unknown; description: string; said: string | null }[] = [
  {
    body: { error: "Cannot get the Default Organisation" },
    description: "the documented error field",
    said: "Cannot get the Default Organisation",
  },
  {
    body: {
      detail: "'z' is too short - 'name'",
      status: 400,
      title: "Bad Request",
      type: "about:blank",
    },
    description: "a problem+json detail",
    said: "'z' is too short - 'name'",
  },
  { body: {}, description: "an empty body", said: null },
];

/** A refusal as Axios delivers it, which is how every Administration read and command meets one. */
const axiosFailure = (status: number, data: unknown) => ({
  isAxiosError: true,
  response: { data, status },
});

/**
 * Each transport fact an Administration read can arrive as, and what the screen owes the caller for
 * it.
 *
 * `relaysReason` is the whole of what this contract turns on: a refusal is the service answering
 * the request it was sent, so its own account of that answer is the sentence shown, while a
 * transport fact is something that happened to the request and the service said nothing about it.
 */
const reads: {
  canned: RegExp;
  cause: (body: unknown) => unknown;
  /** What a command reports for this fact where the service accounted for it with nothing. */
  commandCanned: RegExp | undefined;
  kind: TransportFailure["kind"];
  relaysReason: boolean;
  retryable: boolean;
  severity: "error" | "warning";
}[] = [
  {
    canned: /do not have access/u,
    cause: (body) => axiosFailure(403, body),
    commandCanned: /no longer have permission/u,
    kind: "forbidden",
    relaysReason: true,
    retryable: false,
    severity: "warning",
  },
  {
    canned: /no longer available/u,
    cause: (body) => axiosFailure(404, body),
    commandCanned: /no longer available/u,
    kind: "not-found",
    relaysReason: true,
    retryable: false,
    severity: "warning",
  },
  {
    canned: /request was refused/u,
    cause: (body) => axiosFailure(400, body),
    commandCanned: /Could not remove/u,
    kind: "bad-request",
    relaysReason: true,
    retryable: false,
    severity: "warning",
  },
  {
    canned: /request was refused/u,
    cause: (body) => axiosFailure(405, body),
    commandCanned: /Could not remove/u,
    kind: "method-not-allowed",
    relaysReason: true,
    retryable: false,
    severity: "warning",
  },
  {
    canned: /request was refused/u,
    cause: (body) => axiosFailure(409, body),
    commandCanned: /Could not remove/u,
    kind: "conflict",
    relaysReason: true,
    retryable: false,
    severity: "warning",
  },
  {
    canned: /request was refused/u,
    cause: (body) => axiosFailure(415, body),
    commandCanned: /Could not remove/u,
    kind: "unsupported-media-type",
    relaysReason: true,
    retryable: false,
    severity: "warning",
  },
  {
    canned: /request was refused/u,
    cause: (body) => axiosFailure(422, body),
    commandCanned: /Could not remove/u,
    kind: "unprocessable",
    relaysReason: true,
    retryable: false,
    severity: "warning",
  },
  {
    canned: /rate-limited/u,
    cause: (body) => axiosFailure(429, body),
    commandCanned: /retry is available/u,
    kind: "rate-limited",
    relaysReason: false,
    retryable: true,
    severity: "error",
  },
  {
    canned: /service failed/u,
    cause: (body) => axiosFailure(503, body),
    commandCanned: /retry is available/u,
    kind: "server",
    relaysReason: false,
    retryable: true,
    severity: "error",
  },
  {
    canned: /timed out/u,
    cause: () => ({ code: "ECONNABORTED", isAxiosError: true }),
    commandCanned: /retry is available/u,
    kind: "timeout",
    relaysReason: false,
    retryable: true,
    severity: "error",
  },
  {
    canned: /connection/u,
    cause: () => new NetworkTransportError(new Error("offline")),
    commandCanned: /retry is available/u,
    kind: "network",
    relaysReason: false,
    retryable: true,
    severity: "error",
  },
  {
    canned: /could not be loaded/u,
    cause: () => new Error("boom"),
    commandCanned: undefined,
    kind: "unknown",
    relaysReason: false,
    retryable: true,
    severity: "error",
  },
];

test.describe("Administration read failures", () => {
  for (const { canned, cause, kind, relaysReason, retryable, severity } of reads) {
    for (const { body, description, said } of bodies) {
      test(`presents ${kind} against ${description}`, () => {
        const failure = classifyTransportFailure(cause(body));
        expect(failure.kind, "the fact under test").toBe(kind);

        const presentation = presentAdministrationFailure(failure);
        expect(presentation).toMatchObject({ retryable, severity });
        if (relaysReason && said !== null) {
          expect(presentation.message).toBe(`${said}.`);
        } else {
          expect(presentation.message).toMatch(canned);
        }
      });
    }
  }

  // A token the service will not accept says nothing about the resource addressed, and its own
  // words are a list of scopes rather than a sentence for a person, so they are never relayed. Both
  // body shapes carry one: the framework answers `detail`, and the documented field can say it too.
  const tokenRefusals = [
    { detail: "Provided token does not have the required scopes. Provided: []; Required: ['x']" },
    { error: "Provided token does not have the required scopes" },
  ];

  for (const body of tokenRefusals) {
    test(`states a refused token as a refusal rather than as its own words: ${Object.keys(body).join(", ")}`, () => {
      const failure = classifyTransportFailure(axiosFailure(403, body));
      expect(failure.kind).toBe("token-refused");
      expect(presentAdministrationFailure(failure)).toEqual({
        message: "You do not have access to this Administration resource.",
        retryable: false,
        severity: "warning",
      });
    });
  }

  test("a refused token reports a command as a refusal, and says what did not change", () => {
    const message = administrationMutationFailureMessage(
      axiosFailure(403, tokenRefusals[0]),
      "rename",
      "unit unit-00000000-0000-4000-8000-000000000002",
    );
    expect(message).not.toContain("scopes");
    expect(message).toContain("The displayed resource has not changed.");
  });

  // The useful half of a service message is the leading clause; the call chain behind it names a
  // service the caller never addressed and a status they cannot act on.
  test("internal diagnostics trailing a service message do not reach the caller", () => {
    const message = presentAdministrationFailure(
      classifyTransportFailure(
        axiosFailure(403, {
          error:
            "The Product or its Unit does not support public Projects (Action denied (-2). Failed to get a response from the Account Server (Got status 404, expected 201))",
        }),
      ),
    ).message;
    expect(message).toBe("The Product or its Unit does not support public Projects.");
  });
});

test.describe("Administration command failures", () => {
  const resource = "unit unit-00000000-0000-4000-8000-000000000002";
  const unchanged = "The displayed resource has not changed";

  for (const { cause, commandCanned, kind, relaysReason } of reads) {
    for (const { body, description, said } of bodies) {
      test(`reports ${kind} against ${description}`, () => {
        const message = administrationMutationFailureMessage(cause(body), "remove", resource);
        if (relaysReason && said !== null) {
          expect(message).toBe(`${said}. ${unchanged}.`);
        } else if (commandCanned) {
          expect(message).toMatch(commandCanned);
          expect(message).toContain(unchanged);
        } else {
          // A refusal that accounted for itself with nothing, and a fact this client cannot
          // classify, are left to the shared error presentation rather than answered here.
          expect(message).toBe(undefined);
        }
      });
    }
  }

  // A rule about the resource is not a permission the caller lost: live, removing a member the
  // Account Server does not know answers `Unknown User`, and removing one from the default
  // organisation answers `Users cannot be removed from this Organisation`.
  test("a rule about the resource does not read as lost permission", () => {
    for (const said of ["Unknown User", "Users cannot be removed from this Organisation"]) {
      const message = administrationMutationFailureMessage(
        axiosFailure(403, { error: said }),
        "remove a member from",
        resource,
      );
      expect(message).toBe(`${said}. ${unchanged}.`);
      expect(message).not.toContain("permission");
    }
  });

  test("a refusal that said nothing keeps this client's own sentence", () => {
    expect(administrationMutationFailureMessage(axiosFailure(403, {}), "rename", resource)).toBe(
      `You no longer have permission to rename ${resource}. ${unchanged}.`,
    );
  });

  test("a refused unit deletion relays the precondition the Account Server named", () => {
    expect(
      unitDeletionFailureMessage(axiosFailure(403, { error: "Unit is not empty" }), resource),
    ).toBe(`Unit is not empty. ${unchanged}.`);
    expect(unitDeletionFailureMessage(axiosFailure(403, {}), resource)).toMatch(
      /may still contain projects/u,
    );
  });
});

test.describe("degrade versus replace", () => {
  const subjects: AdministrationReadSubject[] = ["organisation", "subscription", "unit"];

  for (const { cause, kind, retryable } of reads) {
    if (retryable) {
      test(`a ${kind} read keeps the frame for every subject`, () => {
        for (const subject of subjects) {
          expect(
            decideAdministrationReadFailure(subject, classifyTransportFailure(cause({}))),
            subject,
          ).toBe("retry");
        }
      });
    }
  }

  test("a refused organisation read removes sections rather than the page", () => {
    for (const { cause, kind, retryable } of reads) {
      if (!retryable) {
        expect(
          decideAdministrationReadFailure("organisation", classifyTransportFailure(cause({}))),
          kind,
        ).toBe("degrade");
      }
    }
  });

  test("a refused unit or subscription read replaces the page", () => {
    for (const { cause, kind, retryable } of reads) {
      if (!retryable) {
        const failure = classifyTransportFailure(cause({}));
        expect(decideAdministrationReadFailure("unit", failure), kind).toBe("replace");
        expect(decideAdministrationReadFailure("subscription", failure), kind).toBe("replace");
      }
    }
  });
});
