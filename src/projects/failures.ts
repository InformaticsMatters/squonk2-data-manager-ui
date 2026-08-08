import { isAxiosError } from "axios";

import { classifyTransportFailure } from "../api/runtime/classifyTransportFailure";

/**
 * What an authoritative answer to a project command was. `rejected` is the server's authorization
 * verdict, `retryable` is a transport fact that says nothing about authority, and `unknown`
 * establishes neither. Every kind carries the whole sentence its caller shows, so no screen writes
 * a rejection of its own and no failure is answered a second time somewhere else.
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

/**
 * How a recoverable project-creation failure reads. Bringing a project into existence spans two
 * services, so the sentence names the subject the workflow was addressing when it failed; the
 * workflow facts it was carrying are retained by its own lifecycle rather than by these words. An
 * unclassifiable answer is the service's own, which is the one case where upstream text is the
 * sentence.
 */
export const projectCreationFailureReason = (
  error: unknown,
  subject: "project" | "subscription",
) => {
  switch (classifyTransportFailure(error).kind) {
    case "forbidden":
      return `The server did not allow this ${subject} to be created. Review your access and retry.`;
    case "network":
      return `The ${subject} request could not reach the service. Check your connection and retry.`;
    case "rate-limited":
      return `The ${subject} service is busy. Wait briefly and retry.`;
    case "server":
      return `The ${subject} service is unavailable. Retry when it has recovered.`;
    case "timeout":
      return `The ${subject} request timed out. Its outcome could not be confirmed.`;
    // Every kind is named rather than defaulted, so a new transport fact has to be answered here
    // instead of quietly arriving as the service's own words.
    case "not-found":
    case "unknown": {
      const data = isAxiosError<{ error?: string; message?: string }>(error)
        ? error.response?.data
        : undefined;
      return (
        data?.error ?? data?.message ?? `The ${subject} could not be created. Correct it and retry.`
      );
    }
  }
};
