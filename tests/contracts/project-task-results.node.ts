import { type TaskGetResponse, type TaskSummary } from "@/api/data-manager";
import { getGetTaskQueryKey, getGetTasksQueryKey } from "@/api/data-manager/task";

import { expect, test } from "@playwright/test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { datasetLinks } from "../../src/datasets/routes";
import {
  evaluateResultTaskDeletionCapability,
  type ProjectCapabilityFacts,
  type ProjectResultTaskFacts,
} from "../../src/projects/capabilities";
import { resolveResultCapabilities } from "../../src/projects/resultCapabilities";
import { resultListRequests } from "../../src/projects/resultFacts";
import { projectLinks } from "../../src/projects/routes";
import {
  resolveResultTaskLifecycle,
  resultTaskOutput,
  resultTaskPollInterval,
  resultTaskSettlement,
} from "../../src/projects/taskFacts";

const projectId = "project-33333333-3333-4333-8333-333333333333";
const otherProjectId = "project-99999999-9999-4999-8999-999999999999";
const taskId = "task-44444444-4444-4444-4444-444444444444";
const datasetId = "dataset-55555555-5555-4555-8555-555555555555";
const editor = "editor@example.org";
const observer = "observer@example.org";

const task = (overrides: Partial<TaskGetResponse> = {}) =>
  ({
    created: "2026-01-02T02:00:00Z",
    done: true,
    exit_code: 0,
    purpose: "DATASET",
    purpose_id: datasetId,
    purpose_version: 2,
    states: [{ state: "SUCCESS", time: "2026-01-02T02:01:00Z" }],
    ...overrides,
  }) as TaskGetResponse;

const transient = new Response(null, { status: 503 });
const refused = new Response(null, { status: 403 });

test("a task that has not finished is pending and is still worth asking about", () => {
  const lifecycle = resolveResultTaskLifecycle({
    task: task({ done: false, exit_code: undefined }),
  });

  expect(lifecycle).toEqual({ kind: "pending" });
  expect(resultTaskPollInterval(lifecycle)).toBe(5000);
  // Nothing is known about a task whose own read has not answered yet, and an unanswered read is
  // not a poll: the request already in flight is what settles it.
  expect(resolveResultTaskLifecycle({})).toEqual({ kind: "unestablished" });
  expect(resultTaskPollInterval({ kind: "unestablished" })).toBe(false);
});

test("only a done task with a zero exit code and no failure state succeeded", () => {
  expect(resolveResultTaskLifecycle({ task: task() })).toEqual({ kind: "succeeded" });
  expect(resultTaskPollInterval({ kind: "succeeded" })).toBe(false);

  // A non-zero exit code is the Data Manager's own statement that the work failed.
  expect(resolveResultTaskLifecycle({ task: task({ exit_code: 3 }) })).toEqual({
    kind: "failed",
    reason: "This task failed with exit code 3.",
  });
  // A done task that reported no exit code at all never reads as success.
  expect(resolveResultTaskLifecycle({ task: task({ exit_code: undefined }) })).toEqual({
    kind: "failed",
    reason: "This task finished without reporting an exit code.",
  });
  // A domain failure outranks an exit code that would have read as success, and the Data Manager's
  // own words are what is said about it.
  expect(
    resolveResultTaskLifecycle({
      task: task({
        states: [
          { state: "STARTED", time: "2026-01-02T02:00:30Z" },
          {
            message: "Malformed molecule on line 4",
            state: "FAILURE",
            time: "2026-01-02T02:01:00Z",
          },
        ],
      }),
    }),
  ).toEqual({ kind: "failed", reason: "Malformed molecule on line 4" });
  expect(
    resolveResultTaskLifecycle({
      task: task({ states: [{ state: "FAILURE", time: "2026-01-02T02:01:00Z" }] }),
    }),
  ).toEqual({ kind: "failed", reason: "This task reported a failure." });
  expect(resultTaskPollInterval({ kind: "failed", reason: "any" })).toBe(false);
});

