import { classifyTransportFailure } from "../api/runtime/classifyTransportFailure";

/**
 * What an authoritative answer to a project command was. `rejected` is the server's authorization
 * verdict, `retryable` is a transport fact that says nothing about authority, and `unknown`
 * establishes neither, so its detail belongs to the shared error presentation. Every kind carries
 * the sentence the caller shows, so no screen writes a rejection of its own.
 */
export type ProjectCommandFailure = { kind: "rejected" | "retryable" | "unknown"; message: string };

/**
 * Classifies a rejected project command. The server is the authorization authority, so a `403` is
 * reported as feedback about the attempted action alone: the displayed project, its organisation
 * identity, and the canonical route are all left exactly as they were. A refusal and a missing
 * resource read identically, so comparing the two can never reveal whether a resource the caller
 * has not read exists.
 */
export const classifyProjectCommandFailure = (
  error: unknown,
  action: string,
  resource: string,
): ProjectCommandFailure => {
  switch (classifyTransportFailure(error).kind) {
    case "forbidden":
    case "not-found":
      return {
        kind: "rejected",
        message: `You cannot ${action} ${resource}. It is unavailable or you do not have access. The displayed project has not changed.`,
      };
    case "network":
    case "rate-limited":
    case "server":
    case "timeout":
      return {
        kind: "retryable",
        message: `Could not ${action} ${resource}. The displayed project has not changed; retry is available.`,
      };
    case "unknown":
      return {
        kind: "unknown",
        message: `Could not ${action} ${resource}. The displayed project has not changed.`,
      };
  }
};
