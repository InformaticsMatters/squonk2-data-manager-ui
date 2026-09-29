import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

import { failureToEnqueue } from "../../src/hooks/enqueuedFailure";

/** A rejection as Axios delivers it, which is how every generated hook meets one today. */
const axiosFailure = (data: unknown, status = 400) => ({
  isAxiosError: true,
  message: `Request failed with status code ${status}`,
  response: { data, status, statusText: "" },
});

/**
 * An answer as the generated Fetch runtime returns it. It does not throw on a non-2xx: it hands
 * back the body, the status and the headers whatever the service decided.
 */
const fetchAnswer = (data: unknown, status: number) => ({ data, headers: new Headers(), status });

const unknownFailure = "An unknown error occurred. This has been reported.";

/**
 * Every shape a failure reaches the snackbar in, against the sentence shown and whether it is worth
 * an engineer's attention. Reporting is the client admitting it cannot read a value at all; a
 * service refusing a request accounts for itself, so it is shown and not reported.
 */
const failures: [description: string, error: unknown, message: string, reported: boolean][] = [
  [
    "an axios rejection carrying the documented error field",
    axiosFailure({ error: "Not an editor (odudgeon)" }, 403),
    "Not an editor (odudgeon)",
    false,
  ],
  [
    "an axios rejection carrying a problem+json detail",
    axiosFailure({ detail: "'z' is too short - 'name'", title: "Bad Request" }),
    "'z' is too short - 'name'",
    false,
  ],
  [
    "a Fetch-runtime failure carrying the documented error field",
    fetchAnswer({ error: "Unit does not exist" }, 403),
    "Unit does not exist",
    false,
  ],
  [
    "a Fetch-runtime failure carrying a problem+json detail",
    fetchAnswer({ detail: "Missing query parameter 'file'", title: "Bad Request" }, 400),
    "Missing query parameter 'file'",
    false,
  ],
  [
    "a Fetch-runtime failure carrying nothing but the reason phrase",
    fetchAnswer({ status: 400, title: "Bad Request" }, 400),
    "Bad Request",
    false,
  ],
  [
    "a Fetch-runtime failure that said nothing of itself",
    fetchAnswer(undefined, 500),
    "Request failed with status 500",
    false,
  ],
  ["a string the caller wrote itself", "The file is too large.", "The file is too large.", false],
  ["an error no shape accounts for", new Error("boom"), unknownFailure, true],
  ["nothing at all", undefined, unknownFailure, true],
];

test.describe("enqueued failure", () => {
  for (const [description, error, message, reported] of failures) {
    test(`shows ${description}`, () => {
      expect(failureToEnqueue(error)).toEqual({ message, report: reported });
    });
  }

  test("reads the same body the same way whichever transport carried it", () => {
    // The Fetch interfaces are where the generated clients are going, so a migration must not
    // change a single sentence a caller is shown.
    const body = { detail: "'z' is too short - 'name'", status: 400, title: "Bad Request" };
    expect(failureToEnqueue(fetchAnswer(body, 400)).message).toBe(
      failureToEnqueue(axiosFailure(body)).message,
    );
  });

  test("reports a successful Fetch answer, which is not a failure to describe", () => {
    // Nothing should hand a 2xx to the error presentation, so one arriving is the client at fault
    // rather than the service, and is the case reporting exists for.
    expect(failureToEnqueue(fetchAnswer({ id: "project-00000000" }, 200))).toEqual({
      message: unknownFailure,
      report: true,
    });
  });

  test("captures nothing the presentation accounted for", () => {
    // The presentation decides; the hook around it is React-bound and only obeys, so what is
    // asserted of it is that the one capture it makes is the one the decision asked for.
    const source = readFileSync(
      path.join(process.cwd(), "src/hooks/useEnqueueStackError.ts"),
      "utf8",
    );
    const [, whenReported = ""] = source.split("if (report) {");

    expect(source.split("captureException(")).toHaveLength(2);
    expect(whenReported.split("}")[0]).toContain("captureException(error);");
  });
});
