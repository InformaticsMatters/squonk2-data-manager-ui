import { expect, test } from "@playwright/test";
import { AxiosError, AxiosHeaders } from "axios";
import { readFileSync } from "node:fs";
import path from "node:path";

import { NetworkTransportError } from "../../src/api/runtime/classifyTransportFailure";
import {
  classifyLaunchFailure,
  idleLaunch,
  type LaunchAttempt,
  launchIsSendable,
  launchStatement,
  transitionLaunch,
} from "../../src/projects/runLaunch";

const rejection = (status: number) => new Response(null, { status });

/** A refusal carrying the Data Manager's own account of it, as axios delivers one. */
const domainRejection = (status: number, error: string) =>
  new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
    config: { headers: new AxiosHeaders() },
    data: { error },
    headers: {},
    status,
    statusText: "",
  });

const rejectedReason =
  "The Data Manager did not allow this to be run in this project. Nothing was launched, and the displayed project and its catalogue have not changed.";

const recoverableReason =
  "This launch could not be completed, so nothing was launched. The definition and everything entered have been kept, so it can be sent again.";

test.describe("Launch failure classification", () => {
  test("an authoritative refusal is a rejection that says nothing was launched", () => {
    // A refusal and an identity the Data Manager will not acknowledge read alike, so comparing the
    // two can never reveal whether a definition the caller may not run exists.
    for (const status of [403, 404]) {
      expect(classifyLaunchFailure(rejection(status))).toEqual({
        kind: "rejected",
        reason: rejectedReason,
      });
    }
  });

  test("a transport fact decides no authority, so the launch stays recoverable", () => {
    for (const error of [
      rejection(429),
      rejection(500),
      rejection(503),
      new NetworkTransportError(new TypeError("failed to fetch")),
      new DOMException("timed out", "TimeoutError"),
    ]) {
      expect(classifyLaunchFailure(error)).toEqual({
        kind: "recoverable",
        reason: recoverableReason,
      });
    }
  });

  test("a domain refusal is recoverable and reads as the service's own words", () => {
    expect(classifyLaunchFailure(domainRejection(400, "the job needs an input file"))).toEqual({
      kind: "recoverable",
      reason: "the job needs an input file",
    });
  });

  test("a failure nothing accounts for is still recoverable and never a rejection", () => {
    expect(classifyLaunchFailure(new Error("boom"))).toEqual({
      kind: "recoverable",
      reason:
        "This launch was not completed, so nothing was launched. Correct it and send it again.",
    });
  });
});

test.describe("Launch attempt lifecycle", () => {
  const pending = transitionLaunch(idleLaunch, { kind: "send" });

  test("sending a launch leaves it pending", () => {
    expect(pending).toEqual({ kind: "pending" });
  });

  test("a launch that has been sent cannot be sent again", () => {
    // The Data Manager creates an execution per accepted request, so a second submission of a
    // launch already in flight would run the same work twice.
    expect(transitionLaunch(pending, { kind: "send" })).toBe(pending);
    expect(launchIsSendable(pending)).toBe(false);
  });

  test("an accepted launch cannot be sent again while its execution is opening", () => {
    const accepted = transitionLaunch(pending, { kind: "accepted" });
    expect(accepted).toEqual({ kind: "accepted" });
    expect(transitionLaunch(accepted, { kind: "send" })).toBe(accepted);
    expect(launchIsSendable(accepted)).toBe(false);
  });

  test("an authoritative rejection withholds the launch rather than inviting it again", () => {
    const rejected = transitionLaunch(pending, { kind: "failed", error: rejection(403) });
    expect(rejected).toEqual({ kind: "rejected", reason: rejectedReason });
    expect(transitionLaunch(rejected, { kind: "send" })).toBe(rejected);
    expect(launchIsSendable(rejected)).toBe(false);
  });

  test("a recoverable failure may be sent again, and sending clears what it said", () => {
    const recoverable = transitionLaunch(pending, { kind: "failed", error: rejection(503) });
    expect(recoverable).toEqual({ kind: "recoverable", reason: recoverableReason });
    expect(launchIsSendable(recoverable)).toBe(true);
    expect(transitionLaunch(recoverable, { kind: "send" })).toEqual({ kind: "pending" });
  });

  test("an idle launch is the only other one that may be sent", () => {
    expect(launchIsSendable(idleLaunch)).toBe(true);
  });

  test("an answer to a launch that is not in flight changes nothing", () => {
    // Only the attempt that was sent may be answered, so a late answer to an attempt already
    // resolved can never reopen it or overwrite what the caller was last told.
    for (const attempt of [
      idleLaunch,
      { kind: "accepted" },
      { kind: "rejected", reason: rejectedReason },
    ] satisfies LaunchAttempt[]) {
      expect(transitionLaunch(attempt, { kind: "accepted" })).toBe(attempt);
      expect(transitionLaunch(attempt, { kind: "failed", error: rejection(503) })).toBe(attempt);
    }
  });
});

test.describe("Launch attempt presentation", () => {
  test("a launch nobody has sent says nothing", () => {
    expect(launchStatement(idleLaunch)).toBeUndefined();
  });

  test("every attempt that is not idle states where the launch stands", () => {
    expect(launchStatement({ kind: "pending" })).toEqual({
      message:
        "This launch has been sent. It cannot be sent again until the Data Manager answers it.",
      severity: "info",
    });
    expect(launchStatement({ kind: "accepted" })).toEqual({
      message: "This launch was accepted. Opening the execution it created.",
      severity: "success",
    });
    expect(launchStatement({ kind: "rejected", reason: rejectedReason })).toEqual({
      message: rejectedReason,
      severity: "warning",
    });
    expect(launchStatement({ kind: "recoverable", reason: recoverableReason })).toEqual({
      message: recoverableReason,
      severity: "error",
    });
  });
});

test.describe("Launch submission ownership", () => {
  const root = path.join(process.cwd(), "src");
  const modals = [
    "components/runCards/ApplicationCard/ApplicationModal.tsx",
    "components/runCards/JobCard/JobModal.tsx",
    "components/runCards/WorkflowCard/WorkflowModal.tsx",
  ];

  test("every launch is sent through the one attempt owner", () => {
    for (const modal of modals) {
      const source = readFileSync(path.join(root, modal), "utf8");
      // No modal keeps a submission flag of its own, which is the only way the control offering a
      // launch and the guard refusing a second one could come to disagree.
      expect(source).toContain("useRunLaunch");
      expect(source).not.toMatch(/setLaunching|useState<boolean>|launching,/u);
    }
  });

  test("no launch reports a failure through the shared error presentation", () => {
    // A classified launch failure is the one sentence the modal shows; handing the same failure to
    // the shared presentation as well would answer one launch twice, in two places.
    for (const modal of modals) {
      expect(readFileSync(path.join(root, modal), "utf8")).not.toContain("useEnqueueError");
    }
  });

  test("a modal belongs to the one definition of the one project it was addressed for", () => {
    // Everything a modal holds — what was entered and how far its launch got — is that definition's
    // alone. Without an identity to key it by, a second definition of the same type would reuse the
    // first one's modal, and an answer to the first launch would withhold the second one.
    const source = readFileSync(path.join(root, "projects/ProjectRunDefinition.tsx"), "utf8");
    expect(source).toContain("const key = `${projectId}-${item.kind}-${definitionId}`");
    expect(source).toContain("key,");
  });
});
