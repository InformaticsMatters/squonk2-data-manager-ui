import { expect, test } from "@playwright/test";
import { type ServerResponse } from "node:http";

import { isResponseJson } from "../../src/utils/api/fetchHelpers";
import {
  createErrorProps,
  describeTransportFailure,
} from "../../src/utils/api/serverSidePropsError";

const recordedResponse = () => ({ statusCode: 200, statusMessage: "" }) as ServerResponse;

// Node writes `statusMessage` straight into the HTTP status line and rejects anything outside this
// set with `ERR_INVALID_CHAR`, which destroys the response instead of rendering the error page.
const REASON_PHRASE = /^[\u0020-\u007E\u0080-\u00FF]*$/u;

test.describe("Server-rendered error status line", () => {
  test("a readable message is carried unchanged", () => {
    const res = recordedResponse();
    expect(createErrorProps(res, 404, "Dataset version not found")).toEqual({
      props: { statusCode: 404, statusMessage: "Dataset version not found" },
    });
    expect(res.statusCode).toBe(404);
    expect(res.statusMessage).toBe("Dataset version not found");
  });

  test("a message the status line cannot carry never reaches it", () => {
    const hostile = [
      "line one\r\nX-Injected: yes",
      "tab\tseparated",
      "naïve \u2603 message",
      "\u0000control",
      // `obs-text` (RFC 7230) is latin1 the status line may carry, so this one survives intact.
      "next\u0085line",
    ];
    for (const message of hostile) {
      const res = recordedResponse();
      const { props } = createErrorProps(res, 500, message);
      expect(res.statusMessage, message).toMatch(REASON_PHRASE);
      expect(props.statusMessage, message).toBe(res.statusMessage);
      expect(res.statusCode, message).toBe(500);
    }
  });

  test("a message with nothing left to say leaves a status line but states nothing", () => {
    const res = recordedResponse();
    // The status line has to carry a phrase; the props carry only what was actually said, so a
    // page can answer for a failure nothing accounted for in words of its own.
    expect(createErrorProps(res, 502, "\r\n\t").props.statusMessage).toBe("");
    expect(res.statusMessage).toBe("Request failed with status 502");
  });

  test("an unbounded message is bounded", () => {
    const res = recordedResponse();
    createErrorProps(res, 500, "x".repeat(5000));
    expect(res.statusMessage.length).toBeLessThanOrEqual(200);
  });
});

const answeredWith = (contentType: string) =>
  isResponseJson(new Response(null, { headers: { "content-type": contentType } }));

test.describe("Rejected viewer transport", () => {
  test("a body is read for a reason only where the media type says it carries one", () => {
    // Connexion request-validation and framework rejections — the only answers carrying `detail` —
    // are `application/problem+json`, so a suffixed JSON type is JSON here or the reason is lost.
    for (const carried of [
      "application/json",
      "application/json; charset=utf-8",
      "application/problem+json",
      "application/problem+json; charset=utf-8",
      "APPLICATION/PROBLEM+JSON",
    ]) {
      expect(answeredWith(carried), carried).toBe(true);
    }
    for (const notCarried of [
      "text/html; charset=utf-8",
      "application/octet-stream",
      "text/plain",
    ]) {
      expect(answeredWith(notCarried), notCarried).toBe(false);
    }
  });

  test("the service's own reason is what the page states and what Sentry is told", () => {
    // Both bodies are a 404. Only the service's own words say which resource was not there.
    const absentFile = describeTransportFailure(
      { status: 404, statusText: "Not Found" },
      { error: "File does not exist (/nope.txt)" },
    );
    const absentProject = describeTransportFailure(
      { status: 404, statusText: "Not Found" },
      { error: "Project does not exist (project-00000000-0000-0000-0000-000000000000)" },
    );

    expect(absentFile).toEqual({
      diagnostic: "File does not exist (/nope.txt)",
      statusMessage: "File does not exist (/nope.txt)",
    });
    expect(absentProject.statusMessage).toBe(
      "Project does not exist (project-00000000-0000-0000-0000-000000000000)",
    );
    expect(absentProject.statusMessage).not.toBe(absentFile.statusMessage);
  });

  test("a framework rejection is read through the same extractor", () => {
    expect(
      describeTransportFailure(
        { status: 400, statusText: "" },
        {
          detail: "Missing query parameter 'file'",
          status: 400,
          title: "Bad Request",
          type: "about:blank",
        },
      ).statusMessage,
    ).toBe("Missing query parameter 'file'");
  });

  test("a schema dump is cut to the sentence the caller can act on", () => {
    const { statusMessage } = describeTransportFailure(
      { status: 400, statusText: "" },
      {
        detail: [
          "'nonsense' does not match '^project-[0-9a-f-]{36}$'",
          "Failed validating 'pattern' in schema:\n    {'type': 'string'}",
          "On instance:\n    'nonsense'",
        ].join("\n\n"),
      },
    );

    expect(statusMessage).toBe("'nonsense' does not match '^project-[0-9a-f-]{36}$'");
  });

  test("a body that is a plain string is the whole of what was said", () => {
    expect(
      describeTransportFailure({ status: 403, statusText: "Forbidden" }, "Not an editor (odudgeon)")
        .statusMessage,
    ).toBe("Not an editor (odudgeon)");
  });

  test("a body accounting for nothing states nothing, and the status line still has a phrase", () => {
    // A body that is not JSON is never read, so the transport arrives here with nothing to relay.
    for (const body of [null, {}, { error: { nested: true } }, { detail: 42 }]) {
      const failure = describeTransportFailure({ status: 404, statusText: "Not Found" }, body);
      expect(failure.statusMessage, JSON.stringify(body)).toBe("");
      expect(failure.diagnostic, JSON.stringify(body)).toBe("no reason in the 404 body");
    }
    const res = recordedResponse();
    expect(createErrorProps(res, 404, "").props.statusMessage).toBe("");
    expect(res.statusMessage).toBe("Request failed with status 404");
  });

  test("the reason phrase the transport reports is never relayed, empty or not", () => {
    // squonk.it is served over HTTP/2, which has no reason phrase at all, so `statusText` is empty
    // in production; over HTTP/1.1 it is the generic phrase for the status. Neither is the
    // service's account of the request, and nothing here reads either.
    for (const statusText of ["Not Found", ""]) {
      expect(
        describeTransportFailure({ status: 404, statusText }, null).statusMessage,
        statusText,
      ).toBe("");
      expect(
        describeTransportFailure({ status: 404, statusText }, { error: "File does not exist (/a)" })
          .statusMessage,
        statusText,
      ).toBe("File does not exist (/a)");
    }
  });

  test("upstream text reaches the status line only through the reason-phrase sanitiser", () => {
    const { statusMessage } = describeTransportFailure(
      { status: 403, statusText: "Forbidden" },
      { error: "dataset 0e9c\r\nX-Injected: yes" },
    );
    const res = recordedResponse();
    const { props } = createErrorProps(res, 403, statusMessage);

    expect(res.statusMessage).toMatch(REASON_PHRASE);
    expect(res.statusMessage).toBe("dataset 0e9c X-Injected: yes");
    expect(props.statusMessage).toBe(res.statusMessage);
  });
});
