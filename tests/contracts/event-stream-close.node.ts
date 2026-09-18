import { expect, test } from "@playwright/test";

import {
  describeCloseCode,
  eventStreamCloseMessage,
} from "../../src/components/eventStream/closeReasons";

test.describe("event stream close", () => {
  test("reports the reason a dropped connection closed with", () => {
    expect(eventStreamCloseMessage({ code: 1006, wasClean: false })).toBe(
      "Event stream disconnected unexpectedly. Abnormal closure - connection lost without close frame. Attempting to reconnect...",
    );
  });

  test("reports the reason a deliberate close ended with", () => {
    expect(eventStreamCloseMessage({ code: 1001, wasClean: true })).toBe(
      "Disconnected from event stream. Going away - server is shutting down or client navigating away.",
    );
  });

  test("adds nothing to a normal closure, which the sentence already is", () => {
    expect(eventStreamCloseMessage({ code: 1000, wasClean: true })).toBe(
      "Disconnected from event stream.",
    );
  });

  test("falls back to the generic sentence for a code the table does not cover", () => {
    expect(eventStreamCloseMessage({ code: 4999, wasClean: false })).toBe(
      "Event stream disconnected unexpectedly. Attempting to reconnect...",
    );
    expect(eventStreamCloseMessage({ code: 4999, wasClean: true })).toBe(
      "Disconnected from event stream.",
    );
  });

  test("describes a mapped close code", () => {
    expect(describeCloseCode(1013)).toBe("Try again later - temporary server condition");
  });

  test("describes no code the table does not cover", () => {
    expect(describeCloseCode(4999)).toBeNull();
  });
});
