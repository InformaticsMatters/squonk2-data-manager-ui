import {
  type ProductDmProjectTier,
  type ProductDmStorage,
  type UnitAllDetailDefaultProductPrivacy,
} from "@/api/account-server";
import { type FilesGetResponse } from "@/api/data-manager";
import {
  AppApiDatasetPostDatasetVersionMetaBody,
  AppApiDatasetPostDatasetVersionMetaResponse,
} from "@/api/data-manager/metadata/zod";

import { createHash, createPrivateKey, generateKeyPairSync, randomUUID, sign } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { setTimeout as delay } from "node:timers/promises";
import { z } from "zod";

import { acceptanceEnvironment, acceptanceUrls } from "../environment";
import {
  datasetContentFixtures,
  fixtureIds,
  type FixtureProjectFileSystem,
  isScenarioProfile,
  projectFileSchemaFixture,
  projectSdfFixture,
} from "./fixtures";
import {
  type AttachmentRecord,
  type AttachmentTaskRecord,
  getScenario,
  type RequestRecord,
  resetScenario,
  type ResultInstanceStage,
  type ResultTaskStage,
  type RunningWorkflowStage,
  type ScenarioState,
} from "./state";

const issuer = acceptanceEnvironment.KEYCLOAK_URL;
const clientId = acceptanceEnvironment.KEYCLOAK_CLIENT_ID;
const clientSecret = acceptanceEnvironment.KEYCLOAK_CLIENT_SECRET;
const allowedRedirect = `${acceptanceEnvironment.BASE_URL}${acceptanceEnvironment.BASE_PATH}/api/auth/callback/keycloak`;
const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const privateKeyObject = createPrivateKey(privateKey.export({ format: "pem", type: "pkcs8" }));
const publicJwk = publicKey.export({ format: "jwk" });
const codes = new Map<string, { challenge?: string; redirectUri: string; subject: string }>();

const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");

/**
 * The realm roles the identity provider issues. An evaluation account holds the Account Server's
 * evaluator role instead of its user role, which is the only thing that distinguishes it, so the
 * scenario profile decides it here rather than any screen inferring it.
 */
const realmRolesFor = (subject: string) =>
  getScenario(subject).profile === "evaluator"
    ? ["data-manager-user", "account-server-evaluator"]
    : ["data-manager-user", "account-server-user"];

const createToken = (subject: string) => {
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    aud: clientId,
    email: `${subject}@example.test`,
    email_verified: true,
    exp: now + 3600,
    family_name: "User",
    given_name: "Acceptance",
    iat: now,
    iss: issuer,
    name: `Acceptance ${subject}`,
    preferred_username: subject,
    realm_access: { roles: realmRolesFor(subject) },
    sub: subject,
  };
  const header = encode({ alg: "RS256", kid: "acceptance-key", typ: "JWT" });
  const payload = encode(claims);
  const signature = sign(
    "RSA-SHA256",
    Buffer.from(`${header}.${payload}`),
    privateKeyObject,
  ).toString("base64url");
  return `${header}.${payload}.${signature}`;
};

const decodeSubject = (authorization: string | undefined) => {
  if (!authorization?.startsWith("Bearer ")) {
    return "anonymous";
  }
  const payload = authorization.slice(7).split(".")[1];
  if (!payload) {
    return "anonymous";
  }
  return (
    (JSON.parse(Buffer.from(payload, "base64url").toString()) as { sub?: string }).sub ??
    "anonymous"
  );
};

const readBody = async (request: IncomingMessage) => {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.from(chunk as Uint8Array));
  }
  return Buffer.concat(chunks);
};

const json = (response: ServerResponse, status: number, body: unknown) => {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
};

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

const LabelAnnotation = z.object({
  active: z.boolean(),
  label: z.string(),
  type: z.literal("LabelAnnotation"),
  value: z.string(),
});

