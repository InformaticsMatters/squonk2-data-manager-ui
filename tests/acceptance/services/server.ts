import {
  type ProductDmProjectTier,
  type UnitAllDetailDefaultProductPrivacy,
} from "@/api/account-server";
import {
  AppApiDatasetPostDatasetVersionMetaBody,
  AppApiDatasetPostDatasetVersionMetaResponse,
} from "@/api/data-manager/metadata/zod";

import { createHash, createPrivateKey, generateKeyPairSync, randomUUID, sign } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { setTimeout as delay } from "node:timers/promises";
import { z } from "zod";

import { acceptanceEnvironment, acceptanceUrls } from "../environment";
import { datasetContentFixtures, fixtureIds, isScenarioProfile } from "./fixtures";
import { getScenario, type RequestRecord, resetScenario, type ScenarioState } from "./state";

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
  response.setHeader("access-control-allow-methods", "DELETE,GET,POST,PUT,OPTIONS");
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

/** One project command rejection, so a refusal and a transport failure are told apart by status. */
const projectMutationFailure = (state: ScenarioState, response: ServerResponse) =>
  json(
    response,
    state.projectMutationFailure ?? 503,
    state.projectMutationFailure === 403
      ? state.fixtures.failures.forbidden
      : state.fixtures.failures.serverError,
  );

