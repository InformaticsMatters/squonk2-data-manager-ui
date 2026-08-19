import { type FilesGetResponse } from "@/api/data-manager";
import {
  AppApiDatasetPostDatasetVersionMetaBody,
  AppApiDatasetPostDatasetVersionMetaResponse,
} from "@/api/data-manager/metadata/zod";

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { setTimeout as delay } from "node:timers/promises";
import { z } from "zod";

import { acceptanceEnvironment } from "../environment";
import {
  datasetContentFixtures,
  fixtureIds,
  type FixtureProjectFileSystem,
  projectFileSchemaFixture,
  projectSdfFixture,
} from "./fixtures";
import { cors, json, multipartField, readBody, record } from "./http";
import {
  type AttachmentRecord,
  type AttachmentTaskRecord,
  type LaunchFailureStatus,
  type ResultInstanceStage,
  type ResultTaskStage,
  type RunningWorkflowStage,
  type ScenarioState,
} from "./state";

/**
 * The Data Manager fixture: projects and their membership, files, datasets and versions, the run
 * catalogue, and the instance, task, and running-workflow lifecycles Results reads. Every stage a
 * scenario can put a resource in is decided here, so no test has to drive time itself.
 */

const LabelAnnotation = z.object({
  active: z.boolean(),
  label: z.string(),
  type: z.literal("LabelAnnotation"),
  value: z.string(),
});
/** The generated project resource's membership list each addressable role writes to. */
const membershipLists = {
  administrator: "administrators",
  editor: "editors",
  observer: "observers",
} as const;

const isMembershipRole = (segment: string): segment is keyof typeof membershipLists =>
  segment in membershipLists;

/** One file command rejection, so a refusal and a transport failure are told apart by status. */
const fileMutationFailure = (state: ScenarioState, response: ServerResponse) =>
  json(
    response,
    state.fileMutationFailure ?? 503,
    state.fileMutationFailure === 403
      ? state.fixtures.failures.forbidden
      : state.fixtures.failures.serverError,
  );

/** One project command rejection, so a refusal and a transport failure are told apart by status. */
const projectMutationFailure = (state: ScenarioState, response: ServerResponse) =>
  json(
    response,
    state.projectMutationFailure ?? 503,
    state.projectMutationFailure === 403
      ? state.fixtures.failures.forbidden
      : state.fixtures.failures.serverError,
  );

/**
 * How the Data Manager answers each launch it will not accept. Every verdict answers in its own
 * words, so a refusal of the caller's authority, a refusal of what they entered, and a transport
 * failure that decides neither are told apart by what is shown as well as by status. The one map is
 * what a control accepts, what the state may hold, and what a rejected launch is answered with.
 */
const launchFailures: Record<LaunchFailureStatus, keyof ScenarioState["fixtures"]["failures"]> = {
  400: "badRequest",
  403: "forbidden",
  429: "rateLimited",
  503: "serverError",
};

export const isLaunchFailureStatus = (status: number): status is LaunchFailureStatus =>
  status in launchFailures;

/**
 * What the Data Manager does before it will answer a launch at all: hold it for as long as the
 * scenario says, then refuse it if the scenario refuses launches. Both launch endpoints ask here,
 * so neither can be held or refused on terms of its own.
 */
const launchGate = async (state: ScenarioState, response: ServerResponse) => {
  if (state.launchDelay) {
    await delay(state.launchDelay);
  }
  if (!state.launchFailure) {
    return false;
  }
  json(response, state.launchFailure, state.fixtures.failures[launchFailures[state.launchFailure]]);
  return true;
};

/** The filesystem one project holds. A project the fixtures gave no files starts out empty. */
const projectFileSystem = (state: ScenarioState, projectId: string): FixtureProjectFileSystem =>
  (state.fixtures.projectFiles[projectId] ??= { directories: [], files: [] });

/** The dataset version one attachment names, or nothing when it named a version nobody holds. */
const attachedDatasetVersion = (state: ScenarioState, attachment: AttachmentRecord) =>
  state.fixtures.dataset.datasets
    .find((dataset) => dataset.dataset_id === attachment.dataset_id)
    ?.versions.find((version) => version.version === attachment.dataset_version);

/**
 * What a settled attachment task does: the version becomes a managed file of the project it was
 * attached to, in the directory it named, and the project joins the version's own attachment state.
 */
const completeAttachment = (state: ScenarioState, task: AttachmentTaskRecord, owner: string) => {
  const system = projectFileSystem(state, task.project_id);
  if (task.path !== "/" && !system.directories.includes(task.path)) {
    system.directories.push(task.path);
  }
  system.files = [
    ...system.files.filter(
      (file) => !(file.path === task.path && file.file_name === task.fileName),
    ),
    {
      file_id: task.fileId,
      file_name: task.fileName,
      immutable: task.immutable,
      mime_type: task.as_type,
      owner,
      path: task.path,
      size: 2048,
    },
  ];
  const attached = attachedDatasetVersion(state, task);
  if (attached && !attached.projects.includes(task.project_id)) {
    attached.projects.push(task.project_id);
  }
};

/** The directory holding one absolute path; the root holds itself. */
const holdingDirectory = (path: string) => {
  const parts = path.split("/").filter(Boolean);
  return parts.length <= 1 ? "/" : `/${parts.slice(0, -1).join("/")}`;
};

const nameOf = (path: string) => path.split("/").findLast((part) => part !== "") ?? "";

/** One directory listing, in the shape the generated `FilesGetResponse` declares. */
const listProjectFiles = (
  system: FixtureProjectFileSystem,
  projectId: string,
  path: string,
): FilesGetResponse => {
  const held = system.files.filter((file) => file.path === path);
  return {
    count: held.length,
    files: held.map(({ path: _path, size, ...file }) => ({
      ...file,
      stat: { modified: "2026-01-02T03:04:05Z", size },
    })),
    path,
    paths: system.directories
      .filter((directory) => holdingDirectory(directory) === path)
      .map((directory) => nameOf(directory)),
    project_id: projectId,
  };
};

/** The named text fields of an upload, which is what a test can hold the request to. */
const uploadFieldNames = [
  "as_filename",
  "dataset_id",
  "dataset_type",
  "format_extra_variables",
  "unit_id",
] as const;

export const multipartFields = (
  body: string,
): Partial<Record<(typeof uploadFieldNames)[number], string>> =>
  Object.fromEntries(
    uploadFieldNames.flatMap((name) => {
      const value = multipartField(body, name);
      return value === undefined ? [] : [[name, value]];
    }),
  );

