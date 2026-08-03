import { createHash, createPrivateKey, generateKeyPairSync, randomUUID, sign } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import { acceptanceEnvironment, acceptanceUrls } from "../environment";
import { binaryFixture, fixtureIds, isScenarioProfile } from "./fixtures";
import { getScenario, type RequestRecord, resetScenario } from "./state";

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

const cors = (request: IncomingMessage, response: ServerResponse) => {
  response.setHeader("access-control-allow-headers", "authorization,content-type");
  response.setHeader("access-control-allow-methods", "GET,POST,PUT,OPTIONS");
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
    return json(response, 200, state.fixtures.dataset);
  }
  if (url.pathname === "/dataset" && request.method === "POST") {
    state.upload = {
      body: await readBody(request),
      contentType: request.headers["content-type"] ?? "",
    };
    return json(response, 202, state.fixtures.uploadResponse);
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
  if (url.pathname === `/task/${fixtureIds.task}`) {
    const index = Math.min(state.pollingIndex, state.fixtures.taskTransitions.length - 1);
    state.pollingIndex += 1;
    return json(response, 200, state.fixtures.taskTransitions[index]);
  }
  if (url.pathname === `/dataset/${fixtureIds.dataset}/1`) {
    response.writeHead(200, {
      "content-length": binaryFixture.length,
      "content-type": "application/octet-stream",
    });
    return response.end(binaryFixture);
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

const accountServer = createServer((request, response) => {
  cors(request, response);
  if (request.method === "OPTIONS") {
    return response.end();
  }
  const url = new URL(request.url ?? "/", acceptanceEnvironment.ACCOUNT_SERVER_API_SERVER);
  const { state } = record(request, url.pathname);
  if (url.pathname === "/event-stream/version") {
    return json(response, 200, state.fixtures.eventStream);
  }
  if (url.pathname === "/organisation") {
    return json(response, 200, state.fixtures.organisations);
  }
  if (url.pathname === `/organisation/${fixtureIds.organisation}`) {
    return json(response, 200, state.fixtures.organisation);
  }
  if (url.pathname === `/organisation/${fixtureIds.otherOrganisation}`) {
    return json(response, 200, state.fixtures.otherOrganisation);
  }
  if (url.pathname === "/unit") {
    return json(response, 200, state.fixtures.units);
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
});

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
