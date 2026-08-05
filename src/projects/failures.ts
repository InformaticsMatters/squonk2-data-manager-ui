import { classifyTransportFailure } from "../api/runtime/classifyTransportFailure";

/**
 * Presents an authoritative rejection of a project command. The server is the authorization
 * authority, so a `403` is reported as feedback about the attempted action alone: the displayed
 * project, its organisation identity, and the canonical route are all left exactly as they were.
 * A refusal and a missing resource read identically, so comparing the two can never reveal whether
 * a resource the caller has not read exists. Unknown transport facts return `undefined` so the
 * shared error presentation stays in charge.
 */
export const projectMutationFailureMessage = (
  error: unknown,
  action: string,
  resource: string,
): string | undefined => {
  switch (classifyTransportFailure(error).kind) {
    case "forbidden":
    case "not-found":
      return `You cannot ${action} ${resource}. It is unavailable or you do not have access. The displayed project has not changed.`;
    case "network":
    case "rate-limited":
    case "server":
    case "timeout":
      return `Could not ${action} ${resource}. The displayed project has not changed; retry is available.`;
    case "unknown":
      return undefined;
  }
};
