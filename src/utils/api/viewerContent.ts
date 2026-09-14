import { type NotSuccessful, type Successful } from "./plaintextViewerSSR";

/** One answer the viewer transport gave: the bytes it delivered, or the status it failed with. */
export type ViewerContent = NotSuccessful | Successful;

export type ViewerContentOutcome =
  | { kind: "content"; content: Successful }
  | { kind: "failed"; statusCode: number; statusMessage: string }
  | { kind: "recoverable" }
  | { kind: "unavailable"; statusCode: number; statusMessage: string };

/**
 * What one transport answer means for the resource named by the URL. A refusal and an absence are
 * both `unavailable` — the resource is not going to be shown — and each keeps its own status and
 * the service's own reason. Any answer that establishes neither stays retryable against the same
 * resource, so a network failure, a timeout, a rate limit, or an outage is never presented as a
 * resource that is not there.
 *
 * A refusal used to be flattened into an absence, so that comparing the two could not reveal
 * whether a resource the caller may not read exists. That is dropped. The services distinguish them
 * to anyone calling the API directly — `File does not exist (/nope.txt)` against `Project does not
 * exist (project-...)` — so the concealment held only in this UI, and all it bought was a caller
 * who could not tell a path they had mistyped from a project they had lost access to.
 *
 * Dataset versions and project files read the same transport and fail in exactly the same ways, so
 * they share this rule rather than each keeping a copy of it; what each family says about an
 * unavailable resource stays with the family that owns it.
 */
export const classifyViewerContent = (content: ViewerContent): ViewerContentOutcome => {
  if ("content" in content) {
    return { kind: "content", content };
  }
  const { statusCode, statusMessage } = content;
  if (!Number.isInteger(statusCode) || statusCode < 100) {
    return { kind: "recoverable" };
  }
  if (statusCode === 403 || statusCode === 404) {
    return { kind: "unavailable", statusCode, statusMessage };
  }
  if (statusCode === 401 || statusCode === 429 || statusCode >= 500) {
    return { kind: "recoverable" };
  }
  return { kind: "failed", statusCode, statusMessage };
};
