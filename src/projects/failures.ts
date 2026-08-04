import { classifyTransportFailure } from "../api/runtime/classifyTransportFailure";

/**
 * Presents an authoritative rejection of a project command. The server is the authorization
 * authority, so a `403` is reported as feedback about the attempted action alone: the displayed
 * project, its organisation identity, and the canonical route are all left exactly as they were,
 * and nothing is said about resources the caller has not already read. Unknown transport facts
 * return `undefined` so the shared error presentation stays in charge.
 */
export const projectMutationFailureMessage = (
  error: unknown,
  action: string,
  resource: string,
): string | undefined => {
  switch (classifyTransportFailure(error).kind) {
    case "forbidden":
      return `You do not have permission to ${action} ${resource}. The displayed project has not changed.`;
    case "not-found":
      return `${resource} is no longer available. The displayed project has not changed.`;
    case "network":
    case "rate-limited":
    case "server":
    case "timeout":
      return `Could not ${action} ${resource}. The displayed project has not changed; retry is available.`;
    case "unknown":
      return undefined;
  }
};
