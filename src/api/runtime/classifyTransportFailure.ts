import { isAxiosError } from "axios";

import { apiFailureReason } from "../../utils/next/orvalError";

/**
 * What one rejected request was, as far as its transport can say.
 *
 * Every status these services routinely reject with is named, because a status with no kind of its
 * own arrives at the screen as an unclassifiable failure and the sentence built from it can say
 * nothing about what happened. What a kind *means* is a matter for the caller: a `409` is an
 * application that already exists to one command and a subscription that may already exist to
 * another, and neither reading belongs to the transport.
 *
 * `forbidden` and `token-refused` are both `403` and are deliberately apart. A resource refusal is
 * a fact about the resource addressed; a token refusal is a fact about the credential presented,
 * and reading the second as the first is what makes a lapsed session read as a permanent loss of
 * access.
 */
export type TransportFailure =
  | { kind: "bad-request"; status: 400; cause: unknown }
  | { kind: "conflict"; status: 409; cause: unknown }
  | { kind: "forbidden"; status: 403; cause: unknown }
  | { kind: "method-not-allowed"; status: 405; cause: unknown }
  | { kind: "network"; cause: unknown }
  | { kind: "not-found"; status: 404; cause: unknown }
  | { kind: "rate-limited"; status: 429; cause: unknown }
  | { kind: "server"; status: number; cause: unknown }
  | { kind: "timeout"; cause: unknown }
  | { kind: "token-refused"; status: 403; cause: unknown }
  | { kind: "unknown"; status?: number; cause: unknown }
  | { kind: "unprocessable"; status: 422; cause: unknown }
  | { kind: "unsupported-media-type"; status: 415; cause: unknown };

export class NetworkTransportError extends Error {
  constructor(cause: unknown) {
    super("Network request failed", { cause });
    this.name = "NetworkTransportError";
  }
}

type GeneratedFetchResponse = { data: unknown; headers: Headers; status: number };

const isGeneratedFetchResponse = (cause: unknown): cause is GeneratedFetchResponse =>
  typeof cause === "object" &&
  cause !== null &&
  "data" in cause &&
  "headers" in cause &&
  cause.headers instanceof Headers &&
  "status" in cause &&
  typeof cause.status === "number" &&
  Number.isInteger(cause.status);

/**
 * Whether this is an answer the generated Fetch runtime returned rather than threw. It resolves a
 * non-2xx exactly as it resolves a 2xx — the body, the status and the headers — so a refusal only
 * looks like a failure once its status is read, and a caller that treats every thrown value as an
 * error has to be told which of these are refusals.
 */
export const isFetchRuntimeFailure = (cause: unknown): cause is GeneratedFetchResponse =>
  isGeneratedFetchResponse(cause) && (cause.status < 200 || cause.status > 299);

const statusFrom = (cause: unknown): number | undefined => {
  if (cause instanceof Response) {
    return cause.status;
  }
  if (isAxiosError(cause)) {
    return cause.response?.status;
  }
  if (isGeneratedFetchResponse(cause)) {
    return cause.status;
  }
  return undefined;
};

const isTimeout = (cause: unknown): boolean => {
  if (isAxiosError(cause) && (cause.code === "ECONNABORTED" || cause.code === "ETIMEDOUT")) {
    return true;
  }
  return cause instanceof DOMException && cause.name === "TimeoutError";
};

const tokenWord = /\btokens?\b/iu;
const scopeWord = /\bscopes?\b/iu;

/**
 * Whether a refusal was about the credential presented rather than the resource addressed.
 *
 * Live, an expired or under-scoped token is answered `403 {"detail": "Provided token does not have
 * the required scopes. Provided: []; Required: [...]"}` — the framework's own words, in place of
 * anything about the resource, and a shape neither spec documents. That observation is the whole
 * basis for reading the body here, and it is recorded in the audit this work comes from.
 *
 * Both words are required, so a refusal that merely mentions one of them — a resource named
 * "token", a rule about scope — is still read as the resource's own answer.
 *
 * This reads a body that has already been parsed, which is what both transports hand over. A bare
 * `Response` carries its body unread and can only be awaited, so a refusal arriving as one is
 * always the resource's answer here; nothing in the application throws one.
 */
const isTokenRefusal = (cause: unknown): boolean => {
  const reason = apiFailureReason(cause);
  return reason !== null && tokenWord.test(reason) && scopeWord.test(reason);
};

export const classifyTransportFailure = (cause: unknown): TransportFailure => {
  if (isTimeout(cause)) {
    return { kind: "timeout", cause };
  }

  const status = statusFrom(cause);
  switch (status) {
    case 400:
      return { kind: "bad-request", status, cause };
    case 403:
      return { kind: isTokenRefusal(cause) ? "token-refused" : "forbidden", status, cause };
    case 404:
      return { kind: "not-found", status, cause };
    case 405:
      return { kind: "method-not-allowed", status, cause };
    case 409:
      return { kind: "conflict", status, cause };
    case 415:
      return { kind: "unsupported-media-type", status, cause };
    case 422:
      return { kind: "unprocessable", status, cause };
    case 429:
      return { kind: "rate-limited", status, cause };
    // `401` is the status both specs document for a request that carried no token at all, and it
    // is answered nowhere in this client, so it is left unnamed rather than read as a refusal of a
    // token that was presented.
    default:
      break;
  }
  if (status !== undefined && status >= 500 && status <= 599) {
    return { kind: "server", status, cause };
  }

  if (isAxiosError(cause) && cause.response === undefined) {
    return { kind: "network", cause };
  }
  if (cause instanceof NetworkTransportError) {
    return { kind: "network", cause };
  }

  return status === undefined ? { kind: "unknown", cause } : { kind: "unknown", status, cause };
};

const transientKinds = new Set<TransportFailure["kind"]>([
  "network",
  "rate-limited",
  "server",
  "timeout",
]);

/**
 * Whether this transport fact says nothing about the request itself, so the same request is still
 * worth making. It is a fact about the transport alone and decides no authority: a refusal is not
 * transient however often it is repeated.
 */
export const isTransientTransportFailure = (cause: unknown): boolean =>
  transientKinds.has(classifyTransportFailure(cause).kind);