/** Everything at or beneath one directory, which is what deleting or moving it must carry. */
const beneath = (path: string, candidate: string) =>
  candidate === path || candidate.startsWith(`${path}/`);

/**
 * How an instance presents at each stage. One record answers for both the summary its project's
 * collection returns and the instance's own read, so a listed instance and the addressed one can
 * never disagree about what the Data Manager would do with it.
 */
const instanceStages = {
  done: { errorMessage: undefined, phase: "COMPLETED", stopped: "2026-01-02T03:05:05Z" },
  failed: {
    errorMessage: "The job image exited with code 4.",
    phase: "FAILED",
    stopped: "2026-01-02T03:05:05Z",
  },
  // A successful phase with a recorded error: the case a phase alone reads as completed work.
  rejected: {
    errorMessage: "The job wrote none of its outputs.",
    phase: "COMPLETED",
    stopped: "2026-01-02T03:05:05Z",
  },
  running: { errorMessage: undefined, phase: "RUNNING", stopped: undefined },
  // An instance the cluster could not start: neither running nor finished.
  stalled: { errorMessage: undefined, phase: "IMAGE_PULL_BACKOFF", stopped: undefined },
  // The Data Manager's own account of an instance it cannot place.
  unrecognised: { errorMessage: undefined, phase: "UNKNOWN", stopped: undefined },
} as const satisfies Record<ResultInstanceStage, unknown>;

/** One instance, presented at the stage the scenario put it in. */
const atInstanceStage = (
  state: ScenarioState,
  instance: (typeof state.fixtures.instances.instances)[number],
) => {
  const stage = instanceStages[state.instanceStage];
  return {
    ...instance,
    error_message: stage.errorMessage,
    phase: stage.phase,
    stopped: stage.stopped,
  };
};

/**
 * The project one read answers with, or `undefined` once a settled deletion removed it. A deleted
 * project is absent rather than altered, so every later read of it — its own, and the caller's
 * index — answers exactly as it would for a project that never existed.
 */
const addressableProject = (state: ScenarioState, projectId: string) =>
  state.deletedProjects.includes(projectId)
    ? undefined
    : state.fixtures.projects.projects.find((candidate) => candidate.project_id === projectId);

/** Every instance a project still owns, at the stage the scenario put them in. */
const instancesOf = (state: ScenarioState, projectId: string) => {
  const instances = state.fixtures.instances.instances
    .filter((instance) => instance.project_id === projectId)
    .filter((instance) => !state.deletedInstances.includes(instance.id))
    .map((instance) => atInstanceStage(state, instance));
  return { count: instances.length, instances };
};

/** The instance one addressed read answers with, or `undefined` when it is gone. */
const addressedInstance = (state: ScenarioState, instanceId: string) =>
  state.deletedInstances.includes(instanceId)
    ? undefined
    : state.fixtures.instances.instances.find((candidate) => candidate.id === instanceId);

/**
 * How a result task presents at each stage. One record answers for both the summary its project's
 * collection returns and the task's own read, so a listed task and the addressed one can never
 * disagree about whether it is done.
 */
const resultTaskStages = {
  done: { done: true, exitCode: 0, processingStage: "DONE", states: [{ state: "SUCCESS" }] },
  failed: {
    done: true,
    exitCode: 4,
    processingStage: "FAILED",
    states: [{ state: "FAILURE", message: "The dataset could not be loaded." }],
  },
  // A zero exit code with a recorded domain failure: the case an exit code alone reads as success.
  rejected: {
    done: true,
    exitCode: 0,
    processingStage: "FAILED",
    states: [{ state: "FAILURE", message: "Molecule 4 could not be parsed." }],
  },
  running: {
    done: false,
    exitCode: undefined,
    processingStage: "LOADING",
    states: [{ state: "STARTED" }],
  },
} as const satisfies Record<ResultTaskStage, unknown>;

/** Every result task a project still owns, presented at the stage the scenario put them in. */
const resultTasksOf = (state: ScenarioState, projectId: string) => {
  const owned = Object.entries(state.fixtures.resultTasks).find(
    ([owner]) => owner === projectId,
  )?.[1] ?? { count: 0, tasks: [] };
  const stage = resultTaskStages[state.resultTaskStage];
  const tasks = owned.tasks
    .filter((task) => !state.deletedResultTasks.includes(task.id))
    .map((task) => ({
      ...task,
      done: stage.done,
      exit_code: stage.exitCode,
      processing_stage: stage.processingStage,
    }));
  return { count: tasks.length, tasks };
};

/**
 * How a running workflow presents at each stage. One record answers for both the summary its
 * project's collection returns and the workflow's own read, so a listed workflow and the addressed
 * one can never disagree about what the Data Manager will do with it.
 */
const runningWorkflowStages = {
  done: { errorNum: 0, status: "SUCCESS", stopped: "2026-01-02T04:14:05Z" },
  failed: {
    errorMsg: "Step 2 could not be scheduled.",
    errorNum: 3,
    status: "FAILURE",
    stopped: "2026-01-02T04:14:05Z",
  },
  // A successful status with a recorded error: the case a status alone reads as a completed run.
  rejected: {
    errorMsg: "Step 2 produced no output.",
    errorNum: 5,
    status: "SUCCESS",
    stopped: "2026-01-02T04:14:05Z",
  },
  running: { errorNum: 0, status: "RUNNING", stopped: undefined },
  stopped: { errorNum: 0, status: "USER_STOPPED", stopped: "2026-01-02T04:14:05Z" },
  // A status outside the ones the Data Manager documents, so a client that cannot interpret what
  // it was told is observable rather than only arguable.
  unrecognised: { errorNum: 0, status: "PAUSED", stopped: undefined },
} as const satisfies Record<RunningWorkflowStage, unknown>;

/** One running workflow, presented at the stage the scenario put it in. */
const atRunningWorkflowStage = (
  state: ScenarioState,
  workflow: (typeof state.fixtures.runningWorkflows.running_workflows)[number],
) => {
  const stage = runningWorkflowStages[state.runningWorkflowStage];
  return {
    ...workflow,
    error_msg: "errorMsg" in stage ? stage.errorMsg : undefined,
    error_num: stage.errorNum,
    status: stage.status,
    stopped: stage.stopped,
  };
};

/** Every running workflow a project still owns, at the stage the scenario put them in. */
const runningWorkflowsOf = (state: ScenarioState, projectId: string) => {
  const workflows = state.fixtures.runningWorkflows.running_workflows
    .filter((workflow) => workflow.project.id === projectId)
    .filter((workflow) => !state.deletedRunningWorkflows.includes(workflow.id))
    .map((workflow) => atRunningWorkflowStage(state, workflow));
  return { count: workflows.length, running_workflows: workflows };
};

