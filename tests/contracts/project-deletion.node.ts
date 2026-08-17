import { expect, test } from "@playwright/test";

import { projectDeletionFailureReason } from "../../src/projects/failures";
import {
  forgetProjectDeletion,
  initialProjectDeletionState,
  parseProjectDeletionRecovery,
  pollingProjectDeletionState,
  type ProjectDeletionInput,
  type ProjectDeletionRecovery,
  type ProjectDeletionState,
  readProjectDeletionRecovery,
  rememberProjectDeletion,
  transitionProjectDeletion,
} from "../../src/projects/projectDeletion";

const productId = "product-77777777-7777-7777-7777-777777777777";
const projectId = "project-33333333-3333-3333-3333-333333333333";
const taskId = "task-44444444-4444-4444-4444-444444444444";
const input: ProjectDeletionInput = { productId, projectId };

const requested = (): ProjectDeletionState =>
  transitionProjectDeletion(
    transitionProjectDeletion(initialProjectDeletionState, { input, kind: "request" }).state,
    { kind: "requested", taskId },
  ).state;

test.describe("Project deletion request", () => {
  test("sends one Data Manager deletion and waits for the task it returned", () => {
    const requesting = transitionProjectDeletion(initialProjectDeletionState, {
      input,
      kind: "request",
    });
    expect(requesting).toEqual({
      effect: { kind: "delete-project", projectId },
      state: { input, kind: "requesting" },
    });
    expect(transitionProjectDeletion(requesting.state, { kind: "requested", taskId })).toEqual({
      state: { kind: "polling", productId, taskId },
    });
  });

  test("retains the request for a deliberate retry when the server refuses it", () => {
    const failed = transitionProjectDeletion(
      { input, kind: "requesting" },
      { kind: "request-failed", reason: "The server did not allow it." },
    );
    expect(failed).toEqual({
      state: { input, kind: "request-failed", reason: "The server did not allow it." },
    });
    // Retrying a deletion request can create nothing, so it is the one safe answer to a refusal.
    expect(transitionProjectDeletion(failed.state, { kind: "retry" })).toEqual({
      effect: { kind: "delete-project", projectId },
      state: { input, kind: "requesting" },
    });
  });

  test("keeps a project with no linked subscription to the Data Manager phase alone", () => {
    const started = transitionProjectDeletion(initialProjectDeletionState, {
      input: { projectId },
      kind: "request",
    });
    const polling = transitionProjectDeletion(started.state, { kind: "requested", taskId }).state;
    expect(polling).toEqual({ kind: "polling", taskId });
    expect(
      transitionProjectDeletion(polling, { kind: "progress", lifecycle: { kind: "succeeded" } }),
    ).toEqual({ state: { kind: "completed", taskId } });
  });
});

