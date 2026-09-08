import { classifyTransportFailure } from "../api/runtime/classifyTransportFailure";
import { apiFailureReason } from "../utils/next/orvalError";

/**
 * What a failed read of the addressed project was, and what follows from it.
 *
 * The kinds differ in what they are a fact *about*, which is what decides everything else. Only
 * `unavailable` is an answer about the project, so only it discards what is held for the project;
 * a lapsed session and a malformed address say nothing about the project at all, and a project the
 * caller still has must be there when they come back to it.
 */
export type ProjectWorkspaceFailure = {
  /** Whether what is held for this project — its cache entries and its place in recents — goes. */
  discardsProject: boolean;
  kind: "malformed-address" | "session-lapsed" | "unavailable" | "unreadable";
  message: string;
  /** The route back offered beside the message, or none where nothing the caller does can help. */
  remedy: "none" | "reauthenticate" | "retry";
  severity: "error" | "warning";
};

/**
 * How one failed project read reads, and what it costs.
 *
 * A refused token is the credential the caller presented, not the project they addressed: the
 * project has said nothing, so nothing about it is claimed, nothing held for it is discarded, and
 * the route offered is the one that can actually recover — signing in again. Reading that refusal
 * as the project's own answer is what told a caller whose session merely lapsed that their projects
 * were gone, and evicted them so that they still were after signing back in.
 *
 * A `400` on a read addressed by one identifier can only be about that identifier, because the
 * identifier is the whole of what the request carried. The service's own words for it are a JSON
 * Schema dump, so the sentence is this client's: it names the address that cannot be a project, and
 * offers no retry, because retrying the same address can never do anything else.
 */
export const resolveProjectWorkspaceFailure = (
  error: unknown,
  projectId: string,
): ProjectWorkspaceFailure => {
  switch (classifyTransportFailure(error).kind) {
    // A refusal and an absence read identically, so comparing the two can never reveal whether a
    // project the caller may not read exists.
    case "forbidden":
    case "not-found":
      return {
        discardsProject: true,
        kind: "unavailable",
        message: "This project is unavailable or you no longer have access.",
        remedy: "none",
        severity: "warning",
      };
    case "token-refused":
      return {
        discardsProject: false,
        kind: "session-lapsed",
        message:
          "Your session has expired, so this project could not be read. Sign in again to open it; nothing about the project has changed.",
        remedy: "reauthenticate",
        severity: "warning",
      };
    case "bad-request":
      return {
        discardsProject: false,
        kind: "malformed-address",
        message: `“${projectId}” is not a project identifier, so no project could be opened. Check the link you followed, or open the project from the projects list.`,
        remedy: "none",
        severity: "warning",
      };
    // Every other transport fact says nothing about the project, so the read is worth making again
    // rather than being believed. They are named rather than defaulted, so a new kind has to be
    // answered here instead of quietly arriving as something the caller is told to retry.
    case "conflict":
    case "method-not-allowed":
    case "network":
    case "rate-limited":
    case "server":
    case "timeout":
    case "unknown":
    case "unprocessable":
    case "unsupported-media-type":
      return {
        discardsProject: false,
        kind: "unreadable",
        message: "Project data could not be loaded. Retry this project.",
        remedy: "retry",
        severity: "error",
      };
  }
};

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
    // A refused token is the caller's session rather than this command, and until that is answered
    // as its own thing it reads as the refusal it always read as.
    case "forbidden":
    case "not-found":
    case "token-refused":
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
    // Each rejection status the classifier now names — a managed file that cannot be deleted, a
    // conversion that failed, a project that must keep an administrator — still says what an
    // unclassifiable failure said, so naming them changes nothing here yet.
    case "bad-request":
    case "conflict":
    case "method-not-allowed":
    case "unknown":
    case "unprocessable":
    case "unsupported-media-type":
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
    case "token-refused":
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
    // instead of quietly arriving as the service's own words. The rejection statuses named for the
    // first time are answered as they were while they were unclassifiable: by the service's own
    // words, which is already the best sentence any of them has.
    case "bad-request":
    case "conflict":
    case "method-not-allowed":
    case "not-found":
    case "unknown":
    case "unprocessable":
    case "unsupported-media-type":
      return (
        apiFailureReason(error) ?? `The ${subject} could not be created. Correct it and retry.`
      );
  }
};