test("a progress read that failed transiently backs off; one that cannot be read stops", () => {
  const unconfirmed = resolveResultTaskLifecycle({ taskError: transient });
  expect(unconfirmed).toEqual({
    kind: "unconfirmed",
    reason: "This task's progress could not be read. It is still being checked.",
  });
  // A transient failure keeps checking, but not at the pace of an answering task.
  expect(resultTaskPollInterval(unconfirmed)).toBe(15_000);
  expect(resultTaskPollInterval(unconfirmed)).toBeGreaterThan(
    resultTaskPollInterval({ kind: "pending" }) as number,
  );

  // A refusal, an absence, or anything this client cannot interpret stops the poll rather than
  // asking forever, and is never reported as a finished task.
  for (const taskError of [refused, new Response(null, { status: 404 }), new Error("no status")]) {
    const unknown = resolveResultTaskLifecycle({ taskError });
    expect(unknown).toEqual({
      kind: "unknown",
      reason: "This task's progress could not be established. Retry to check it again.",
    });
    expect(resultTaskPollInterval(unknown)).toBe(false);
  }

  // A task that already settled stays settled: a later failed refresh cannot unsettle it, and a
  // failed refresh of a task still running does not turn it into a finished one either.
  expect(resolveResultTaskLifecycle({ task: task(), taskError: transient })).toEqual({
    kind: "succeeded",
  });
  expect(
    resolveResultTaskLifecycle({
      task: task({ done: false, exit_code: undefined }),
      taskError: transient,
    }),
  ).toEqual({
    kind: "unconfirmed",
    reason: "This task's progress could not be read. It is still being checked.",
  });
});

test("only a settled task accounts for itself; everything else is unestablished", () => {
  expect(resultTaskSettlement({ kind: "succeeded" })).toBe("settled");
  expect(resultTaskSettlement({ kind: "failed", reason: "any" })).toBe("settled");
  expect(resultTaskSettlement({ kind: "pending" })).toBe("pending");
  for (const lifecycle of [
    { kind: "unconfirmed", reason: "any" },
    { kind: "unestablished" },
    { kind: "unknown", reason: "any" },
  ] as const) {
    expect(resultTaskSettlement(lifecycle)).toBe("unestablished");
  }
  // A summary the project's own collection returned settles a task by exactly the same rule, so a
  // listed task and the addressed one never disagree about whether it is done.
  const summary = { done: true, exit_code: 0 } as TaskSummary;
  expect(resultTaskSettlement(resolveResultTaskLifecycle({ task: summary }))).toBe("settled");
  expect(
    resultTaskSettlement(resolveResultTaskLifecycle({ task: { ...summary, done: false } })),
  ).toBe("pending");
});

const project = (): ProjectCapabilityFacts["project"] => ({
  administrators: [],
  creator: editor,
  editors: [editor],
  observers: [observer],
});

const taskFacts = (
  overrides: Partial<ProjectResultTaskFacts> & { username?: string } = {},
): ProjectResultTaskFacts => {
  const { username = editor, ...rest } = overrides;
  return {
    caller: { username },
    owningProjectId: projectId,
    project: project(),
    routeProjectId: projectId,
    settlement: "settled",
    subscription: { accountsForInstances: true, atLimit: false },
    ...rest,
  };
};

test("deleting a task is withheld until the task itself accounts for being done", () => {
  expect(evaluateResultTaskDeletionCapability(taskFacts())).toEqual({ status: "enabled" });

  // The Data Manager will not delete a task until it is done, so a running one says so rather than
  // offering a request that can only be refused.
  expect(evaluateResultTaskDeletionCapability(taskFacts({ settlement: "pending" }))).toEqual({
    status: "disabled",
    reason: "This task is still running, so it cannot be deleted until it is done.",
  });
  expect(evaluateResultTaskDeletionCapability(taskFacts({ settlement: "unestablished" }))).toEqual({
    status: "disabled",
    reason:
      "This task's progress could not be established, so deleting it cannot be established as safe.",
  });

  // Project facts still decide first: authority and ownership are more useful explanations than
  // the task's own progress, and neither is overridden by it.
  expect(
    evaluateResultTaskDeletionCapability(taskFacts({ settlement: "pending", username: observer })),
  ).toEqual({
    status: "disabled",
    reason: "You must be a project editor or administrator to delete tasks in this project.",
  });
  expect(
    evaluateResultTaskDeletionCapability(
      taskFacts({ owningProjectId: otherProjectId, settlement: "pending" }),
    ),
  ).toEqual({
    status: "disabled",
    reason: "This result belongs to another project, so it cannot be changed from this project.",
  });
});