const cors = (request: IncomingMessage, response: ServerResponse) => {
  response.setHeader("access-control-allow-headers", "authorization,content-type");
  response.setHeader("access-control-allow-methods", "DELETE,GET,PATCH,POST,PUT,OPTIONS");
  response.setHeader("access-control-allow-origin", request.headers.origin ?? "*");
};

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

/**
 * One named field of a multipart body. An upload's destination is carried in the body rather than
 * the URL, so a test can only prove where a file landed if the fixture reads it from there too.
 */
const multipartField = (body: string, name: string) => {
  const part = body
    .split(/--[^\r\n]+\r\n/u)
    .find((candidate) => candidate.includes(`name="${name}"`));
  return part?.split("\r\n\r\n")[1]?.replace(/\r\n$/u, "");
};

/** The named text fields of an upload, which is what a test can hold the request to. */
const uploadFieldNames = [
  "as_filename",
  "dataset_id",
  "dataset_type",
  "format_extra_variables",
  "unit_id",
] as const;

const multipartFields = (
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

const record = (request: IncomingMessage, url: URL) => {
  const authorization = request.headers.authorization;
  const subject = decodeSubject(authorization);
  const requestRecord: RequestRecord = {
    authorization,
    method: request.method ?? "GET",
    path: url.pathname,
    // Kept apart from the path so a test can state exactly which arguments a read was constrained
    // by without every other diagnostic having to know about them.
    query: url.search,
    subject,
  };
  getScenario(subject).requests.push(requestRecord);
  return { state: getScenario(subject), subject };
};

const handleOidc = async (request: IncomingMessage, response: ServerResponse) => {
  const url = new URL(request.url ?? "/", issuer);
  if (url.pathname === "/.well-known/openid-configuration") {
    return json(response, 200, {
      authorization_endpoint: `${issuer}/authorize`,
      claims_supported: ["sub", "preferred_username", "realm_access"],
      code_challenge_methods_supported: ["S256"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      id_token_signing_alg_values_supported: ["RS256"],
      issuer,
      jwks_uri: `${issuer}/jwks`,
      response_types_supported: ["code"],
      scopes_supported: ["openid", "profile", "email", "offline_access"],
      subject_types_supported: ["public"],
      token_endpoint: `${issuer}/token`,
      token_endpoint_auth_methods_supported: ["client_secret_basic", "client_secret_post"],
      userinfo_endpoint: `${issuer}/userinfo`,
    });
  }
  if (url.pathname === "/jwks") {
    return json(response, 200, {
      keys: [{ ...publicJwk, alg: "RS256", kid: "acceptance-key", use: "sig" }],
    });
  }
  if (url.pathname === "/authorize" && request.method === "GET") {
    if (url.searchParams.get("client_id") !== clientId) {
      return json(response, 400, { error: "invalid_client" });
    }
    if (url.searchParams.get("redirect_uri") !== allowedRedirect) {
      return json(response, 400, { error: "invalid_redirect_uri" });
    }
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    return response.end(
      `<!doctype html><html><body><main><h1>Acceptance identity provider</h1><form method="post" action="/authorize?${url.searchParams.toString()}"><label>Username <input name="username" value="acceptance-worker-0" /></label><label>Password <input name="password" type="password" /></label><button type="submit">Sign in</button></form></main></body></html>`,
    );
  }
  if (url.pathname === "/authorize" && request.method === "POST") {
    const form = new URLSearchParams((await readBody(request)).toString());
    const subject = form.get("username") ?? "acceptance-worker-0";
    const redirectUri = url.searchParams.get("redirect_uri") ?? "";
    const code = randomUUID();
    codes.set(code, {
      challenge: url.searchParams.get("code_challenge") ?? undefined,
      redirectUri,
      subject,
    });
    const callback = new URL(redirectUri);
    callback.searchParams.set("code", code);
    callback.searchParams.set("state", url.searchParams.get("state") ?? "");
    response.writeHead(302, { location: callback.href });
    return response.end();
  }
  if (url.pathname === "/token" && request.method === "POST") {
    const form = new URLSearchParams((await readBody(request)).toString());
    const basic = request.headers.authorization?.startsWith("Basic ")
      ? Buffer.from(request.headers.authorization.slice(6), "base64").toString().split(":")
      : [form.get("client_id"), form.get("client_secret")];
    if (basic[0] !== clientId || basic[1] !== clientSecret) {
      return json(response, 401, { error: "invalid_client" });
    }
    const code = form.get("code") ?? "";
    const pending = codes.get(code);
    if (pending?.redirectUri !== form.get("redirect_uri")) {
      return json(response, 400, { error: "invalid_grant" });
    }
    const verifier = form.get("code_verifier");
    if (pending.challenge) {
      const actual = createHash("sha256")
        .update(verifier ?? "")
        .digest("base64url");
      if (actual !== pending.challenge) {
        return json(response, 400, {
          error: "invalid_grant",
          error_description: "PKCE verification failed: incorrect code verifier",
        });
      }
    } else if (verifier) {
      // Keycloak rejects a verifier that was never matched by a challenge on /authorize
      return json(response, 400, {
        error: "invalid_grant",
        error_description:
          "PKCE verification failed: Code verifier was specified but authorization code challenge was not",
      });
    }
    codes.delete(code);
    const accessToken = createToken(pending.subject);
    return json(response, 200, {
      access_token: accessToken,
      expires_in: 3600,
      id_token: accessToken,
      refresh_token: `refresh-${pending.subject}`,
      scope: "openid profile email offline_access",
      token_type: "Bearer",
    });
  }
  if (url.pathname === "/userinfo") {
    const subject = decodeSubject(request.headers.authorization);
    return json(response, 200, { preferred_username: subject, sub: subject });
  }
  return json(response, 404, { error: "oidc-route-not-found", path: url.pathname });
};
const oidcServer = createServer((request, response) => void handleOidc(request, response));

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
      state.createdProject = {
        ...state.fixtures.projects.projects[0],
        name: form.get("name") ?? "Created project",
        private: form.get("private") === "true",
        product_id: state.createdProduct.product.id,
        project_id: fixtureIds.createdProject,
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
    if (state.launchFailure) {
      return json(
        response,
        state.launchFailure,
        state.launchFailure === 403
          ? state.fixtures.failures.forbidden
          : state.fixtures.failures.serverError,
      );
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
    if (state.launchFailure) {
      return json(
        response,
        state.launchFailure,
        state.launchFailure === 403
          ? state.fixtures.failures.forbidden
          : state.fixtures.failures.serverError,
      );
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
const dataManagerServer = createServer(
  (request, response) => void handleDataManager(request, response),
);

type UnitFixture = ScenarioState["fixtures"]["units"]["units"][number]["units"][number];

const findUnitGroup = (state: ScenarioState, unitId: string) =>
  state.fixtures.units.units.find((group) => group.units.some((unit) => unit.id === unitId));

const findUnit = (state: ScenarioState, unitId: string): UnitFixture | undefined =>
  findUnitGroup(state, unitId)?.units.find((unit) => unit.id === unitId);

const personalUnitOf = (state: ScenarioState): UnitFixture | undefined =>
  state.fixtures.units.units.find(
    (group) => group.organisation.id === fixtureIds.defaultOrganisation,
  )?.units[0];

const organisationsOf = (state: ScenarioState) => state.fixtures.organisations.organisations;

/**
 * What the Account Server itself declares about a privacy value, restated here from the generated
 * value names rather than imported from the application. This double answers for the server, so its
 * rejection rule stays independent of the rule the screens under test apply.
 */
type FixturePrivacy = UnitAllDetailDefaultProductPrivacy;
const requiresItsPrivacy = (privacy: FixturePrivacy) => privacy.startsWith("ALWAYS_");
const isPrivate = (privacy: FixturePrivacy) => privacy.endsWith("PRIVATE");

/** Both generated patch resources accept the same two fields and leave anything absent alone. */
type ResourcePatchBody = { default_product_privacy?: FixturePrivacy; name?: string };

const readResourcePatch = async (request: IncomingMessage): Promise<ResourcePatchBody> =>
  JSON.parse((await readBody(request)).toString()) as ResourcePatchBody;

const applyResourcePatch = <
  TResource extends { default_product_privacy: FixturePrivacy; name: string },
>(
  resource: TResource,
  body: ResourcePatchBody,
) => {
  resource.name = body.name ?? resource.name;
  resource.default_product_privacy =
    body.default_product_privacy ?? resource.default_product_privacy;
};

/** A single addressed organisation or unit read fails with the body its status describes. */
const addressedReadFailure = (state: ScenarioState, response: ServerResponse) =>
  json(
    response,
    state.addressedReadFailure ?? 503,
    state.addressedReadFailure === 403
      ? state.fixtures.failures.forbidden
      : state.fixtures.failures.serverError,
  );

const changeMembers = (users: { id: string }[], userId: string, add: boolean) => {
  if (add) {
    if (!users.some((user) => user.id === userId)) {
      users.push({ id: userId });
    }
    return users;
  }
  return users.filter((user) => user.id !== userId);
};

/** What the generated product patch accepts, restated here rather than imported. */
type SubscriptionAdjustment = { allowance?: number; limit?: number; name?: string };

type ProductFixture = ProductDmProjectTier | ProductDmStorage;

/** A subscription reports what it was adjusted to, so a read after a change is not the old one. */
const adjustedProduct = (state: ScenarioState, product: ProductFixture): ProductFixture => {
  const adjustment = state.subscriptionAdjustments.get(product.product.id);
  if (!adjustment) {
    return product;
  }
  return {
    ...product,
    coins: {
      ...product.coins,
      allowance: adjustment.allowance ?? product.coins.allowance,
      limit: adjustment.limit ?? product.coins.limit,
    },
    product: { ...product.product, name: adjustment.name ?? product.product.name },
  };
};

/** Every subscription that exists right now, whichever fixture or command produced it. */
const existingProducts = (state: ScenarioState): ProductFixture[] =>
  [
    ...(state.fixtures.products.products as ProductFixture[]),
    ...(state.createdProduct ? [state.createdProduct] : []),
    ...(state.createdStorageProduct ? [state.createdStorageProduct] : []),
  ]
    .filter(({ product }) => !state.deletedSubscriptions.includes(product.id))
    .map((product) => adjustedProduct(state, product));

/**
 * Every subscription addressable by its own resource, which includes the ones the caller's index
 * never lists, so a product readable outside that index is not mistaken for a missing one.
 */
const addressableProducts = (state: ScenarioState): Map<string, ProductFixture> => {
  const unlisted = [
    state.fixtures.screeningProduct,
    state.fixtures.partnerProduct,
    state.fixtures.unlistedProjectProduct,
    state.fixtures.storageProduct,
  ] as ProductFixture[];
  const products = [
    ...unlisted
      .filter(({ product }) => !state.deletedSubscriptions.includes(product.id))
      .map((product) => adjustedProduct(state, product)),
    ...existingProducts(state),
  ];
  return new Map(products.map((product) => [product.product.id, product]));
};

const handleAccountServer = async (request: IncomingMessage, response: ServerResponse) => {
  cors(request, response);
  if (request.method === "OPTIONS") {
    return response.end();
  }
  const url = new URL(request.url ?? "/", acceptanceEnvironment.ACCOUNT_SERVER_API_SERVER);
  const { state } = record(request, url);
  const segments = url.pathname.split("/").filter(Boolean);
  const isWrite = request.method !== "GET";
  if (isWrite && state.accessFailure) {
    await readBody(request);
    return json(
      response,
      state.accessFailure,
      state.accessFailure === 403
        ? state.fixtures.failures.forbidden
        : state.fixtures.failures.serverError,
    );
  }
  if (url.pathname === "/event-stream/version") {
    return json(response, 200, state.fixtures.eventStream);
  }
  if (url.pathname === "/user/account") {
    return state.semanticsFailure
      ? json(response, state.semanticsFailure, state.fixtures.failures.serverError)
      : json(response, 200, state.fixtures.callerAccount);
  }
  if (url.pathname === "/default/organisation") {
    return state.semanticsFailure
      ? json(response, state.semanticsFailure, state.fixtures.failures.serverError)
      : json(response, 200, state.fixtures.defaultOrganisation);
  }
  if (url.pathname === "/personal-unit" && request.method === "GET") {
    if (state.semanticsFailure) {
      return json(response, state.semanticsFailure, state.fixtures.failures.serverError);
    }
    const personalUnit = personalUnitOf(state);
    return personalUnit
      ? json(response, 200, personalUnit)
      : json(response, 404, { error: "fixture-personal-unit-not-found" });
  }
  if (url.pathname === "/personal-unit" && request.method === "PUT") {
    await readBody(request);
    if (personalUnitOf(state)) {
      return json(response, 409, { error: "fixture-personal-unit-exists" });
    }
    const personalUnit = state.fixtures.personalUnit;
    state.fixtures.units.units.push({
      count: 1,
      organisation: state.fixtures.defaultOrganisationDetail,
      units: [personalUnit],
    });
    return json(response, 201, {
      id: personalUnit.id,
      organisation_id: fixtureIds.defaultOrganisation,
    });
  }
  if (url.pathname === "/personal-unit" && request.method === "DELETE") {
    state.fixtures.units.units = state.fixtures.units.units.filter(
      (group) => group.organisation.id !== fixtureIds.defaultOrganisation,
    );
    return json(response, 204, undefined);
  }
  if (url.pathname === "/organisation" && request.method === "POST") {
    const body = JSON.parse((await readBody(request)).toString()) as {
      name: string;
      owner: string;
    };
    organisationsOf(state).push({
      caller_is_member: true,
      created: state.fixtures.organisation.created,
      default_product_privacy: "DEFAULT_PRIVATE",
      id: fixtureIds.createdOrganisation,
      name: body.name,
      owner_id: body.owner,
      private: true,
      users: [],
    });
    return json(response, 201, { id: fixtureIds.createdOrganisation });
  }
  if (url.pathname === "/organisation") {
    return json(response, 200, state.fixtures.organisations);
  }
  if (segments[0] === "organisation" && segments[2] === "unit" && request.method === "POST") {
    const body = JSON.parse((await readBody(request)).toString()) as { name: string };
    const organisation = organisationsOf(state).find((candidate) => candidate.id === segments[1]);
    if (!organisation) {
      return json(response, 404, { error: "fixture-organisation-not-found" });
    }
    const created: UnitFixture = {
      billing_day: 1,
      caller_is_member: true,
      created: organisation.created,
      default_product_privacy: "DEFAULT_PRIVATE",
      id: fixtureIds.createdUnit,
      name: body.name,
      owner_id: state.fixtures.subject,
      private: true,
      users: [{ id: state.fixtures.subject }],
    };
    const group = state.fixtures.units.units.find(
      (candidate) => candidate.organisation.id === organisation.id,
    );
    group
      ? group.units.push(created)
      : state.fixtures.units.units.push({ count: 1, organisation, units: [created] });
    return json(response, 201, { id: created.id });
  }
  if (segments[0] === "organisation" && segments[2] === "unit") {
    const group = state.fixtures.units.units.find(
      (candidate) => candidate.organisation.id === segments[1],
    );
    if (group) {
      return json(response, 200, group);
    }
    // An organisation that holds no unit answers with none of them, because having no unit is not
    // a failure to read one. Only an organisation that does not exist is absent.
    const organisation = organisationsOf(state).find((candidate) => candidate.id === segments[1]);
    return organisation
      ? json(response, 200, { count: 0, organisation, units: [] })
      : json(response, 404, { error: "fixture-organisation-not-found" });
  }
  if (segments[0] === "organisation" && segments[2] === "user" && segments.length === 4) {
    const organisation = organisationsOf(state).find((candidate) => candidate.id === segments[1]);
    if (!organisation) {
      return json(response, 404, { error: "fixture-organisation-not-found" });
    }
    organisation.users = changeMembers(
      organisation.users,
      decodeURIComponent(segments[3]),
      request.method === "PUT",
    );
    return json(response, 204, undefined);
  }
  if (segments[0] === "unit" && segments[2] === "user" && segments.length === 4) {
    const unit = findUnit(state, segments[1]);
    if (!unit) {
      return json(response, 404, { error: "fixture-unit-not-found" });
    }
    unit.users = changeMembers(
      unit.users,
      decodeURIComponent(segments[3]),
      request.method === "PUT",
    );
    return json(response, 204, undefined);
  }
  if (segments[0] === "unit" && segments.length === 2 && request.method === "PATCH") {
    const body = await readResourcePatch(request);
    const unit = findUnit(state, segments[1]);
    if (!unit) {
      return json(response, 404, { error: "fixture-unit-not-found" });
    }
    // The Account Server accepts a unit privacy only while it does not conflict with its
    // organisation's, so a requiring organisation rejects the opposite visibility outright.
    const organisation = findUnitGroup(state, segments[1])?.organisation;
    if (
      body.default_product_privacy &&
      organisation &&
      requiresItsPrivacy(organisation.default_product_privacy) &&
      isPrivate(organisation.default_product_privacy) !== isPrivate(body.default_product_privacy)
    ) {
      return json(response, 409, {
        error: "The unit privacy conflicts with its organisation's value",
      });
    }
    applyResourcePatch(unit, body);
    return json(response, 200, {});
  }
  if (segments[0] === "unit" && segments.length === 2 && request.method === "DELETE") {
    const group = findUnitGroup(state, segments[1]);
    if (!group) {
      return json(response, 404, { error: "fixture-unit-not-found" });
    }
    group.units = group.units.filter((unit) => unit.id !== segments[1]);
    return json(response, 204, undefined);
  }
  if (segments[0] === "unit" && segments.length === 2 && request.method === "GET") {
    if (state.addressedReadFailure) {
      return addressedReadFailure(state, response);
    }
    // The unlisted unit answers for itself while `/unit` never groups it, so a direct link to a
    // readable resource outside the caller's index is not the same as an absent resource.
    const unit =
      segments[1] === fixtureIds.unlistedUnit
        ? state.fixtures.unlistedUnit
        : findUnit(state, segments[1]);
    return unit
      ? json(response, 200, unit)
      : json(response, 404, { error: "fixture-unit-not-found" });
  }
  if (segments[0] === "organisation" && segments.length === 2 && request.method === "PATCH") {
    const body = await readResourcePatch(request);
    const organisation = organisationsOf(state).find((candidate) => candidate.id === segments[1]);
    if (!organisation) {
      return json(response, 404, { error: "fixture-organisation-not-found" });
    }
    applyResourcePatch(organisation, body);
    // Units answer with the organisation they are grouped under, so the ancestry a unit inherits
    // stays the same object the organisation resource itself reports.
    const group = state.fixtures.units.units.find(
      (candidate) => candidate.organisation.id === organisation.id,
    );
    if (group) {
      group.organisation = organisation;
    }
    return json(response, 200, {});
  }
  if (segments[0] === "organisation" && segments.length === 2) {
    if (state.addressedReadFailure) {
      return addressedReadFailure(state, response);
    }
    const organisation =
      segments[1] === fixtureIds.unlistedOrganisation
        ? state.fixtures.unlistedOrganisation
        : organisationsOf(state).find((candidate) => candidate.id === segments[1]);
    return organisation
      ? json(response, 200, organisation)
      : json(response, 404, { error: "fixture-organisation-not-found" });
  }
  if (url.pathname === `/charges/organisation/${fixtureIds.organisation}`) {
    if (state.chargeFailure) {
      return json(response, state.chargeFailure, state.fixtures.failures.serverError);
    }
    return json(response, 200, state.fixtures.organisationCharges);
  }
  if (url.pathname === `/charges/unit/${fixtureIds.unit}`) {
    if (state.chargeFailure) {
      return json(response, state.chargeFailure, state.fixtures.failures.serverError);
    }
    return json(response, 200, state.fixtures.unitCharges);
  }
  if (url.pathname === `/charges/product/${fixtureIds.product}`) {
    if (state.chargeFailure) {
      return json(response, state.chargeFailure, state.fixtures.failures.serverError);
    }
    return json(response, 200, state.fixtures.productCharges);
  }
  if (url.pathname === "/unit") {
    return state.unitsReadFailure
      ? json(response, state.unitsReadFailure, state.fixtures.failures.serverError)
      : json(response, 200, state.fixtures.units);
  }
  if (url.pathname === "/product") {
    if (state.productFailure) {
      return json(response, 503, state.fixtures.failures.serverError);
    }
    const products = existingProducts(state);
    return json(response, 200, { count: products.length, products });
  }
  if (url.pathname === "/product-type") {
    return json(response, 200, {
      count: 3,
      product_types: ["EVALUATION", "BRONZE", "SILVER"].map((flavour) => ({
        flavour,
        type: "DATA_MANAGER_PROJECT_TIER_SUBSCRIPTION",
      })),
    });
  }
  // A unit's own subscriptions. A unit the fixture never subscribed answers with an empty
  // collection rather than an error, because having no subscription is not a failure to read one.
  if (segments[0] === "product" && segments[1] === "unit" && segments.length === 3) {
    if (state.productFailure) {
      return json(response, 503, state.fixtures.failures.serverError);
    }
    if (request.method === "POST") {
      const body = JSON.parse((await readBody(request)).toString()) as {
        allowance?: number;
        flavour?: "BRONZE" | "EVALUATION" | "GOLD" | "SILVER";
        limit?: number;
        name?: string;
        type?: string;
      };
      // A storage subscription is the one Subscriptions itself creates; a project tier is created
      // by the project-creation workflow, and the two are told apart by the type they ask for.
      if (body.type === "DATA_MANAGER_STORAGE_SUBSCRIPTION") {
        if (state.subscriptionMutationFailure) {
          return json(
            response,
            state.subscriptionMutationFailure,
            state.fixtures.failures.serverError,
          );
        }
        const storageUnit = state.fixtures.units.units
          .flatMap(({ units }) => units)
          .find(({ id }) => id === segments[2]);
        if (!storageUnit) {
          return json(response, 404, { error: "fixture-unit-not-found" });
        }
        const storageBase = state.fixtures.storageProduct as ProductDmStorage;
        state.createdStorageProduct = {
          ...storageBase,
          coins: {
            ...storageBase.coins,
            allowance: body.allowance ?? storageBase.coins.allowance,
            limit: body.limit ?? body.allowance ?? storageBase.coins.limit,
          },
          product: {
            ...storageBase.product,
            id: fixtureIds.createdStorageProduct,
            name: body.name,
          },
          unit: storageUnit,
        };
        return json(response, 201, { id: fixtureIds.createdStorageProduct });
      }
      if (state.productCreationFailure) {
        return json(
          response,
          state.productCreationFailure,
          state.productCreationFailure === 400
            ? { error: "fixture-product-domain-failure" }
            : state.fixtures.failures.serverError,
        );
      }
      if (state.productCreationDelay) {
        await delay(state.productCreationDelay);
      }
      const base = state.fixtures.products.products[0] as ProductDmProjectTier;
      const unit = state.fixtures.units.units
        .flatMap(({ units }) => units)
        .find(({ id }) => id === segments[2]);
      if (!unit) {
        return json(response, 404, { error: "fixture-unit-not-found" });
      }
      state.createdProduct = {
        ...base,
        claim: undefined,
        product: {
          ...base.product,
          flavour: body.flavour ?? "BRONZE",
          id: fixtureIds.createdProduct,
          name: body.name,
          type: "DATA_MANAGER_PROJECT_TIER_SUBSCRIPTION",
        },
        unit,
      };
      return json(response, 201, { id: fixtureIds.createdProduct });
    }
    const listed = state.fixtures.unitProducts[segments[2]] ?? { count: 0, products: [] };
    const products = [
      ...listed.products,
      ...(state.createdProduct?.unit.id === segments[2] ? [state.createdProduct] : []),
      ...(state.createdStorageProduct?.unit.id === segments[2]
        ? [state.createdStorageProduct]
        : []),
    ];
    return json(response, 200, { count: products.length, products });
  }
  // The subscription the project-creation workflow owns keeps its own cleanup behaviour, which is
  // the one deletion that is not a Subscriptions command.
  if (url.pathname === `/product/${fixtureIds.createdProduct}` && state.createdProduct) {
    if (request.method === "DELETE") {
      if (state.cleanupFailure) {
        return json(response, state.cleanupFailure, state.fixtures.failures.serverError);
      }
      state.createdProduct = undefined;
      return json(response, 204, undefined);
    }
    return json(response, 200, { product: state.createdProduct });
  }
  // Every other subscription answers for itself, and for the adjustment and deletion it was asked
  // for, so what one command changed is what every later read of it reports.
  if (segments[0] === "product" && segments.length === 2) {
    const productId = segments[1];
    const product = addressableProducts(state).get(productId);
    if (!product) {
      return json(response, 404, { error: "as-product-not-found", productId });
    }
    const changes = request.method === "PATCH" || request.method === "DELETE";
    if (changes && state.subscriptionMutationFailure) {
      return json(response, state.subscriptionMutationFailure, state.fixtures.failures.serverError);
    }
    if (request.method === "DELETE") {
      state.deletedSubscriptions.push(productId);
      return json(response, 204, undefined);
    }
    if (request.method === "PATCH") {
      const body = JSON.parse((await readBody(request)).toString()) as SubscriptionAdjustment;
      state.subscriptionAdjustments.set(productId, {
        ...state.subscriptionAdjustments.get(productId),
        ...body,
      });
      return json(response, 200, { id: productId });
    }
    return json(response, 200, { product });
  }
  if (url.pathname === "/version") {
    return json(response, 200, state.fixtures.accountServerVersion);
  }
  return json(response, 404, { error: "as-route-not-found", path: url.pathname });
};
const accountServer = createServer(
  (request, response) => void handleAccountServer(request, response),
);

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
    });
  }
  if (url.pathname.endsWith("/product-failure") && request.method === "POST") {
    getScenario(subject).productFailure = true;
    return json(response, 200, { productFailure: true, subject });
  }
  const creationDelayControls = [
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
    if (![403, 503].includes(status)) {
      return json(response, 400, { error: "unsupported-launch-failure", status });
    }
    getScenario(subject).launchFailure = status as 403 | 503;
    return json(response, 200, { launchFailure: status, subject });
  }
  if (url.pathname.endsWith("/launch-failure") && request.method === "DELETE") {
    getScenario(subject).launchFailure = undefined;
    return json(response, 200, { subject });
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
const controlServer = createServer((request, response) => void handleControl(request, response));

const listen = (server: ReturnType<typeof createServer>, port: number, name: string) =>
  new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      console.log(`${name} fixture listening on http://127.0.0.1:${port}`);
      resolve();
    });
  });

const close = () => {
  oidcServer.close();
  dataManagerServer.close();
  accountServer.close();
  controlServer.close();
};
process.once("SIGINT", close);
process.once("SIGTERM", close);

void Promise.all([
  listen(oidcServer, Number(new URL(acceptanceUrls.oidc).port), "OIDC"),
  listen(dataManagerServer, Number(new URL(acceptanceUrls.dataManager).port), "Data Manager"),
  listen(accountServer, Number(new URL(acceptanceUrls.accountServer).port), "Account Server"),
  listen(controlServer, Number(new URL(acceptanceUrls.control).port), "Control"),
]);
