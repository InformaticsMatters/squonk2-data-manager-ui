import { createHash, createPrivateKey, generateKeyPairSync, randomUUID, sign } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import { acceptanceEnvironment } from "../environment";
import { decodeSubject, encode, json, readBody } from "./http";
import { getScenario } from "./state";

/**
 * The test-only identity provider. It completes the real Better Auth flow rather than bypassing it,
 * so authentication, the returned realm roles, and the deep link a login returns to are all
 * exercised exactly as they are in production.
 */

const issuer = acceptanceEnvironment.KEYCLOAK_URL;
const clientId = acceptanceEnvironment.KEYCLOAK_CLIENT_ID;
const clientSecret = acceptanceEnvironment.KEYCLOAK_CLIENT_SECRET;
const allowedRedirect = `${acceptanceEnvironment.BASE_URL}${acceptanceEnvironment.BASE_PATH}/api/auth/callback/keycloak`;
const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const privateKeyObject = createPrivateKey(privateKey.export({ format: "pem", type: "pkcs8" }));
const publicJwk = publicKey.export({ format: "jwk" });
const codes = new Map<string, { challenge?: string; redirectUri: string; subject: string }>();
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
  if (url.pathname === "/protocol/openid-connect/logout") {
    // RP-initiated logout, which the application relies on to return the caller to public Home.
    // Only the callback origin this provider already trusts is honoured as a return address.
    const requested = url.searchParams.get("post_logout_redirect_uri");
    const allowedOrigin = new URL(allowedRedirect).origin;
    const destination =
      requested && new URL(requested).origin === allowedOrigin ? requested : allowedOrigin;
    response.writeHead(302, { location: destination });
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
export const oidcServer = createServer((request, response) => void handleOidc(request, response));