/**
 * How a recoverable project-deletion failure reads. Removing a project spans the same two services
 * as creating one, so the sentence names the subject the workflow was addressing when it failed.
 * A deletion request creates nothing, which is why an ambiguous transport fact still reads as
 * something to send again rather than as an outcome that has to be reconciled first.
 */
export const projectDeletionFailureReason = (
  error: unknown,
  subject: "project" | "subscription",
) => {
  switch (classifyTransportFailure(error).kind) {
    case "forbidden":
    case "token-refused":
      return `The server did not allow this ${subject} to be deleted. Review your access and retry.`;
    case "network":
      return `The ${subject} deletion request could not reach the service. Check your connection and retry.`;
    case "rate-limited":
      return `The ${subject} service is busy. Wait briefly and retry.`;
    case "server":
      return `The ${subject} service is unavailable. Retry when it has recovered.`;
    case "timeout":
      return `The ${subject} deletion request timed out. Its outcome could not be confirmed.`;
    case "bad-request":
    case "conflict":
    case "method-not-allowed":
    case "not-found":
    case "unknown":
    case "unprocessable":
    case "unsupported-media-type":
      return apiFailureReason(error) ?? `The ${subject} could not be deleted. Retry is available.`;
  }
};

/**
 * How a failed unit creation in a named organisation reads.
 *
 * A unit creates nothing but itself — no subscription, no project — so there is nothing to recover
 * and nothing partially made to describe: every sentence says what stopped it and what to do next.
 * An answer the transport cannot classify is deliberately left unnamed, so the shared error
 * presentation states the service's own words rather than this client inventing a reason for them.
 */
export const unitCreationFailureReason = (error: unknown): string | undefined => {
  switch (classifyTransportFailure(error).kind) {
    case "forbidden":
    case "token-refused":
      return "The server did not allow a unit to be created in this organisation. Review your access and retry.";
    case "not-found":
      return "This organisation is no longer available, so nothing was created.";
    case "network":
      return "The unit request could not reach the Account Server. Check your connection and retry.";
    case "rate-limited":
      return "The Account Server is busy. Wait briefly and retry.";
    case "server":
      return "The Account Server is unavailable. Retry when it has recovered.";
    case "timeout":
      return "The unit request timed out. Its outcome could not be confirmed; check your units before retrying.";
    case "bad-request":
    case "conflict":
    case "method-not-allowed":
    case "unknown":
    case "unprocessable":
    case "unsupported-media-type":
      return undefined;
  }
};

/**
 * How a failed personal-unit creation reads. There is exactly one personal unit and it is the
 * caller's own, so a duplicate attempt is never presented here: the caller of this command settles
 * that by reading `GET /personal-unit` back, and only a unit that still does not exist reaches
 * these words.
 */
export const personalUnitCreationFailureReason = (error: unknown) => {
  switch (classifyTransportFailure(error).kind) {
    case "forbidden":
    case "token-refused":
      return "The server did not allow a personal unit to be created for you. Review your access and retry.";
    case "network":
      return "The personal-unit request could not reach the Account Server. Check your connection and retry.";
    case "rate-limited":
      return "The Account Server is busy. Wait briefly and retry.";
    case "server":
      return "The Account Server is unavailable. Retry when it has recovered.";
    case "timeout":
      return "The personal-unit request timed out. Retry is safe: only one personal unit can exist.";
    case "bad-request":
    case "conflict":
    case "method-not-allowed":
    case "not-found":
    case "unknown":
    case "unprocessable":
    case "unsupported-media-type":
      return (
        apiFailureReason(error) ?? "Your personal unit could not be created. Retry is available."
      );
  }
};