test("the task a caller is looking at is what decides its own delete action", () => {
  const facts = {
    caller: { username: editor },
    freshness: "current",
    project: project(),
    subscription: { accountsForInstances: true, atLimit: false },
  } as Parameters<typeof resolveResultCapabilities>[0];
  const capabilities = (taskSettlement?: "pending" | "settled" | "unestablished") =>
    resolveResultCapabilities(facts, {
      owningProjectId: projectId,
      routeProjectId: projectId,
      taskSettlement,
    });

  expect(capabilities("settled").taskDeletion).toEqual({ status: "enabled" });
  expect(capabilities("pending").taskDeletion).toEqual({
    status: "disabled",
    reason: "This task is still running, so it cannot be deleted until it is done.",
  });
  // A task's own progress is a fact about that task alone: it withholds nothing from the instances
  // and workflows displayed beside it.
  expect(capabilities("pending").termination).toEqual({ status: "enabled" });
  expect(capabilities("pending").archive).toEqual({ status: "enabled" });
  // A result with no task to account for is unchanged by the rule.
  expect(capabilities().taskDeletion).toEqual({ status: "enabled" });
});

test("a task's outputs are the ones the task itself names", () => {
  // A dataset task produced one concrete dataset version, addressed by the identity the task gave.
  expect(resultTaskOutput(task())).toEqual({
    dataset: { datasetId, version: 2 },
    projectFile: false,
  });
  expect(datasetLinks.version(datasetId, 2)).toBe(`/datasets/${datasetId}/versions/2`);

  // A file task's product is a file of the project that ran it, addressed inside that project. The
  // Data Manager only promises a Dataset UUID for a dataset task, so a file task names no dataset
  // here however dataset-shaped the identity it carries happens to look.
  expect(resultTaskOutput(task({ purpose: "FILE" }))).toEqual({ projectFile: true });
  expect(projectLinks.files(projectId)).toBe(`/projects/${projectId}/files`);

  // Nothing is addressed from an identity this client cannot address, so no link is ever built
  // from an unusable purpose.
  expect(resultTaskOutput(task({ purpose_id: "not-a-dataset" }))).toEqual({ projectFile: false });
  expect(resultTaskOutput(task({ purpose_version: undefined }))).toEqual({
    dataset: { datasetId },
    projectFile: false,
  });
  expect(resultTaskOutput(task({ purpose_version: 0 }))).toEqual({
    dataset: { datasetId },
    projectFile: false,
  });
  // A purpose Results does not list produces nothing to address.
  expect(resultTaskOutput(task({ purpose: "INSTANCE" }))).toEqual({ projectFile: false });
});

test("an addressed task is cached and refreshed under the project collection that placed it", () => {
  // The generated key factory is the only cache identity of the addressed task, and it is the same
  // key the project's own Results refresh invalidates, so a task cannot be refreshed by one route
  // and left stale in another.
  expect(getGetTaskQueryKey(taskId, undefined)).toEqual(getGetTaskQueryKey(taskId));
  expect(getGetTaskQueryKey(taskId)).not.toEqual(getGetTaskQueryKey("task-other"));
  // The collection that places a task always names the project, so the task's own read is only
  // ever reached through a project-constrained one.
  expect(getGetTasksQueryKey(resultListRequests(projectId).tasks)).not.toEqual(
    getGetTasksQueryKey(resultListRequests(otherProjectId).tasks),
  );
});

test("one module owns the addressed task read, its polling, and the deletion that follows it", () => {
  const root = path.join(process.cwd(), "src");

  // The hook that polled a task without a project is gone: a task is only read beneath the project
  // whose collection placed it.
  expect(existsSync(path.join(root, "hooks/usePolledGetTask.ts"))).toBe(false);

  const typescriptSource = /\.tsx?$/u;
  const generated = /(?:^|\/)generated\//u;
  const readsAddressedTask = /\buseGetTask\b/u;
  const readsTaskDirectly = readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && typescriptSource.test(entry.name))
    .map((entry) =>
      path.relative(root, path.join(entry.parentPath, entry.name)).split(path.sep).join("/"),
    )
    .filter((file) => !generated.test(file))
    .filter((file) => readsAddressedTask.test(readFileSync(path.join(root, file), "utf8")))
    .toSorted();

  // Results reads one addressed task in one place, so its polling rule cannot be decided twice.
  // Sections that have not been migrated into a project workspace still read their own tasks.
  const resultsOwned = /^(?:projects\/|components\/(?:results|tasks)\/)/u;
  expect(readsTaskDirectly.filter((file) => resultsOwned.test(file))).toEqual([
    "projects/useResultTask.ts",
  ]);

  // The task's delete stays with the one owner of Results mutations and their invalidation.
  const deleteButton = readFileSync(
    path.join(root, "components/tasks/DeleteTaskButton.tsx"),
    "utf8",
  );
  expect(deleteButton).toContain("useResultCommands");
  expect(deleteButton).not.toMatch(/useQueryClient|invalidateQueries|useDeleteTask/u);
});
