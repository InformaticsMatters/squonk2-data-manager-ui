import {
  AppApiDatasetPostDatasetVersionMetaBody,
  AppApiDatasetPostDatasetVersionMetaResponse,
} from "@/api/data-manager/metadata/zod";

import { createHash, createPrivateKey, generateKeyPairSync, randomUUID, sign } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
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
    realm_access: { roles: ["data-manager-user", "account-server-user"] },
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
  },
  {
    error: "unsupported-dataset-content-failure",
    pathSuffix: "/dataset-content-failure",
    stateKey: "datasetContentFailure",
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

const record = (request: IncomingMessage, path: string) => {
  const authorization = request.headers.authorization;
  const subject = decodeSubject(authorization);
  const requestRecord: RequestRecord = {
    authorization,
    method: request.method ?? "GET",
    path,
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
    if (pending.challenge) {
      const actual = createHash("sha256")
        .update(form.get("code_verifier") ?? "")
        .digest("base64url");
      if (actual !== pending.challenge) {
        return json(response, 400, { error: "invalid_grant" });
      }
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
  const { state } = record(request, url.pathname);
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
    return json(response, 202, state.fixtures.uploadResponse);
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
    return json(response, 200, state.fixtures.projects);
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
  if (url.pathname === "/type") {
    return json(response, 200, state.fixtures.types);
  }
  if (url.pathname === "/user") {
    return json(response, 200, state.fixtures.users);
  }
  if (url.pathname === "/version") {
    return json(response, 200, state.fixtures.dataManagerVersion);
  }
  if (url.pathname.startsWith("/task/")) {
    const taskId = url.pathname.slice("/task/".length);
    const deletionVersion = state.deletionTaskVersions.get(taskId);
    if (taskId !== fixtureIds.task && deletionVersion === undefined) {
      return json(response, 404, { error: "fixture-task-not-found" });
    }
    if (state.taskFailure) {
      return json(response, state.taskFailure, state.fixtures.failures.serverError);
    }
    const pollingIndex =
      deletionVersion === undefined
        ? state.pollingIndex
        : (state.deletionPollingIndexes.get(taskId) ?? 0);
    const index = Math.min(pollingIndex, state.fixtures.taskTransitions.length - 1);
    if (deletionVersion === undefined) {
      state.pollingIndex += 1;
    } else {
      state.deletionPollingIndexes.set(taskId, pollingIndex + 1);
    }
    const task = state.fixtures.taskTransitions[index];
    const responseTask =
      task.done && state.deletionExitCode !== undefined
        ? { ...task, exit_code: state.deletionExitCode }
        : task;
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
      return json(response, state.datasetContentFailure, state.fixtures.failures.serverError);
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
  const { state } = record(request, url.pathname);
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
    const body = JSON.parse((await readBody(request)).toString()) as {
      default_product_privacy?: UnitFixture["default_product_privacy"];
      name?: string;
    };
    const unit = findUnit(state, segments[1]);
    if (!unit) {
      return json(response, 404, { error: "fixture-unit-not-found" });
    }
    unit.name = body.name ?? unit.name;
    unit.default_product_privacy = body.default_product_privacy ?? unit.default_product_privacy;
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
    const unit = findUnit(state, segments[1]);
    return unit
      ? json(response, 200, unit)
      : json(response, 404, { error: "fixture-unit-not-found" });
  }
  if (segments[0] === "organisation" && segments.length === 2) {
    const organisation = organisationsOf(state).find((candidate) => candidate.id === segments[1]);
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
    return json(response, 200, state.fixtures.products);
  }
  if (url.pathname === `/product/${fixtureIds.product}`) {
    return json(response, 200, { product: state.fixtures.products.products[0] });
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
      pollingIndex: state.pollingIndex,
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
    if (![429, 503].includes(status)) {
      return json(response, 400, { error: datasetFailureControl.error, status });
    }
    getScenario(subject)[datasetFailureControl.stateKey] = status as 429 | 503;
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
