import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import { acceptanceUrls } from "../environment";
import { isLaunchFailureStatus, multipartFields } from "./dataManager";
import { fixtureIds, isScenarioProfile } from "./fixtures";
import { json, readBody } from "./http";
import {
  getScenario,
  resetScenario,
  type ResultInstanceStage,
  type ResultTaskStage,
  type RunningWorkflowStage,
} from "./state";

/**
 * The control API the tests themselves drive: it chooses a scenario profile and arms the failures a
 * journey needs. It is deliberately separate from the three services it configures, so nothing a
 * test asks for can be mistaken for something the application requested.
 */

const datasetFailureControls = [
  {
    error: "unsupported-dataset-failure",
    pathSuffix: "/dataset-failure",
    stateKey: "datasetFailure",
    statuses: [429, 503],
  },
  {
    error: "unsupported-dataset-content-failure",
    pathSuffix: "/dataset-content-failure",
    stateKey: "datasetContentFailure",
    statuses: [403, 429, 503],
  },
] as const;
const handleControl = async (request: IncomingMessage, response: ServerResponse) => {
  const url = new URL(request.url ?? "/", acceptanceUrls.control);
  const subject = decodeURIComponent(url.pathname.split("/").filter(Boolean)[1] ?? "anonymous");
  if (url.pathname === "/health") {
    return json(response, 200, { ready: true });
  }
  if (url.pathname.startsWith("/scenario/") && request.method === "PUT") {
    const profile = url.searchParams.get("profile") ?? "default";
    if (!isScenarioProfile(profile)) {
      return json(response, 400, { error: "unknown-scenario-profile", profile });
    }
    resetScenario(subject, profile);
    return json(response, 200, { profile, subject });
  }
  if (url.pathname.startsWith("/scenario/") && request.method === "GET") {
    const state = getScenario(subject);
    return json(response, 200, {
      attachments: state.attachments,
      pollingIndex: state.pollingIndexes.get(fixtureIds.task) ?? 0,
      instanceLaunches: state.instanceLaunches,
      requests: state.requests,
      upload: state.upload
        ? {
            bytes: state.upload.body.length,
            contentType: state.upload.contentType,
            // The dataset, filename, type, and billing unit an upload named are carried in its
            // body, so a test can only hold the request to them by reading them from there.
            fields: multipartFields(state.upload.body.toString()),
          }
        : undefined,
      workflowLaunches: state.workflowLaunches,
    });
  }
  if (url.pathname.endsWith("/product-failure") && request.method === "POST") {
    getScenario(subject).productFailure = true;
    return json(response, 200, { productFailure: true, subject });
  }
  const creationDelayControls = [
    { pathSuffix: "/organisations-delay", stateKey: "organisationsDelay" },
    { pathSuffix: "/product-creation-delay", stateKey: "productCreationDelay" },
    { pathSuffix: "/project-creation-response-delay", stateKey: "projectCreationResponseDelay" },
  ] as const;
  const creationDelayControl = creationDelayControls.find(({ pathSuffix }) =>
    url.pathname.endsWith(pathSuffix),
  );
  if (creationDelayControl && request.method === "POST") {
    const milliseconds = Number(url.searchParams.get("milliseconds"));
    if (!Number.isInteger(milliseconds) || milliseconds < 1 || milliseconds > 5000) {
      return json(response, 400, { error: "unsupported-creation-delay", milliseconds });
    }
    getScenario(subject)[creationDelayControl.stateKey] = milliseconds;
    return json(response, 200, { milliseconds, subject });
  }
  const creationFailureControls = [
    { pathSuffix: "/cleanup-failure", stateKey: "cleanupFailure" },
    { pathSuffix: "/product-creation-failure", stateKey: "productCreationFailure" },
    { pathSuffix: "/project-creation-failure", stateKey: "projectCreationFailure" },
  ] as const;
  const creationFailureControl = creationFailureControls.find(({ pathSuffix }) =>
    url.pathname.endsWith(pathSuffix),
  );
  if (creationFailureControl) {
    const state = getScenario(subject);
    if (request.method === "DELETE") {
      state[creationFailureControl.stateKey] = undefined;
      return json(response, 200, { subject });
    }
    const status = Number(url.searchParams.get("status"));
    if (
      ![400, 403, 429, 503].includes(status) ||
      (creationFailureControl.stateKey === "cleanupFailure" && status === 429)
    ) {
      return json(response, 400, { error: "unsupported-creation-failure", status });
    }
    if (creationFailureControl.stateKey === "cleanupFailure") {
      state.cleanupFailure = status as 403 | 503;
    } else if (creationFailureControl.stateKey === "productCreationFailure") {
      state.productCreationFailure = status as 400 | 403 | 429 | 503;
    } else {
      state.projectCreationFailure = status as 400 | 403 | 429 | 503;
    }
    return json(response, 200, { subject });
  }
  if (url.pathname.endsWith("/project-deletion-failure")) {
    const state = getScenario(subject);
    if (request.method === "DELETE") {
      state.projectDeletionFailure = undefined;
      return json(response, 200, { subject });
    }
    const status = Number(url.searchParams.get("status"));
    if (![400, 403, 429, 503].includes(status)) {
      return json(response, 400, { error: "unsupported-project-deletion-failure", status });
    }
    state.projectDeletionFailure = status as 400 | 403 | 429 | 503;
    return json(response, 200, { projectDeletionFailure: status, subject });
  }
  if (url.pathname.endsWith("/project-deletion-task-failure")) {
    const state = getScenario(subject);
    if (request.method === "DELETE") {
      state.projectDeletionTaskFailure = undefined;
      return json(response, 200, { subject });
    }
    const status = Number(url.searchParams.get("status"));
    if (![403, 404, 503].includes(status)) {
      return json(response, 400, { error: "unsupported-project-deletion-task-failure", status });
    }
    state.projectDeletionTaskFailure = status as 403 | 404 | 503;
    return json(response, 200, { projectDeletionTaskFailure: status, subject });
  }
  if (url.pathname.endsWith("/project-deletion-exit-code")) {
    const state = getScenario(subject);
    if (request.method === "DELETE") {
      state.projectDeletionExitCode = undefined;
      return json(response, 200, { subject });
    }
    state.projectDeletionExitCode = Number(url.searchParams.get("value"));
    return json(response, 200, { projectDeletionExitCode: state.projectDeletionExitCode, subject });
  }
  if (url.pathname.endsWith("/subscription-mutation-failure")) {
    const state = getScenario(subject);
    if (request.method === "DELETE") {
      state.subscriptionMutationFailure = undefined;
      return json(response, 200, { subject });
    }
    const status = Number(url.searchParams.get("status"));
    if (![403, 503].includes(status)) {
      return json(response, 400, { error: "unsupported-subscription-mutation-failure", status });
    }
    state.subscriptionMutationFailure = status as 403 | 503;
    return json(response, 200, { subject, subscriptionMutationFailure: status });
  }
  if (url.pathname.endsWith("/charge-failure") && request.method === "POST") {
    const status = Number(url.searchParams.get("status"));
    if (![403, 429, 503].includes(status)) {
      return json(response, 400, { error: "unsupported-charge-failure", status });
    }
    getScenario(subject).chargeFailure = status as 403 | 429 | 503;
    return json(response, 200, { chargeFailure: status, subject });
  }
  if (url.pathname.endsWith("/inventory-failure") && request.method === "POST") {
    const status = Number(url.searchParams.get("status"));
    if (![403, 404, 429, 503].includes(status)) {
      return json(response, 400, { error: "unsupported-inventory-failure", status });
    }
    getScenario(subject).inventoryFailure = status as 403 | 404 | 429 | 503;
    return json(response, 200, { inventoryFailure: status, subject });
  }
  if (url.pathname.endsWith("/inventory-failure") && request.method === "DELETE") {
    getScenario(subject).inventoryFailure = undefined;
    return json(response, 200, { subject });
  }
  const accessReadControls = [
    { pathSuffix: "/units-read-failure", stateKey: "unitsReadFailure" },
    { pathSuffix: "/semantics-failure", stateKey: "semanticsFailure" },
  ] as const;
  const accessReadControl = accessReadControls.find(({ pathSuffix }) =>
    url.pathname.endsWith(pathSuffix),
  );
  if (accessReadControl) {
    getScenario(subject)[accessReadControl.stateKey] = request.method === "POST" ? 503 : undefined;
    return json(response, 200, { subject });
  }
  if (url.pathname.endsWith("/addressed-read-failure") && request.method === "POST") {
    const status = Number(url.searchParams.get("status"));
    if (![403, 503].includes(status)) {
      return json(response, 400, { error: "unsupported-addressed-read-failure", status });
    }
    getScenario(subject).addressedReadFailure = status as 403 | 503;
    return json(response, 200, { addressedReadFailure: status, subject });
  }
  if (url.pathname.endsWith("/addressed-read-failure") && request.method === "DELETE") {
    getScenario(subject).addressedReadFailure = undefined;
    return json(response, 200, { subject });
  }
  if (url.pathname.endsWith("/access-failure") && request.method === "POST") {
    const status = Number(url.searchParams.get("status"));
    if (![403, 503].includes(status)) {
      return json(response, 400, { error: "unsupported-access-failure", status });
    }
    getScenario(subject).accessFailure = status as 403 | 503;
    return json(response, 200, { accessFailure: status, subject });
  }
  if (url.pathname.endsWith("/access-failure") && request.method === "DELETE") {
    getScenario(subject).accessFailure = undefined;
    return json(response, 200, { subject });
  }
  if (url.pathname.endsWith("/charge-failure") && request.method === "DELETE") {
    getScenario(subject).chargeFailure = undefined;
    return json(response, 200, { subject });
  }
  const datasetFailureControl = datasetFailureControls.find(({ pathSuffix }) =>
    url.pathname.endsWith(pathSuffix),
  );
  if (datasetFailureControl && request.method === "POST") {
    const status = Number(url.searchParams.get("status"));
    if (!(datasetFailureControl.statuses as readonly number[]).includes(status)) {
      return json(response, 400, { error: datasetFailureControl.error, status });
    }
    const state = getScenario(subject);
    if (datasetFailureControl.stateKey === "datasetContentFailure") {
      state.datasetContentFailure = status as 403 | 429 | 503;
    } else {
      state.datasetFailure = status as 429 | 503;
    }
    return json(response, 200, { [datasetFailureControl.stateKey]: status, subject });
  }
  if (datasetFailureControl && request.method === "DELETE") {
    getScenario(subject)[datasetFailureControl.stateKey] = undefined;
    return json(response, 200, { subject });
  }
  if (url.pathname.endsWith("/file-content-failure")) {
    const state = getScenario(subject);
    if (request.method === "DELETE") {
      state.fileContentFailure = undefined;
      return json(response, 200, { subject });
    }
    const status = Number(url.searchParams.get("status"));
    if (![403, 429, 503].includes(status)) {
      return json(response, 400, { error: "unsupported-file-content-failure", status });
    }
    state.fileContentFailure = status as 403 | 429 | 503;
    return json(response, 200, { fileContentFailure: status, subject });
  }
  const fileFailureControls = [
    { pathSuffix: "/files-failure", stateKey: "filesFailure" },
    { pathSuffix: "/file-mutation-failure", stateKey: "fileMutationFailure" },
  ] as const;
  const fileFailureControl = fileFailureControls.find(({ pathSuffix }) =>
    url.pathname.endsWith(pathSuffix),
  );
  if (fileFailureControl) {
    const state = getScenario(subject);
    if (request.method === "DELETE") {
      state[fileFailureControl.stateKey] = undefined;
      return json(response, 200, { subject });
    }
    const status = Number(url.searchParams.get("status"));
    if (![403, 503].includes(status)) {
      return json(response, 400, { error: "unsupported-file-failure", status });
    }
    state[fileFailureControl.stateKey] = status as 403 | 503;
    return json(response, 200, { subject, [fileFailureControl.stateKey]: status });
  }
  if (url.pathname.endsWith("/dataset-mutation-failure") && request.method === "POST") {
    const status = Number(url.searchParams.get("status"));
    if (![403, 503].includes(status)) {
      return json(response, 400, { error: "unsupported-dataset-mutation-failure", status });
    }
    getScenario(subject).datasetMutationFailure = status as 403 | 503;
    return json(response, 200, { datasetMutationFailure: status, subject });
  }
  if (url.pathname.endsWith("/dataset-mutation-failure") && request.method === "DELETE") {
    getScenario(subject).datasetMutationFailure = undefined;
    return json(response, 200, { subject });
  }
  if (url.pathname.endsWith("/concurrent-dataset-version") && request.method === "POST") {
    const state = getScenario(subject);
    const currentVersion = state.fixtures.dataset.datasets[0].versions[0];
    state.fixtures.dataset.datasets[0].versions.unshift({
      ...currentVersion,
      file_name: "acceptance-dataset-v3.sdf",
      source_ref: "acceptance-dataset-v3.sdf",
      version: 3,
    });
    return json(response, 200, { subject });
  }
  if (url.pathname.endsWith("/undeletable-dataset-version") && request.method === "POST") {
    const state = getScenario(subject);
    state.fixtures.dataset.datasets[1].versions[0].processing_stage = "COPYING";
    return json(response, 200, { subject });
  }
  if (url.pathname.endsWith("/deletion-exit-code") && request.method === "POST") {
    getScenario(subject).deletionExitCode = Number(url.searchParams.get("value"));
    return json(response, 200, { subject });
  }
  if (url.pathname.endsWith("/deletion-exit-code") && request.method === "DELETE") {
    getScenario(subject).deletionExitCode = undefined;
    return json(response, 200, { subject });
  }
  if (url.pathname.endsWith("/attach-failure") && request.method === "POST") {
    const status = Number(url.searchParams.get("status"));
    if (![400, 403, 503].includes(status)) {
      return json(response, 400, { error: "unsupported-attach-failure", status });
    }
    getScenario(subject).attachFailure = status as 400 | 403 | 503;
    return json(response, 200, { attachFailure: status, subject });
  }
  if (url.pathname.endsWith("/attach-failure") && request.method === "DELETE") {
    getScenario(subject).attachFailure = undefined;
    return json(response, 200, { subject });
  }
  if (url.pathname.endsWith("/attach-exit-code") && request.method === "POST") {
    getScenario(subject).attachExitCode = Number(url.searchParams.get("value"));
    return json(response, 200, { subject });
  }
  if (url.pathname.endsWith("/attach-exit-code") && request.method === "DELETE") {
    getScenario(subject).attachExitCode = undefined;
    return json(response, 200, { subject });
  }
  // A caller who can edit no project at all, which is the one fact that leaves an attachment with
  // nowhere to go while every other dataset action stays exactly as it was.
  if (url.pathname.endsWith("/no-editable-projects") && request.method === "POST") {
    const state = getScenario(subject);
    for (const project of state.fixtures.projects.projects) {
      project.administrators = project.administrators.filter((member) => member !== subject);
      project.editors = project.editors.filter((member) => member !== subject);
    }
    return json(response, 200, { subject });
  }
  if (url.pathname.endsWith("/upload-failure") && request.method === "POST") {
    const status = Number(url.searchParams.get("status"));
    if (![403, 503].includes(status)) {
      return json(response, 400, { error: "unsupported-upload-failure", status });
    }
    getScenario(subject).uploadFailure = status as 403 | 503;
    return json(response, 200, { subject, uploadFailure: status });
  }
  if (url.pathname.endsWith("/upload-failure") && request.method === "DELETE") {
    getScenario(subject).uploadFailure = undefined;
    return json(response, 200, { subject });
  }
  if (url.pathname.endsWith("/upload-exit-code") && request.method === "POST") {
    getScenario(subject).uploadExitCode = Number(url.searchParams.get("value"));
    return json(response, 200, { subject });
  }
  if (url.pathname.endsWith("/upload-exit-code") && request.method === "DELETE") {
    getScenario(subject).uploadExitCode = undefined;
    return json(response, 200, { subject });
  }
  if (url.pathname.endsWith("/task-failure") && request.method === "POST") {
    getScenario(subject).taskFailure = 503;
    return json(response, 200, { subject });
  }
  if (url.pathname.endsWith("/task-failure") && request.method === "DELETE") {
    getScenario(subject).taskFailure = undefined;
    return json(response, 200, { subject });
  }
  if (url.pathname.endsWith("/product-failure") && request.method === "DELETE") {
    getScenario(subject).productFailure = false;
    return json(response, 200, { productFailure: false, subject });
  }
  if (url.pathname.endsWith("/results-failure") && request.method === "POST") {
    const status = Number(url.searchParams.get("status"));
    if (![403, 503].includes(status)) {
      return json(response, 400, { error: "unsupported-results-failure", status });
    }
    const collection = url.searchParams.get("collection") ?? undefined;
    const scenario = getScenario(subject);
    // A collection-scoped failure joins any others already in effect, so two collections can be
    // made to fail differently at once; an unscoped one replaces them all.
    scenario.resultsFailures = collection
      ? [
          ...scenario.resultsFailures.filter((failure) => failure.collection !== collection),
          { collection, status: status as 403 | 503 },
        ]
      : [{ status: status as 403 | 503 }];
    return json(response, 200, { collection, resultsFailure: status, subject });
  }
  if (url.pathname.endsWith("/results-failure") && request.method === "DELETE") {
    getScenario(subject).resultsFailures = [];
    return json(response, 200, { subject });
  }
  // The stage the project's own instances report, so each lifecycle one can reach is observable
  // without waiting for it.
  if (url.pathname.endsWith("/instance-stage") && request.method === "POST") {
    const stage = url.searchParams.get("stage") ?? "";
    if (!["done", "failed", "rejected", "running", "stalled", "unrecognised"].includes(stage)) {
      return json(response, 400, { error: "unsupported-instance-stage", stage });
    }
    getScenario(subject).instanceStage = stage as ResultInstanceStage;
    return json(response, 200, { instanceStage: stage, subject });
  }
  // One addressed instance's own read failing, which is distinct from its project's collection
  // failing.
  if (url.pathname.endsWith("/instance-failure") && request.method === "POST") {
    const status = Number(url.searchParams.get("status"));
    if (![403, 404, 503].includes(status)) {
      return json(response, 400, { error: "unsupported-instance-failure", status });
    }
    getScenario(subject).instanceFailure = status as 403 | 404 | 503;
    return json(response, 200, { instanceFailure: status, subject });
  }
  if (url.pathname.endsWith("/instance-failure") && request.method === "DELETE") {
    getScenario(subject).instanceFailure = undefined;
    return json(response, 200, { subject });
  }
  if (url.pathname.endsWith("/instance-command-failure") && request.method === "POST") {
    const status = Number(url.searchParams.get("status"));
    if (![403, 503].includes(status)) {
      return json(response, 400, { error: "unsupported-instance-command-failure", status });
    }
    getScenario(subject).instanceCommandFailure = status as 403 | 503;
    return json(response, 200, { instanceCommandFailure: status, subject });
  }
  if (url.pathname.endsWith("/instance-command-failure") && request.method === "DELETE") {
    getScenario(subject).instanceCommandFailure = undefined;
    return json(response, 200, { subject });
  }
  // The stage the project's own result tasks report, so each lifecycle a task can reach is
  // observable without waiting for one.
  if (url.pathname.endsWith("/result-task-stage") && request.method === "POST") {
    const stage = url.searchParams.get("stage") ?? "";
    if (!["done", "failed", "rejected", "running"].includes(stage)) {
      return json(response, 400, { error: "unsupported-result-task-stage", stage });
    }
    getScenario(subject).resultTaskStage = stage as ResultTaskStage;
    return json(response, 200, { resultTaskStage: stage, subject });
  }
  // One addressed task's own read failing, which is distinct from its project's collection failing.
  if (url.pathname.endsWith("/result-task-failure") && request.method === "POST") {
    const status = Number(url.searchParams.get("status"));
    if (![403, 404, 503].includes(status)) {
      return json(response, 400, { error: "unsupported-result-task-failure", status });
    }
    getScenario(subject).resultTaskFailure = status as 403 | 404 | 503;
    return json(response, 200, { resultTaskFailure: status, subject });
  }
  if (url.pathname.endsWith("/result-task-failure") && request.method === "DELETE") {
    getScenario(subject).resultTaskFailure = undefined;
    return json(response, 200, { subject });
  }
  if (url.pathname.endsWith("/result-task-deletion-failure") && request.method === "POST") {
    const status = Number(url.searchParams.get("status"));
    if (![403, 503].includes(status)) {
      return json(response, 400, { error: "unsupported-result-task-deletion-failure", status });
    }
    getScenario(subject).resultTaskDeletionFailure = status as 403 | 503;
    return json(response, 200, { resultTaskDeletionFailure: status, subject });
  }
  if (url.pathname.endsWith("/result-task-deletion-failure") && request.method === "DELETE") {
    getScenario(subject).resultTaskDeletionFailure = undefined;
    return json(response, 200, { subject });
  }
  // The stage the project's own running workflows report, so each lifecycle one can reach is
  // observable without waiting for it.
  if (url.pathname.endsWith("/running-workflow-stage") && request.method === "POST") {
    const stage = url.searchParams.get("stage") ?? "";
    if (!["done", "failed", "rejected", "running", "stopped", "unrecognised"].includes(stage)) {
      return json(response, 400, { error: "unsupported-running-workflow-stage", stage });
    }
    getScenario(subject).runningWorkflowStage = stage as RunningWorkflowStage;
    return json(response, 200, { runningWorkflowStage: stage, subject });
  }
  // One addressed workflow's own read failing, which is distinct from its project's collection
  // failing and from its steps failing.
  if (url.pathname.endsWith("/running-workflow-failure") && request.method === "POST") {
    const status = Number(url.searchParams.get("status"));
    if (![403, 404, 503].includes(status)) {
      return json(response, 400, { error: "unsupported-running-workflow-failure", status });
    }
    getScenario(subject).runningWorkflowFailure = status as 403 | 404 | 503;
    return json(response, 200, { runningWorkflowFailure: status, subject });
  }
  if (url.pathname.endsWith("/running-workflow-failure") && request.method === "DELETE") {
    getScenario(subject).runningWorkflowFailure = undefined;
    return json(response, 200, { subject });
  }
  if (url.pathname.endsWith("/running-workflow-steps-failure") && request.method === "POST") {
    const status = Number(url.searchParams.get("status"));
    if (![403, 503].includes(status)) {
      return json(response, 400, { error: "unsupported-running-workflow-steps-failure", status });
    }
    getScenario(subject).runningWorkflowStepsFailure = status as 403 | 503;
    return json(response, 200, { runningWorkflowStepsFailure: status, subject });
  }
  if (url.pathname.endsWith("/running-workflow-steps-failure") && request.method === "DELETE") {
    getScenario(subject).runningWorkflowStepsFailure = undefined;
    return json(response, 200, { subject });
  }
  if (url.pathname.endsWith("/running-workflow-command-failure") && request.method === "POST") {
    const status = Number(url.searchParams.get("status"));
    if (![403, 503].includes(status)) {
      return json(response, 400, { error: "unsupported-running-workflow-command-failure", status });
    }
    getScenario(subject).runningWorkflowCommandFailure = status as 403 | 503;
    return json(response, 200, { runningWorkflowCommandFailure: status, subject });
  }
  if (url.pathname.endsWith("/running-workflow-command-failure") && request.method === "DELETE") {
    getScenario(subject).runningWorkflowCommandFailure = undefined;
    return json(response, 200, { subject });
  }
  if (url.pathname.endsWith("/run-failure") && request.method === "POST") {
    const status = Number(url.searchParams.get("status"));
    if (![403, 503].includes(status)) {
      return json(response, 400, { error: "unsupported-run-failure", status });
    }
    const collection = url.searchParams.get("collection") ?? undefined;
    const scenario = getScenario(subject);
    // A catalogue-scoped failure joins any others already in effect, so two catalogues can be made
    // to fail differently at once; an unscoped one replaces them all.
    scenario.runFailures = collection
      ? [
          ...scenario.runFailures.filter((failure) => failure.collection !== collection),
          { collection, status: status as 403 | 503 },
        ]
      : [{ status: status as 403 | 503 }];
    return json(response, 200, { collection, runFailure: status, subject });
  }
  if (url.pathname.endsWith("/run-failure") && request.method === "DELETE") {
    getScenario(subject).runFailures = [];
    return json(response, 200, { subject });
  }
  if (url.pathname.endsWith("/launch-failure") && request.method === "POST") {
    const status = Number(url.searchParams.get("status"));
    // The same map decides what a control accepts and what the refusal answers with, so a status a
    // test can ask for is always one the Data Manager has words for.
    if (!isLaunchFailureStatus(status)) {
      return json(response, 400, { error: "unsupported-launch-failure", status });
    }
    getScenario(subject).launchFailure = status;
    return json(response, 200, { launchFailure: status, subject });
  }
  if (url.pathname.endsWith("/launch-failure") && request.method === "DELETE") {
    getScenario(subject).launchFailure = undefined;
    return json(response, 200, { subject });
  }
  if (url.pathname.endsWith("/launch-delay") && request.method === "POST") {
    const milliseconds = Number(url.searchParams.get("milliseconds"));
    if (!Number.isInteger(milliseconds) || milliseconds < 1 || milliseconds > 5000) {
      return json(response, 400, { error: "unsupported-launch-delay", milliseconds });
    }
    getScenario(subject).launchDelay = milliseconds;
    return json(response, 200, { milliseconds, subject });
  }
  if (url.pathname.endsWith("/project-failure") && request.method === "POST") {
    const status = Number(url.searchParams.get("status"));
    if (![403, 404, 503].includes(status)) {
      return json(response, 400, { error: "unsupported-project-failure", status });
    }
    getScenario(subject).projectFailure = status;
    return json(response, 200, { projectFailure: status, subject });
  }
  if (url.pathname.endsWith("/project-failure") && request.method === "DELETE") {
    getScenario(subject).projectFailure = undefined;
    return json(response, 200, { subject });
  }
  // The project collection failing, which leaves the projects a caller could attach to unknown
  // rather than leaving one project unreadable.
  if (url.pathname.endsWith("/project-collection-failure") && request.method === "POST") {
    const status = Number(url.searchParams.get("status"));
    if (![403, 503].includes(status)) {
      return json(response, 400, { error: "unsupported-project-collection-failure", status });
    }
    getScenario(subject).projectCollectionFailure = status as 403 | 503;
    return json(response, 200, { projectCollectionFailure: status, subject });
  }
  if (url.pathname.endsWith("/project-collection-failure") && request.method === "DELETE") {
    getScenario(subject).projectCollectionFailure = undefined;
    return json(response, 200, { subject });
  }
  if (url.pathname.endsWith("/project-mutation-failure") && request.method === "POST") {
    const status = Number(url.searchParams.get("status"));
    if (![403, 503].includes(status)) {
      return json(response, 400, { error: "unsupported-project-mutation-failure", status });
    }
    getScenario(subject).projectMutationFailure = status as 403 | 503;
    return json(response, 200, { projectMutationFailure: status, subject });
  }
  if (url.pathname.endsWith("/project-mutation-failure") && request.method === "DELETE") {
    getScenario(subject).projectMutationFailure = undefined;
    return json(response, 200, { subject });
  }
  if (url.pathname.endsWith("/caller-account-failure") && request.method === "POST") {
    getScenario(subject).callerAccountFailure = 503;
    return json(response, 200, { callerAccountFailure: 503, subject });
  }
  if (url.pathname.endsWith("/caller-account-failure") && request.method === "DELETE") {
    getScenario(subject).callerAccountFailure = undefined;
    return json(response, 200, { subject });
  }
  if (request.method === "POST") {
    await readBody(request);
  }
  return json(response, 404, { error: "control-route-not-found" });
};
export const controlServer = createServer(
  (request, response) => void handleControl(request, response),
);