/** The result tasks a project owns; a project that ran none owns an empty collection. */
const resultTasksOf = (state: ScenarioState, projectId: string) =>
  Object.entries(state.fixtures.resultTasks).find(([owner]) => owner === projectId)?.[1] ?? {
    count: 0,
    tasks: [],
  };

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
  const { state } = record(request, url);
  const segments = url.pathname.split("/").filter(Boolean);
  if (url.pathname === "/dataset" && request.method === "GET") {
    if (state.datasetFailure) {
      return json(response, state.datasetFailure, state.fixtures.failures.serverError);
    }
    return json(response, 200, state.fixtures.dataset);
  }
  if (url.pathname === "/dataset" && request.method === "POST") {
    state.upload = {
      body: await readBody(request),
      contentType: request.headers["content-type"] ?? "",
    };
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
    const projects = state.createdProject
      ? [...state.fixtures.projects.projects, state.createdProject]
      : state.fixtures.projects.projects;
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
      const instances = state.fixtures.instances.instances.filter(
        (instance) => instance.project_id === projectId,
      );
      return json(response, 200, { count: instances.length, instances });
    }
    if (url.pathname === "/task") {
      return json(response, 200, resultTasksOf(state, projectId));
    }
    const runningWorkflows = state.fixtures.runningWorkflows.running_workflows.filter(
      (workflow) => workflow.project.id === projectId,
    );
    return json(response, 200, {
      count: runningWorkflows.length,
      running_workflows: runningWorkflows,
    });
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
  if (segments[0] === "instance" && segments.length === 2 && request.method === "GET") {
    const instance = state.fixtures.instances.instances.find(
      (candidate) => candidate.id === segments[1],
    );
    const instanceTask =
      instance?.project_id === fixtureIds.project
        ? fixtureIds.resultTask
        : fixtureIds.screeningResultTask;
    return instance
      ? json(response, 200, {
          ...instance,
          has_valid_callback_token: false,
          outputs: {},
          tasks: [{ id: instanceTask, purpose: "CREATE" }],
        })
      : json(response, 404, { error: "fixture-instance-not-found" });
  }
  if (segments[0] === "running-workflow" && segments[2] === "steps") {
    return json(response, 200, { count: 0, running_workflow_steps: [] });
  }
  if (segments[0] === "running-workflow" && segments.length === 2 && request.method === "GET") {
    const workflow = state.fixtures.runningWorkflows.running_workflows.find(
      (candidate) => candidate.id === segments[1],
    );
    return workflow
      ? json(response, 200, {
          ...workflow,
          done: true,
          running_user: state.fixtures.subject,
          success: true,
          variables: {},
        })
      : json(response, 404, { error: "fixture-running-workflow-not-found" });
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
  if (url.pathname === `/project/${fixtureIds.screeningProject}`) {
    const screening = state.fixtures.projects.projects.find(
      (candidate) => candidate.project_id === fixtureIds.screeningProject,
    );
    return screening
      ? json(response, 200, screening)
      : json(response, 404, { error: "fixture-project-not-found" });
  }
  if (url.pathname === `/project/${fixtureIds.project}`) {
    if (state.projectFailure) {
      const body =
        state.projectFailure === 403
          ? state.fixtures.failures.forbidden
          : state.projectFailure === 503
            ? state.fixtures.failures.serverError
            : { error: "fixture-not-found" };
      return json(response, state.projectFailure, body);
    }
    return json(response, 200, state.fixtures.projects.projects[0]);
  }
  if (url.pathname === `/project/${fixtureIds.createdProject}` && state.createdProject) {
    return json(response, 200, state.createdProject);
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
    // A result task is a settled fact of the project that ran it rather than a polling sequence.
    const resultTask = Object.values(state.fixtures.resultTasks)
      .flatMap((collection) => collection.tasks)
      .find((candidate) => candidate.id === taskId);
    if (resultTask) {
      return json(response, 200, {
        created: resultTask.created,
        done: true,
        exit_code: 0,
        purpose: resultTask.purpose,
        purpose_id: resultTask.purpose_id,
        states: [{ state: "SUCCESS", time: resultTask.created }],
      });
    }
    const deletionVersion = state.deletionTaskVersions.get(taskId);
    const isUploadTask = taskId === fixtureIds.task || state.uploadTaskIds.includes(taskId);
    if (!isUploadTask && deletionVersion === undefined) {
      return json(response, 404, { error: "fixture-task-not-found" });
    }
    if (state.taskFailure) {
      return json(response, state.taskFailure, state.fixtures.failures.serverError);
    }
    const pollingIndex =
      deletionVersion === undefined
        ? (state.pollingIndexes.get(taskId) ?? 0)
        : (state.deletionPollingIndexes.get(taskId) ?? 0);
    const index = Math.min(pollingIndex, state.fixtures.taskTransitions.length - 1);
    if (deletionVersion === undefined) {
      state.pollingIndexes.set(taskId, pollingIndex + 1);
    } else {
      state.deletionPollingIndexes.set(taskId, pollingIndex + 1);
    }
    const task = state.fixtures.taskTransitions[index];
    // A terminal exit code the scenario dictates. Deletion and upload tasks carry their own, so a
    // failing upload never has to be told apart from a failing deletion by timing.
    const exitCode = deletionVersion === undefined ? state.uploadExitCode : state.deletionExitCode;
    const responseTask =
      task.done && exitCode !== undefined ? { ...task, exit_code: exitCode } : task;
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
    return group
      ? json(response, 200, group)
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
    const products = state.createdProduct
      ? [...state.fixtures.products.products, state.createdProduct]
      : state.fixtures.products.products;
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
        flavour?: "BRONZE" | "EVALUATION" | "GOLD" | "SILVER";
        name?: string;
      };
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
    const products =
      state.createdProduct?.unit.id === segments[2]
        ? [...listed.products, state.createdProduct]
        : listed.products;
    return json(response, 200, { count: products.length, products });
  }
  if (url.pathname === `/product/${fixtureIds.product}`) {
    return json(response, 200, { product: state.fixtures.products.products[0] });
  }
  if (url.pathname === `/product/${fixtureIds.screeningProduct}`) {
    return json(response, 200, { product: state.fixtures.screeningProduct });
  }
  if (url.pathname === `/product/${fixtureIds.unlistedProduct}`) {
    return json(response, 200, { product: state.fixtures.unlistedProjectProduct });
  }
  if (url.pathname === `/product/${fixtureIds.storageProduct}`) {
    return json(response, 200, { product: state.fixtures.storageProduct });
  }
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
      pollingIndex: state.pollingIndexes.get(fixtureIds.task) ?? 0,
      requests: state.requests,
      upload: state.upload
        ? { bytes: state.upload.body.length, contentType: state.upload.contentType }
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
  if (url.pathname.endsWith("/charge-failure") && request.method === "POST") {
    const status = Number(url.searchParams.get("status"));
    if (![403, 429, 503].includes(status)) {
      return json(response, 400, { error: "unsupported-charge-failure", status });
    }
    getScenario(subject).chargeFailure = status as 403 | 429 | 503;
    return json(response, 200, { chargeFailure: status, subject });
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
