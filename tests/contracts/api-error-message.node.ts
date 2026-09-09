import { expect, test } from "@playwright/test";

import {
  apiFailureReason,
  getErrorMessage,
  noErrorInformation,
} from "../../src/utils/next/orvalError";

/** A rejection as Axios delivers it, which is how every mutation in the app meets one. */
const axiosFailure = (data: unknown, statusText?: string, message?: string) => ({
  isAxiosError: true,
  message,
  response: { data, status: 400, statusText },
});

/** What `GET /project/nonsense` answers with: one useful sentence, then a JSON Schema dump. */
const schemaDump = [
  "'nonsense' does not match '^project-[a-f0-9]{8}$'",
  "Failed validating 'pattern' in schema:\n    {'type': 'string',\n     'pattern': '^project-[a-f0-9]{8}$'}",
  "On instance:\n    'nonsense'",
].join("\n\n");

/**
 * Every shape a rejected request actually arrives in, against the service's own account of it.
 *
 * Both specs document one error schema, `{ error }`, and every 4xx they describe carries it. But
 * Connexion request-validation and framework failures bypass the handler and answer
 * `application/problem+json` — `type`, `title`, `detail`, `status` — a shape in neither spec that
 * never carries `error`. `null` is not the absence of a failure: it says this answer carried no
 * words of its own, so the caller's own sentence is the better one.
 */
const bodies: [description: string, body: unknown, reason: string | null][] = [
  ["the documented error field", { error: "Not an editor (odudgeon)" }, "Not an editor (odudgeon)"],
  [
    "a problem+json detail no spec documents",
    { detail: "'z' is too short - 'name'", status: 400, title: "Bad Request", type: "about:blank" },
    "'z' is too short - 'name'",
  ],
  [
    "the documented field ahead of problem+json",
    { detail: "detail text", error: "error text" },
    "error text",
  ],
  [
    "a detail that is a schema dump",
    { detail: schemaDump },
    "'nonsense' does not match '^project-[a-f0-9]{8}$'",
  ],
  [
    "a detail broken across lines",
    { detail: "Missing query parameter\n'file'" },
    "Missing query parameter 'file'",
  ],
  ["a body that is a string", "Service Unavailable", "Service Unavailable"],
  [
    "a sentence the call chain behind it was appended to",
    {
      error:
        "The Product or its Unit does not support public Projects (Action denied (-2). Failed to get a response from the Account Server (Got status 404, expected 201))",
    },
    "The Product or its Unit does not support public Projects",
  ],
  [
    "a sentence ending in the subject it is about",
    { error: "The file does not exist (/, zzz.txt)" },
    "The file does not exist (/, zzz.txt)",
  ],
  [
    "an answer that is nothing but a call chain",
    { error: "(Action denied (-2). Failed to get a response from the Account Server)" },
    "(Action denied (-2). Failed to get a response from the Account Server)",
  ],
  ["a body carrying neither field", { status: 400, title: "Bad Request" }, null],
  ["an empty body", {}, null],
  ["a body whose fields are blank", { detail: "   ", error: "" }, null],
  ["no body at all", undefined, null],
];

test.describe("service failure reason", () => {
  for (const [description, body, reason] of bodies) {
    test(`reads ${description}`, () => {
      expect(apiFailureReason(axiosFailure(body))).toBe(reason);
    });
  }

  test("cuts a schema dump before the schema", () => {
    expect(apiFailureReason(axiosFailure({ detail: schemaDump }))).not.toContain(
      "Failed validating",
    );
  });

  test("reads a body handed over without its transport envelope", () => {
    expect(apiFailureReason({ error: "Unknown User" })).toBe("Unknown User");
    expect(apiFailureReason({ detail: "Missing query parameter 'file'" })).toBe(
      "Missing query parameter 'file'",
    );
  });

  test("reads the body of a generated Fetch response", () => {
    expect(
      apiFailureReason({
        data: { detail: "'z' is too short - 'name'" },
        headers: new Headers(),
        status: 400,
      }),
    ).toBe("'z' is too short - 'name'");
  });

  test("takes no account of a failure that made none of itself", () => {
    // The reason phrase and the transport's own message are facts about the request rather than the
    // service's account of it, so a caller with a sentence of its own keeps that sentence.
    expect(
      apiFailureReason(axiosFailure({}, "Bad Request", "Request failed with status 400")),
    ).toBeNull();
    expect(apiFailureReason(null)).toBeNull();
    expect(apiFailureReason(undefined)).toBeNull();
    expect(apiFailureReason("offline")).toBeNull();
  });
});

test.describe("displayed error message", () => {
  test("shows the service's own account first", () => {
    expect(getErrorMessage(axiosFailure({ error: "Unit does not exist" }, "Forbidden"))).toBe(
      "Unit does not exist",
    );
    expect(getErrorMessage(axiosFailure({ detail: schemaDump }, "Bad Request"))).toBe(
      "'nonsense' does not match '^project-[a-f0-9]{8}$'",
    );
  });

  test("falls back through the reason phrase to the transport's own words", () => {
    expect(getErrorMessage(axiosFailure({ status: 400, title: "Bad Request" }, "Whatever"))).toBe(
      "Bad Request",
    );
    expect(getErrorMessage(axiosFailure({}, "Forbidden", "Request failed"))).toBe("Forbidden");
    expect(getErrorMessage(axiosFailure({}, "", "Request failed"))).toBe("Request failed");
    expect(getErrorMessage(axiosFailure({}))).toBe(noErrorInformation);
  });

  test("keeps saying nothing about no error at all", () => {
    expect(getErrorMessage(null)).toBeNull();
    expect(getErrorMessage(undefined)).toBeNull();
  });

  test("reads a bare API error object", () => {
    expect(getErrorMessage({ error: "Cannot get the Default Organisation" })).toBe(
      "Cannot get the Default Organisation",
    );
  });
});