/** The running workflow one addressed read answers with, or `undefined` when it is gone. */
const addressedRunningWorkflow = (state: ScenarioState, runningWorkflowId: string) =>
  state.deletedRunningWorkflows.includes(runningWorkflowId)
    ? undefined
    : state.fixtures.runningWorkflows.running_workflows.find(
        (candidate) => candidate.id === runningWorkflowId,
      );

/** The result task one addressed read answers with, or `undefined` when no project owns it. */
const addressedResultTask = (state: ScenarioState, taskId: string) =>
  state.deletedResultTasks.includes(taskId)
    ? undefined
    : Object.values(state.fixtures.resultTasks)
        .flatMap((collection) => collection.tasks)
        .find((candidate) => candidate.id === taskId);
const handleDataManager = async (request: IncomingMessage, response: ServerResponse) => {
  cors(request, response);
  if (request.method === "OPTIONS") {
    return response.end();
  }
  const url = new URL(request.url ?? "/", acceptanceEnvironment.DATA_MANAGER_API_SERVER);
  const { state, subject } = record(request, url);
  const segments = url.pathname.split("/").filter(Boolean);
  if (url.pathname === "/dataset" && request.method === "GET") {
    if (state.datasetFailure) {
      return json(response, state.datasetFailure, state.fixtures.failures.serverError);
    }
    return json(response, 200, state.fixtures.dataset);
  }
  // A dataset made from a project file. The project, path, file, and billing unit are all sent, so
  // a request that named the wrong project or no unit is recognisable rather than silently served.
  if (url.pathname === "/dataset" && request.method === "PUT") {
    const form = new URLSearchParams((await readBody(request)).toString());
    if (state.datasetMutationFailure) {
      return json(response, state.datasetMutationFailure, state.fixtures.failures.forbidden);
    }
    const projectId = form.get("project_id") ?? "";
    const system = projectFileSystem(state, projectId);
    const held = system.files.find(
      (file) => file.path === form.get("path") && file.file_name === form.get("file_name"),
    );
    if (!held || !form.get("unit_id")) {
      return json(response, 400, { error: "fixture-dataset-source-not-found" });
    }
    return json(response, 201, {
      dataset_id: fixtureIds.dataset,
      dataset_version: 1,
      task_id: fixtureIds.task,
    });
  }
  if (url.pathname === "/dataset" && request.method === "POST") {
    const body = await readBody(request);
    state.upload = { body, contentType: request.headers["content-type"] ?? "" };
    if (state.uploadFailure) {
      return json(
        response,
        state.uploadFailure,
        state.uploadFailure === 403
          ? state.fixtures.failures.forbidden
          : state.fixtures.failures.serverError,
      );
    }
    // Every accepted upload gets its own task, exactly as the Data Manager issues one, so a retry
    // is never answered by the task its previous attempt already settled.
    const taskId =
      state.uploadTaskIds.length === 0
        ? fixtureIds.task
        : `task-55555555-5555-5555-5555-${String(state.uploadTaskIds.length).padStart(12, "0")}`;
    state.uploadTaskIds.push(taskId);
    // An upload that named a dataset is a new version of it, and the fields it carried are what
    // that version will be, so a request that dropped the name or the type is recognisable rather
    // than believable once the version appears.
    const uploadFields = multipartFields(body.toString());
    if (uploadFields.dataset_id) {
      state.versionUploadTasks.set(taskId, {
        datasetId: uploadFields.dataset_id,
        fileName: uploadFields.as_filename ?? "uploaded",
        type: uploadFields.dataset_type ?? "",
      });
    }
    return json(response, 202, { ...state.fixtures.uploadResponse, task_id: taskId });
  }
  if (
    url.pathname === `/dataset/${fixtureIds.dataset}/meta/1` ||
    url.pathname === `/dataset/${fixtureIds.dataset}/meta/2`
  ) {
    if (state.datasetMutationFailure) {
      return json(response, state.datasetMutationFailure, state.fixtures.failures.forbidden);
    }
    const datasetVersion = Number(url.pathname.split("/").at(-1));
    const form = new URLSearchParams((await readBody(request)).toString());
    const body = AppApiDatasetPostDatasetVersionMetaBody.parse(Object.fromEntries(form));
    const annotations = z.array(LabelAnnotation).parse(JSON.parse(body.annotations ?? "[]"));
    const version = state.fixtures.dataset.datasets[0].versions.find(
      (candidate) => candidate.version === datasetVersion,
    );
    if (!version) {
      return json(response, 404, { error: "fixture-version-not-found" });
    }
    const labels = (version.labels ?? {}) as Record<string, string[]>;
    for (const annotation of annotations) {
      const values = labels[annotation.label] ?? [];
      labels[annotation.label] = annotation.active
        ? [...new Set([...values, annotation.value])]
        : values.filter((value) => value !== annotation.value);
      if (labels[annotation.label].length === 0) {
        delete labels[annotation.label];
      }
    }
    version.labels = labels;
    return json(
      response,
      200,
      AppApiDatasetPostDatasetVersionMetaResponse.parse({
        annotations,
        created: version.published,
        created_by: version.owner,
        dataset_id: fixtureIds.dataset,
        dataset_name: version.file_name,
        description: "Acceptance dataset metadata",
        labels: Object.entries(labels),
        last_updated: version.published,
        metadata_version: String(datasetVersion),
      }),
    );
  }
  if (url.pathname.startsWith(`/dataset/${fixtureIds.dataset}/editor/`)) {
    if (state.datasetMutationFailure) {
      return json(response, state.datasetMutationFailure, state.fixtures.failures.forbidden);
    }
    const username = decodeURIComponent(url.pathname.split("/").at(-1) ?? "");
    const editors = state.fixtures.dataset.datasets[0].editors;
    if (request.method === "PUT" && !editors.includes(username)) {
      editors.push(username);
    }
    if (request.method === "DELETE") {
      state.fixtures.dataset.datasets[0].editors = editors.filter((editor) => editor !== username);
    }
    return json(response, 204, undefined);
  }
  // Attaching a dataset version to a project. The Data Manager accepts the request and issues a
  // task; the file only exists in the project once that task has settled, so the fixture creates it
  // there then rather than at acceptance. Every field the caller chose is kept, so a request that
  // dropped the path, the type, or a flag is recognisable rather than believable.
  if (url.pathname === "/file" && request.method === "POST") {
    const form = new URLSearchParams((await readBody(request)).toString());
    const attachment: AttachmentRecord = {
      as_type: form.get("as_type") ?? "",
      compress: form.get("compress") === "true",
      dataset_id: form.get("dataset_id") ?? "",
      dataset_version: Number(form.get("dataset_version")),
      immutable: form.get("immutable") === "true",
      path: form.get("path") ?? "/",
      project_id: form.get("project_id") ?? "",
    };
    state.attachments.push(attachment);
    if (state.attachFailure) {
      const failures = state.fixtures.failures;
      return json(
        response,
        state.attachFailure,
        state.attachFailure === 400
          ? failures.badRequest
          : state.attachFailure === 403
            ? failures.forbidden
            : failures.serverError,
      );
    }
    const target = state.fixtures.projects.projects.find(
      (candidate) => candidate.project_id === attachment.project_id,
    );
    const attached = attachedDatasetVersion(state, attachment);
    if (!target || !attached) {
      return json(response, 404, { error: "fixture-attachment-target-not-found" });
    }
    const sequence = String(state.attachmentTasks.size + 1).padStart(12, "0");
    const taskId = `task-66666666-6666-4666-8666-${sequence}`;
    const fileId = `file-66666666-6666-4666-8666-${sequence}`;
    const fileName = attachment.compress ? `${attached.file_name}.gz` : attached.file_name;
    state.attachmentTasks.set(taskId, { ...attachment, fileId, fileName });
    state.attachmentPollingIndexes.set(taskId, 0);
    return json(response, 202, {
      file_id: fileId,
      file_name: fileName,
      file_path: attachment.path,
      task_id: taskId,
    });
  }
  // A project's files. Every read and every change names the project and the path it acts on, so a
  // request that named neither, or named another project, is answered as such rather than served
  // from whichever project the fixtures list first.
  if (url.pathname === "/file" && request.method === "GET") {
    const projectId = url.searchParams.get("project_id");
    const path = url.searchParams.get("path") ?? "/";
    if (!projectId) {
      return json(response, 400, { error: "fixture-files-project-required" });
    }
    if (state.filesFailure) {
      return json(
        response,
        state.filesFailure,
        state.filesFailure === 403
          ? state.fixtures.failures.forbidden
          : state.fixtures.failures.serverError,
      );
    }
    const system = projectFileSystem(state, projectId);
    if (path !== "/" && !system.directories.includes(path)) {
      return json(response, 404, { error: "fixture-path-not-found" });
    }
    return json(response, 200, listProjectFiles(system, projectId, path));
  }
  if (url.pathname === "/file" && request.method === "DELETE") {
    const projectId = url.searchParams.get("project_id") ?? "";
    const path = url.searchParams.get("path") ?? "/";
    const fileName = url.searchParams.get("file");
    if (state.fileMutationFailure) {
      return fileMutationFailure(state, response);
    }
    const system = projectFileSystem(state, projectId);
    system.files = system.files.filter(
      (file) => !(file.path === path && file.file_name === fileName && !file.file_id),
    );
    return json(response, 204, undefined);
  }
  if (url.pathname === "/file/move" && request.method === "PUT") {
    const projectId = url.searchParams.get("project_id") ?? "";
    if (state.fileMutationFailure) {
      return fileMutationFailure(state, response);
    }
    const system = projectFileSystem(state, projectId);
    const moved = system.files.find(
      (file) =>
        file.path === url.searchParams.get("src_path") &&
        file.file_name === url.searchParams.get("file"),
    );
    if (!moved) {
      return json(response, 404, { error: "fixture-file-not-found" });
    }
    moved.path = url.searchParams.get("dst_path") ?? "/";
    moved.file_name = url.searchParams.get("dst_file") ?? moved.file_name;
    return json(response, 204, undefined);
  }
  if (segments[0] === "file" && segments.length === 2 && request.method === "DELETE") {
    if (state.fileMutationFailure) {
      return fileMutationFailure(state, response);
    }
    // A managed file is detached from whichever project holds it, and the dataset it came from is
    // untouched, exactly as the Data Manager treats it.
    for (const system of Object.values(state.fixtures.projectFiles)) {
      if (system) {
        system.files = system.files.filter((file) => file.file_id !== segments[1]);
      }
    }
    return json(response, 204, undefined);
  }
  if (url.pathname === "/path" && (request.method === "PUT" || request.method === "DELETE")) {
    const projectId = url.searchParams.get("project_id") ?? "";
    const path = url.searchParams.get("path") ?? "";
    if (state.fileMutationFailure) {
      return fileMutationFailure(state, response);
    }
    const system = projectFileSystem(state, projectId);
    if (request.method === "PUT") {
      if (system.directories.includes(path)) {
        return json(response, 409, { error: "fixture-path-exists" });
      }
      system.directories.push(path);
      return json(response, 201, undefined);
    }
    system.directories = system.directories.filter((directory) => !beneath(path, directory));
    system.files = system.files.filter((file) => !beneath(path, file.path));
    return json(response, 204, undefined);
  }
  if (url.pathname === "/path/move" && request.method === "PUT") {
    const projectId = url.searchParams.get("project_id") ?? "";
    const source = url.searchParams.get("src_path") ?? "";
    const destination = url.searchParams.get("dst_path") ?? "";
    if (state.fileMutationFailure) {
      return fileMutationFailure(state, response);
    }
    const system = projectFileSystem(state, projectId);
    if (!system.directories.includes(source)) {
      return json(response, 404, { error: "fixture-path-not-found" });
    }
    const rewrite = (path: string) =>
      beneath(source, path) ? destination + path.slice(source.length) : path;
    system.directories = system.directories.map((directory) => rewrite(directory));
    for (const file of system.files) {
      file.path = rewrite(file.path);
    }
    return json(response, 204, undefined);
  }
  if (segments[0] === "project" && segments.length === 3 && segments[2] === "file") {
    const projectId = segments[1];
    const system = projectFileSystem(state, projectId);
    if (request.method === "PUT") {
      const body = (await readBody(request)).toString();
      if (state.fileMutationFailure) {
        return fileMutationFailure(state, response);
      }
      // The upload is multipart, so the two fields the destination depends on are read out of it
      // rather than assumed: a file must land in the project and directory that were sent.
      const fileName = multipartField(body, "as_filename") ?? "uploaded";
      const path = multipartField(body, "path") ?? "/";
      system.files = [
        ...system.files.filter((file) => !(file.path === path && file.file_name === fileName)),
        { file_name: fileName, mime_type: "text/plain", owner: subject, path, size: 4 },
      ];
      return json(response, 201, undefined);
    }
    const fileName = url.searchParams.get("file") ?? "";
    const path = url.searchParams.get("path") ?? "/";
    if (state.fileContentFailure) {
      return json(
        response,
        state.fileContentFailure,
        state.fileContentFailure === 403
          ? state.fixtures.failures.forbidden
          : state.fixtures.failures.serverError,
      );
    }
    const held = system.files.find((file) => file.path === path && file.file_name === fileName);
    if (!held) {
      return json(response, 404, { error: "fixture-file-not-found" });
    }
    // A file's bytes are the bytes of its own kind: a schema describes the SDF beside it, and an
    // SDF holds records a parser can actually read, so a viewer is exercised against what it
    // claims to display rather than against a placeholder every file shares. The type is the one
    // the listing gives the file, so a browser shown the bytes is shown them as that type.
    if (fileName.endsWith(".schema.json")) {
      return json(response, 200, projectFileSchemaFixture);
    }
    response.writeHead(200, { "content-type": held.mime_type ?? "application/octet-stream" });
    return response.end(fileName.endsWith(".sdf") ? projectSdfFixture : `acceptance ${fileName}`);
  }
  if (url.pathname === "/project") {
    if (request.method === "POST") {
      const form = new URLSearchParams((await readBody(request)).toString());
      if (state.projectCreationFailure) {
        return json(
          response,
          state.projectCreationFailure,
          state.projectCreationFailure === 400
            ? { error: "fixture-project-domain-failure" }
            : state.fixtures.failures.serverError,
        );
      }
      if (form.get("tier_product_id") !== state.createdProduct?.product.id) {
        return json(response, 400, { error: "fixture-subscription-not-found" });
      }
      // The creator holds the project outright, and its ancestry is the subscription's own, so a
      // project created in a personal unit belongs to the default organisation that houses it.
      state.createdProject = {
        administrators: [state.fixtures.subject],
        created: "2026-01-02T03:04:05Z",
        creator: state.fixtures.subject,
        editors: [state.fixtures.subject],
        files: [],
        name: form.get("name") ?? "Created project",
        observers: [],
        organisation_id: state.createdProduct.organisation.id,
        private: form.get("private") === "true",
        product_id: state.createdProduct.product.id,
        project_id: fixtureIds.createdProject,
        size: 0,
        unit_id: state.createdProduct.unit.id,
      };
      state.createdProduct.claim = {
        id: fixtureIds.createdProject,
        name: state.createdProject.name,
      };
      if (state.projectCreationResponseDelay) {
        await delay(state.projectCreationResponseDelay);
      }
      return json(response, 201, { project_id: fixtureIds.createdProject });
    }
    if (state.projectCollectionFailure) {
      return json(
        response,
        state.projectCollectionFailure,
        state.projectCollectionFailure === 403
          ? state.fixtures.failures.forbidden
          : state.fixtures.failures.serverError,
      );
    }
    const projects = (
      state.createdProject
        ? [...state.fixtures.projects.projects, state.createdProject]
        : state.fixtures.projects.projects
    ).filter((project) => !state.deletedProjects.includes(project.project_id));
    return json(response, 200, { count: projects.length, projects });
  }
  // Results collections. Each answers for exactly the project it was asked about, and a request
  // that named no project is refused, because the Data Manager is never asked for global results.
  if (
    ["/instance", "/task", "/running-workflow"].includes(url.pathname) &&
    request.method === "GET"
  ) {
    const projectId = url.searchParams.get("project_id");
    if (!projectId) {
      return json(response, 400, { error: "fixture-unscoped-results-request" });
    }
    const failure = state.resultsFailures.find(
      ({ collection }) => !collection || collection === url.pathname,
    );
    if (failure) {
      return json(
        response,
        failure.status,
        failure.status === 403
          ? state.fixtures.failures.forbidden
          : state.fixtures.failures.serverError,
      );
    }
    if (url.pathname === "/instance") {
      return json(response, 200, instancesOf(state, projectId));
    }
    if (url.pathname === "/task") {
      return json(response, 200, resultTasksOf(state, projectId));
    }
    return json(response, 200, runningWorkflowsOf(state, projectId));
  }
  // An addressed result read can be made to fail on its own path, so a stale addressed result is
  // distinguishable from a stale collection.
  if (
    ["instance", "running-workflow"].includes(segments[0] ?? "") &&
    segments.length === 2 &&
    request.method === "GET"
  ) {
    const failure = state.resultsFailures.find(({ collection }) => collection === url.pathname);
    if (failure) {
      return json(
        response,
        failure.status,
        failure.status === 403
          ? state.fixtures.failures.forbidden
          : state.fixtures.failures.serverError,
      );
    }
  }
  // An instance is terminated while it is running and deleted once it has finished, and archived
  // either way, so all three requests answer for the same addressed instance.
  if (
    segments[0] === "instance" &&
    segments.length === 2 &&
    (request.method === "DELETE" || request.method === "PATCH")
  ) {
    const instance = addressedInstance(state, segments[1] ?? "");
    if (!instance) {
      return json(response, 404, { error: "fixture-instance-not-found" });
    }
    if (state.instanceCommandFailure) {
      return json(
        response,
        state.instanceCommandFailure,
        state.instanceCommandFailure === 403
          ? state.fixtures.failures.forbidden
          : state.fixtures.failures.serverError,
      );
    }
    if (request.method === "DELETE") {
      state.deletedInstances.push(instance.id);
    } else {
      // Archiving only changes whether the instance is protected from automatic deletion; it stays
      // exactly where it is in the project that owns it.
      instance.archived = url.searchParams.get("archive") === "true";
    }
    response.writeHead(204).end();
    return;
  }
  if (segments[0] === "instance" && segments.length === 2 && request.method === "GET") {
    const instance = addressedInstance(state, segments[1] ?? "");
    if (!instance) {
      return json(response, 404, { error: "fixture-instance-not-found" });
    }
    if (state.instanceFailure) {
      const failure = {
        403: state.fixtures.failures.forbidden,
        404: { error: "fixture-instance-not-found" },
        503: state.fixtures.failures.serverError,
      }[state.instanceFailure];
      return json(response, state.instanceFailure, failure);
    }
    const instanceTask =
      instance.project_id === fixtureIds.project
        ? fixtureIds.resultTask
        : fixtureIds.screeningResultTask;
    return json(response, 200, {
      ...atInstanceStage(state, instance),
      has_valid_callback_token: false,
      outputs: instance.outputs ?? {},
      tasks: [{ id: instanceTask, purpose: "CREATE" }],
    });
  }
  if (segments[0] === "running-workflow" && segments[2] === "steps") {
    if (state.runningWorkflowStepsFailure) {
      return json(
        response,
        state.runningWorkflowStepsFailure,
        state.runningWorkflowStepsFailure === 403
          ? state.fixtures.failures.forbidden
          : state.fixtures.failures.serverError,
      );
    }
    const steps = Object.entries(state.fixtures.runningWorkflowSteps).find(
      ([runningWorkflowId]) => runningWorkflowId === segments[1],
    )?.[1] ?? { count: 0, running_workflow_steps: [] };
    return json(response, 200, steps);
  }
  // A running workflow is stopped while it is running and deleted once it has finished, so both
  // requests answer for the same addressed workflow.
  if (
    segments[0] === "running-workflow" &&
    ((segments.length === 2 && request.method === "DELETE") ||
      (segments[2] === "stop" && request.method === "PUT"))
  ) {
    const workflow = addressedRunningWorkflow(state, segments[1] ?? "");
    if (!workflow) {
      return json(response, 404, { error: "fixture-running-workflow-not-found" });
    }
    if (state.runningWorkflowCommandFailure) {
      return json(
        response,
        state.runningWorkflowCommandFailure,
        state.runningWorkflowCommandFailure === 403
          ? state.fixtures.failures.forbidden
          : state.fixtures.failures.serverError,
      );
    }
    if (request.method === "DELETE") {
      state.deletedRunningWorkflows.push(workflow.id);
    } else {
      // A stopped workflow keeps its place in the project; only its own account of itself changes.
      state.runningWorkflowStage = "stopped";
    }
    response.writeHead(204).end();
    return;
  }
  if (segments[0] === "running-workflow" && segments.length === 2 && request.method === "GET") {
    const workflow = addressedRunningWorkflow(state, segments[1] ?? "");
    if (!workflow) {
      return json(response, 404, { error: "fixture-running-workflow-not-found" });
    }
    if (state.runningWorkflowFailure) {
      const failure = {
        403: state.fixtures.failures.forbidden,
        404: { error: "fixture-running-workflow-not-found" },
        503: state.fixtures.failures.serverError,
      }[state.runningWorkflowFailure];
      return json(response, state.runningWorkflowFailure, failure);
    }
    const staged = atRunningWorkflowStage(state, workflow);
    return json(response, 200, {
      ...staged,
      done: staged.status !== "RUNNING",
      running_user: state.fixtures.subject,
      success: staged.status === "SUCCESS",
      variables: {},
    });
  }
  // Every project membership list is addressed the same way, so one handler answers for all three
  // and a test cannot accidentally exercise a role the fixture treats specially.
  if (segments[0] === "project" && segments.length === 4 && isMembershipRole(segments[2])) {
    if (state.projectMutationFailure) {
      return projectMutationFailure(state, response);
    }
    const project = state.fixtures.projects.projects.find(
      (candidate) => candidate.project_id === segments[1],
    );
    if (!project) {
      return json(response, 404, { error: "fixture-project-not-found" });
    }
    const username = decodeURIComponent(segments[3]);
    const list = membershipLists[segments[2]];
    project[list] =
      request.method === "PUT"
        ? [...new Set([...project[list], username])]
        : project[list].filter((member) => member !== username);
    return json(response, 204, undefined);
  }
  if (segments[0] === "project" && segments.length === 2 && request.method === "PATCH") {
    // The body is drained before anything else answers, so a refused command leaves no unread
    // request behind on a connection the next one reuses.
    const form = new URLSearchParams((await readBody(request)).toString());
    if (state.projectMutationFailure) {
      return projectMutationFailure(state, response);
    }
    // A patch changes the project it addressed, so a command that named the wrong one would be
    // recognisable rather than silently applied to whichever project the fixture lists first.
    const project = state.fixtures.projects.projects.find(
      (candidate) => candidate.project_id === segments[1],
    );
    if (!project) {
      return json(response, 404, { error: "fixture-project-not-found" });
    }
    const isPrivate = form.get("private");
    if (isPrivate !== null) {
      project.private = isPrivate === "true";
    }
    return json(response, 200, project);
  }
  // A project the caller asked the Data Manager to delete. The request answers with the task that
  // will do the work, so nothing about the project changes until that task settles.
  if (segments[0] === "project" && segments.length === 2 && request.method === "DELETE") {
    if (state.projectDeletionFailure) {
      return json(
        response,
        state.projectDeletionFailure,
        state.projectDeletionFailure === 400
          ? { error: "fixture-project-deletion-domain-failure" }
          : state.projectDeletionFailure === 403
            ? state.fixtures.failures.forbidden
            : state.fixtures.failures.serverError,
      );
    }
    const deleted = addressableProject(state, segments[1] ?? "");
    if (!deleted) {
      return json(response, 404, { error: "fixture-project-not-found" });
    }
    state.projectDeletionPollingIndexes.set(fixtureIds.projectDeletionTask, 0);
    state.projectDeletionTasks.set(fixtureIds.projectDeletionTask, deleted.project_id);
    return json(response, 200, { task_id: fixtureIds.projectDeletionTask });
  }
  if (url.pathname === `/project/${fixtureIds.project}` && request.method === "GET") {
    if (state.projectFailure) {
      const body =
        state.projectFailure === 403
          ? state.fixtures.failures.forbidden
          : state.projectFailure === 503
            ? state.fixtures.failures.serverError
            : { error: "fixture-not-found" };
      return json(response, state.projectFailure, body);
    }
    const acceptanceProject = addressableProject(state, fixtureIds.project);
    return acceptanceProject
      ? json(response, 200, acceptanceProject)
      : json(response, 404, { error: "fixture-project-not-found" });
  }
  if (url.pathname === `/project/${fixtureIds.createdProject}` && state.createdProject) {
    return json(response, 200, state.createdProject);
  }
  // Every other project answers for itself, so a project reached by following a link built from an
  // attachment or a result is served exactly as the collection listed it.
  if (segments[0] === "project" && segments.length === 2 && request.method === "GET") {
    const addressed = addressableProject(state, segments[1] ?? "");
    return addressed
      ? json(response, 200, addressed)
      : json(response, 404, { error: "fixture-project-not-found" });
  }
  // The Run catalogue. Jobs are scoped by project, so a request that names no project is refused;
  // applications and workflow definitions are catalogues the Data Manager does not scope.
  if (["/application", "/job", "/workflow"].includes(url.pathname) && request.method === "GET") {
    if (url.pathname === "/job" && !url.searchParams.get("project_id")) {
      return json(response, 400, { error: "fixture-unscoped-job-request" });
    }
    const failure = state.runFailures.find(
      ({ collection }) => !collection || collection === url.pathname,
    );
    if (failure) {
      return json(
        response,
        failure.status,
        failure.status === 403
          ? state.fixtures.failures.forbidden
          : state.fixtures.failures.serverError,
      );
    }
    if (url.pathname === "/application") {
      return json(response, 200, state.fixtures.applications);
    }
    if (url.pathname === "/job") {
      return json(response, 200, state.fixtures.jobs);
    }
    return json(response, 200, state.fixtures.workflows);
  }
  if (url.pathname === "/application/acceptance-application") {
    return json(response, 200, state.fixtures.applicationDetail);
  }
  if (url.pathname === `/workflow/${fixtureIds.workflow}` && request.method === "GET") {
    return json(response, 200, state.fixtures.workflowDetail);
  }
  if (segments[0] === "job" && segments.length === 2 && request.method === "GET") {
    const detail = Object.entries(state.fixtures.jobDetails).find(
      ([id]) => id === segments[1],
    )?.[1];
    return detail
      ? json(response, 200, detail)
      : json(response, 404, { error: "fixture-job-not-found" });
  }
  // Launching work. A launch names the project it runs in, and the execution it creates joins that
  // project's own results, so the execution a successful launch opens is one that exists.
  if (url.pathname === "/instance" && request.method === "POST") {
    const form = new URLSearchParams((await readBody(request)).toString());
    // Held as sent and before any verdict, so the project a launch named can be stated exactly
    // whether the Data Manager went on to accept it or refuse it.
    state.instanceLaunches.push({
      application_id: form.get("application_id") ?? "",
      as_name: form.get("as_name") ?? "",
      project_id: form.get("project_id") ?? "",
      specification: form.get("specification") ?? "",
    });
    if (await launchGate(state, response)) {
      return;
    }
    state.fixtures.instances.instances.unshift({
      application_id: form.get("application_id") ?? "acceptance-application",
      application_type: "JOB",
      application_version: "1.0.0",
      archived: false,
      id: fixtureIds.launchedInstance,
      job_collection: "acceptance",
      job_id: 1,
      job_job: "acceptance-job",
      job_name: form.get("as_name") ?? "Launched Instance",
      job_version: "1.0.0",
      launched: "2026-01-02T05:04:05Z",
      name: form.get("as_name") ?? "Launched Instance",
      owner: state.fixtures.subject,
      phase: "RUNNING",
      project_id: form.get("project_id") ?? "",
      run_time: "0:00:10",
      started: "2026-01-02T05:04:05Z",
    });
    return json(response, 201, {
      instance_id: fixtureIds.launchedInstance,
      task_id: fixtureIds.task,
    });
  }
  if (segments[0] === "workflow" && segments[2] === "run" && request.method === "POST") {
    const form = new URLSearchParams((await readBody(request)).toString());
    // Held as sent and before any verdict, so what a launch asked for can be stated exactly
    // whether the Data Manager went on to accept it or refuse it.
    state.workflowLaunches.push({
      as_name: form.get("as_name") ?? "",
      debug: form.get("debug") ?? "",
      project_id: form.get("project_id") ?? "",
      variables: form.get("variables") ?? "",
      workflow_id: segments[1] ?? "",
    });
    if (await launchGate(state, response)) {
      return;
    }
    state.fixtures.runningWorkflows.running_workflows.unshift({
      error_num: 0,
      id: fixtureIds.launchedRunningWorkflow,
      name: form.get("as_name") ?? "Launched Workflow",
      project: { id: form.get("project_id") ?? "", name: "Acceptance Project" },
      started: "2026-01-02T05:04:05Z",
      status: "RUNNING",
      workflow: { id: segments[1], name: "acceptance-workflow", version: "1.0.0" },
    });
    return json(response, 201, { id: fixtureIds.launchedRunningWorkflow });
  }
  if (url.pathname === "/type") {
    return json(response, 200, state.fixtures.types);
  }
  // The inventory answers for the one organisation or unit it was asked about, so a report that
  // ignored the resource in the address bar would show another resource's users.
  if (url.pathname === "/inventory/user") {
    if (state.inventoryFailure) {
      const bodies = {
        403: state.fixtures.failures.forbidden,
        404: { error: "fixture-inventory-not-found" },
        429: state.fixtures.failures.rateLimited,
        503: state.fixtures.failures.serverError,
      };
      return json(response, state.inventoryFailure, bodies[state.inventoryFailure]);
    }
    const scope = url.searchParams.get("org_id") ?? url.searchParams.get("unit_id") ?? "";
    return json(
      response,
      200,
      state.fixtures.userInventory[scope] ?? { today: "2026-08-09", users: [] },
    );
  }
  if (url.pathname === "/user/account") {
    // The caller's own account is what confirms who they are, so a failure here is exactly the
    // state in which project facts cannot establish authority.
    return state.callerAccountFailure
      ? json(response, state.callerAccountFailure, state.fixtures.failures.serverError)
      : json(response, 200, state.fixtures.dataManagerAccount);
  }
  if (url.pathname === "/user") {
    return json(response, 200, state.fixtures.users);
  }
  if (url.pathname === "/version") {
    return json(response, 200, state.fixtures.dataManagerVersion);
  }
  if (url.pathname.startsWith("/task/")) {
    const taskId = url.pathname.slice("/task/".length);
    // A result task belongs to the project that ran it rather than to a polling sequence, so it
    // answers at whatever stage the scenario put it in and can be deleted once it is done.
    const resultTask = addressedResultTask(state, taskId);
    if (resultTask && request.method === "DELETE") {
      if (state.resultTaskDeletionFailure) {
        return json(
          response,
          state.resultTaskDeletionFailure,
          state.resultTaskDeletionFailure === 403
            ? state.fixtures.failures.forbidden
            : state.fixtures.failures.serverError,
        );
      }
      // The Data Manager will not delete a task until it is done.
      if (!resultTaskStages[state.resultTaskStage].done) {
        return json(response, 403, state.fixtures.failures.forbidden);
      }
      state.deletedResultTasks.push(taskId);
      response.writeHead(204).end();
      return;
    }
    if (resultTask) {
      if (state.resultTaskFailure) {
        const failure = {
          403: state.fixtures.failures.forbidden,
          404: { error: "fixture-task-not-found" },
          503: state.fixtures.failures.serverError,
        }[state.resultTaskFailure];
        return json(response, state.resultTaskFailure, failure);
      }
      const stage = resultTaskStages[state.resultTaskStage];
      return json(response, 200, {
        created: resultTask.created,
        done: stage.done,
        exit_code: stage.exitCode,
        purpose: resultTask.purpose,
        purpose_id: resultTask.purpose_id,
        purpose_version: resultTask.purpose_version,
        states: stage.states.map((taskState) => ({ ...taskState, time: resultTask.created })),
      });
    }
    if (request.method === "DELETE") {
      return json(response, 404, { error: "fixture-task-not-found" });
    }
    // A project deletion advances on its own sequence and settles by removing the project it named,
    // so a client watching it observes the project disappearing exactly when the task says so.
    const deletedProject = state.projectDeletionTasks.get(taskId);
    if (deletedProject !== undefined) {
      if (state.projectDeletionTaskFailure) {
        const failure = {
          403: state.fixtures.failures.forbidden,
          404: { error: "fixture-task-not-found" },
          503: state.fixtures.failures.serverError,
        }[state.projectDeletionTaskFailure];
        return json(response, state.projectDeletionTaskFailure, failure);
      }
      const polled = state.projectDeletionPollingIndexes.get(taskId) ?? 0;
      state.projectDeletionPollingIndexes.set(taskId, polled + 1);
      const transitions = state.fixtures.projectDeletionTransitions;
      const settled = transitions[Math.min(polled, transitions.length - 1)];
      const deletionTask =
        settled.done && state.projectDeletionExitCode !== undefined
          ? { ...settled, exit_code: state.projectDeletionExitCode }
          : settled;
      if (deletionTask.done && deletionTask.exit_code === 0) {
        state.deletedProjects.push(deletedProject);
      }
      return json(response, 200, deletionTask);
    }
    const deletionVersion = state.deletionTaskVersions.get(taskId);
    const attachmentTask = state.attachmentTasks.get(taskId);
    const isUploadTask = taskId === fixtureIds.task || state.uploadTaskIds.includes(taskId);
    if (!isUploadTask && deletionVersion === undefined && !attachmentTask) {
      return json(response, 404, { error: "fixture-task-not-found" });
    }
    if (state.taskFailure) {
      return json(response, state.taskFailure, state.fixtures.failures.serverError);
    }
    // Each kind of task advances and settles on its own, so a failing upload, deletion, or
    // attachment never has to be told apart from another by timing.
    const pollingIndexes = attachmentTask
      ? state.attachmentPollingIndexes
      : deletionVersion === undefined
        ? state.pollingIndexes
        : state.deletionPollingIndexes;
    const pollingIndex = pollingIndexes.get(taskId) ?? 0;
    pollingIndexes.set(taskId, pollingIndex + 1);
    const index = Math.min(pollingIndex, state.fixtures.taskTransitions.length - 1);
    const task = state.fixtures.taskTransitions[index];
    const exitCode = attachmentTask
      ? state.attachExitCode
      : deletionVersion === undefined
        ? state.uploadExitCode
        : state.deletionExitCode;
    const responseTask =
      task.done && exitCode !== undefined ? { ...task, exit_code: exitCode } : task;
    if (responseTask.done && responseTask.exit_code === 0 && attachmentTask) {
      completeAttachment(state, attachmentTask, subject);
      state.attachmentTasks.delete(taskId);
      state.attachmentPollingIndexes.delete(taskId);
    }
    const versionUpload = state.versionUploadTasks.get(taskId);
    if (responseTask.done && responseTask.exit_code === 0 && versionUpload) {
      const held = state.fixtures.dataset.datasets.find(
        (candidate) => candidate.dataset_id === versionUpload.datasetId,
      );
      if (held) {
        const next = Math.max(0, ...held.versions.map(({ version }) => version)) + 1;
        held.versions = [
          {
            file_name: versionUpload.fileName,
            owner: subject,
            processing_stage: "DONE",
            projects: [],
            published: "2026-08-12T03:04:05Z",
            size: 32,
            source_ref: versionUpload.fileName,
            type: versionUpload.type,
            version: next,
          },
          ...held.versions,
        ];
      }
      state.versionUploadTasks.delete(taskId);
    }
    if (responseTask.done && responseTask.exit_code === 0 && deletionVersion !== undefined) {
      state.fixtures.dataset.datasets[0].versions =
        state.fixtures.dataset.datasets[0].versions.filter(
          (version) => version.version !== deletionVersion,
        );
      state.deletionPollingIndexes.delete(taskId);
      state.deletionTaskVersions.delete(taskId);
    }
    return json(response, 200, responseTask);
  }
  if (url.pathname === `/dataset/${fixtureIds.dataset}/schema/1`) {
    return json(response, 200, state.fixtures.datasetSchemas[1]);
  }
  if (url.pathname === `/dataset/${fixtureIds.dataset}/schema/2`) {
    return json(response, 200, state.fixtures.datasetSchemas[2]);
  }
  if (
    request.method === "DELETE" &&
    [1, 2, 3].some((version) => url.pathname === `/dataset/${fixtureIds.dataset}/${version}`)
  ) {
    if (state.datasetMutationFailure) {
      return json(response, state.datasetMutationFailure, state.fixtures.failures.forbidden);
    }
    const datasetVersion = Number(url.pathname.split("/").at(-1));
    const taskId = `task-44444444-4444-4444-4444-${String(datasetVersion).padStart(12, "0")}`;
    state.deletionPollingIndexes.set(taskId, 0);
    state.deletionTaskVersions.set(taskId, datasetVersion);
    return json(response, 202, { task_id: taskId });
  }
  if (
    (request.method === "GET" && url.pathname === `/dataset/${fixtureIds.dataset}/1`) ||
    (request.method === "GET" && url.pathname === `/dataset/${fixtureIds.dataset}/2`)
  ) {
    if (state.datasetContentFailure) {
      return json(
        response,
        state.datasetContentFailure,
        state.datasetContentFailure === 403
          ? state.fixtures.failures.forbidden
          : state.fixtures.failures.serverError,
      );
    }
    const content = url.pathname.endsWith("/1")
      ? datasetContentFixtures[1]
      : datasetContentFixtures[2];
    response.writeHead(200, {
      "content-length": content.length,
      "content-type": "application/octet-stream",
    });
    return response.end(content);
  }
  if (url.pathname.startsWith("/__failure/")) {
    const status = Number(url.pathname.slice("/__failure/".length));
    const body =
      status === 403
        ? state.fixtures.failures.forbidden
        : status === 429
          ? state.fixtures.failures.rateLimited
          : state.fixtures.failures.serverError;
    return json(response, status, body);
  }
  return json(response, 404, { error: "dm-route-not-found", path: url.pathname });
};
export const dataManagerServer = createServer(
  (request, response) => void handleDataManager(request, response),
);
