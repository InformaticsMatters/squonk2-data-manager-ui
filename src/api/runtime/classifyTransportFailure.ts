import { isAxiosError } from "axios";

export type TransportFailure =
  | { kind: "forbidden"; status: 403; cause: unknown }
  | { kind: "network"; cause: unknown }
  | { kind: "not-found"; status: 404; cause: unknown }
  | { kind: "rate-limited"; status: 429; cause: unknown }
  | { kind: "server"; status: number; cause: unknown }
  | { kind: "timeout"; cause: unknown }
  | { kind: "unknown"; status?: number; cause: unknown };

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

export const classifyTransportFailure = (cause: unknown): TransportFailure => {
  if (isTimeout(cause)) {
    return { kind: "timeout", cause };
  }

  const status = statusFrom(cause);
  if (status === 403) {
    return { kind: "forbidden", status, cause };
  }
  if (status === 404) {
    return { kind: "not-found", status, cause };
  }
  if (status === 429) {
    return { kind: "rate-limited", status, cause };
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