test.describe("Project deletion progress", () => {
  test("cleans up the subscription only after a confirmed exit-zero deletion", () => {
    const cleaning = transitionProjectDeletion(requested(), {
      kind: "progress",
      lifecycle: { kind: "succeeded" },
    });
    expect(cleaning).toEqual({
      effect: { kind: "delete-subscription", productId },
      state: { kind: "cleaning-up", productId, taskId },
    });
    expect(transitionProjectDeletion(cleaning.state, { kind: "cleanup-succeeded" })).toEqual({
      state: { kind: "completed", productId, taskId },
    });
  });

  test("stops cleanup for a nonzero or domain failure and offers no unsafe retry", () => {
    const failed = transitionProjectDeletion(requested(), {
      kind: "progress",
      lifecycle: { kind: "failed", reason: "This task failed with exit code 1." },
    });
    expect(failed).toEqual({
      state: {
        kind: "delete-failed",
        productId,
        reason: "This task failed with exit code 1.",
        taskId,
      },
    });
    // Nothing may restart a settled deletion, and nothing may reach the subscription past it.
    expect(transitionProjectDeletion(failed.state, { kind: "retry" })).toEqual({
      state: failed.state,
    });
    expect(
      transitionProjectDeletion(failed.state, {
        kind: "progress",
        lifecycle: { kind: "succeeded" },
      }),
    ).toEqual({ state: failed.state });
  });

  test("stops cleanup for a result this client cannot interpret, and retries the read alone", () => {
    const unusable = transitionProjectDeletion(requested(), {
      kind: "progress",
      lifecycle: { kind: "unknown", reason: "This task's progress could not be established." },
    });
    expect(unusable.state).toEqual({
      kind: "delete-unusable",
      productId,
      reason: "This task's progress could not be established.",
      taskId,
    });
    expect(unusable.effect).toBeUndefined();
    expect(transitionProjectDeletion(unusable.state, { kind: "retry" })).toEqual({
      effect: { kind: "read-deletion-task", taskId },
      state: { kind: "polling", productId, taskId },
    });
  });

  test("keeps a transiently unread deletion being checked rather than settled", () => {
    const unconfirmed = transitionProjectDeletion(requested(), {
      kind: "progress",
      lifecycle: { kind: "unconfirmed", reason: "It is still being checked." },
    });
    expect(unconfirmed).toEqual({
      state: {
        kind: "delete-unconfirmed",
        productId,
        reason: "It is still being checked.",
        taskId,
      },
    });
    // A read that answers next time settles the deletion it was always describing.
    expect(
      transitionProjectDeletion(unconfirmed.state, {
        kind: "progress",
        lifecycle: { kind: "succeeded" },
      }),
    ).toEqual({
      effect: { kind: "delete-subscription", productId },
      state: { kind: "cleaning-up", productId, taskId },
    });
    expect(
      transitionProjectDeletion(unconfirmed.state, {
        kind: "progress",
        lifecycle: { kind: "pending" },
      }),
    ).toEqual({ state: { kind: "polling", productId, taskId } });
  });

  test("retains the subscription identity when its cleanup fails, and retries only that", () => {
    const cleaning = transitionProjectDeletion(requested(), {
      kind: "progress",
      lifecycle: { kind: "succeeded" },
    }).state;
    const failed = transitionProjectDeletion(cleaning, {
      kind: "cleanup-failed",
      reason: "The subscription service is unavailable.",
    });
    expect(failed).toEqual({
      state: {
        kind: "cleanup-failed",
        productId,
        reason: "The subscription service is unavailable.",
        taskId,
      },
    });
    expect(transitionProjectDeletion(failed.state, { kind: "retry" })).toEqual({
      effect: { kind: "delete-subscription", productId },
      state: { kind: "cleaning-up", productId, taskId },
    });
  });

  test("resumes an addressed deletion from the route alone", () => {
    expect(pollingProjectDeletionState(taskId, productId)).toEqual({
      kind: "polling",
      productId,
      taskId,
    });
    expect(pollingProjectDeletionState(taskId, undefined)).toEqual({ kind: "polling", taskId });
  });
});

test("project deletion recovery names only the project to clear, and can be cleared itself", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => values.delete(key),
    setItem: (key: string, value: string) => values.set(key, value),
  };
  const recovery = { projectId, taskId } as unknown as ProjectDeletionRecovery;
  rememberProjectDeletion(storage, recovery);
  expect(readProjectDeletionRecovery(storage)).toEqual(recovery);
  forgetProjectDeletion(storage);
  expect(readProjectDeletionRecovery(storage)).toBeUndefined();

  // The subscription is the route's to carry, so a record can never disagree with it about one.
  expect(parseProjectDeletionRecovery({ productId, projectId, taskId, version: 1 })).toEqual({
    projectId,
    taskId,
  });
  for (const invalid of [
    { projectId, taskId: "not-a-task", version: 1 },
    { projectId: "not-a-project", taskId, version: 1 },
    { projectId, taskId },
  ]) {
    expect(parseProjectDeletionRecovery(invalid)).toBeUndefined();
  }
});

test("deletion failure reasons name the service the workflow was addressing", () => {
  const axiosFailure = (status?: number, code?: string, data: unknown = {}) => ({
    code,
    isAxiosError: true,
    response: status === undefined ? undefined : { data, status },
  });
  expect(projectDeletionFailureReason(axiosFailure(403), "project")).toContain(
    "did not allow this project to be deleted",
  );
  expect(projectDeletionFailureReason(axiosFailure(429), "subscription")).toContain(
    "subscription service is busy",
  );
  expect(projectDeletionFailureReason(axiosFailure(503), "subscription")).toContain(
    "subscription service is unavailable",
  );
  expect(projectDeletionFailureReason(axiosFailure(undefined, "ETIMEDOUT"), "project")).toContain(
    "timed out",
  );
  expect(projectDeletionFailureReason(axiosFailure(undefined, "ERR_NETWORK"), "project")).toContain(
    "could not reach the service",
  );
  expect(
    projectDeletionFailureReason(
      axiosFailure(400, undefined, { error: "fixture-domain-failure" }),
      "project",
    ),
  ).toBe("fixture-domain-failure");
});
