import { type NotSuccessful, type Successful } from "./plaintextViewerSSR";

/** One answer the viewer transport gave: the bytes it delivered, or the status it failed with. */
export type ViewerContent = NotSuccessful | Successful;

export type ViewerContentOutcome =
  | { kind: "content"; content: Successful }
  | { kind: "failed"; statusCode: number; statusMessage: string }
  | { kind: "missing" }
  | { kind: "recoverable" };

/**
 * What one transport answer means for the resource named by the URL. A refusal and an absence are
 * the same non-disclosing outcome, and any answer that cannot establish absence stays retryable
 * against the same resource, so a network failure, a timeout, a rate limit, or an outage is never
 * presented as a resource that is not there.
 *
 * Dataset versions and project files read the same transport and fail in exactly the same ways, so
 * they share this rule rather than each keeping a copy of it; what each family does not share is
 * what it discloses, which stays with the family that owns the resource.
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
    return { kind: "missing" };
  }
  if (statusCode === 401 || statusCode === 429 || statusCode >= 500) {
    return { kind: "recoverable" };
  }
  return { kind: "failed", statusCode, statusMessage };
};
