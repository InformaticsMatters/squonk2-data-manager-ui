import {
  classifyTransportFailure,
  type TransportFailure,
} from "../api/runtime/classifyTransportFailure";

export type AdministrationFailurePresentation = {
  message: string;
  retryable: boolean;
  severity: "error" | "warning";
};

export const presentAdministrationFailure = (
  failure: TransportFailure,
): AdministrationFailurePresentation => {
  switch (failure.kind) {
    case "forbidden":
      return {
        message: "You do not have access to this Administration resource.",
        retryable: false,
        severity: "warning",
      };
    case "not-found":
      return {
        message: "This Administration resource is no longer available.",
        retryable: false,
        severity: "warning",
      };
    case "rate-limited":
      return {
        message: "Administration requests are temporarily rate-limited. Retry this task.",
        retryable: true,
        severity: "error",
      };
    case "timeout":
      return {
        message: "The Administration request timed out. Retry this task.",
        retryable: true,
        severity: "error",
      };
    case "network":
      return {
        message: "Administration data could not be reached. Check your connection and retry.",
        retryable: true,
        severity: "error",
      };
    case "server":
      return {
        message: "The Administration service failed to respond. Retry this task.",
        retryable: true,
        severity: "error",
      };
    case "unknown":
      return {
        message: "Administration data could not be loaded. Retry this task.",
        retryable: true,
        severity: "error",
      };
  }
};

/**
 * An authoritative read failure is answered by the addressed resource itself, so the task, its
 * navigation, and the canonical route survive. Every retryable failure stays with the task-level
 * retry boundary instead.
 */
export const administrationReadIsAuthoritative = (error: unknown): boolean =>
  !presentAdministrationFailure(classifyTransportFailure(error)).retryable;

/**
 * Which resource a refused Administration read was about. The answer differs by subject, so the
 * subject is named rather than inferred from the failure.
 */
export type AdministrationReadSubject = "organisation" | "subscription" | "unit";

/**
 * What a failed Administration read costs the screen.
 *
 * `retry` is every transport fact the resource did not answer for itself; it keeps the section
 * frame and its Retry, so recovering never costs the caller their place.
 *
 * The two authoritative answers differ by subject, and deliberately. A refused **organisation**
 * read `degrade`s: the overview is that organisation's page, but its unit list, its create actions
 * and the workspace around it do not depend on reading the organisation itself, so a permission the
 * caller does not have takes away the members and privacy sections and nothing else. This is what
 * keeps the default organisation — which refuses its own detail read to every ordinary caller —
 * from replacing the one page a new user has to reach to create their first unit.
 *
 * A refused **unit** or **subscription** read `replace`s, because a resource the caller cannot read
 * genuinely has no content to put around a degraded section.
 */
export const decideAdministrationReadFailure = (
  subject: AdministrationReadSubject,
  failure: TransportFailure,
): "degrade" | "replace" | "retry" => {
  if (presentAdministrationFailure(failure).retryable) {
    return "retry";
  }
  return subject === "organisation" ? "degrade" : "replace";
};

/** Names an Administration resource in command feedback without disclosing anything beyond its ID. */
export const administrationResourceLabel = {
  newOrganisation: "an organisation",
  organisation: (organisationId: string) => `organisation ${organisationId}`,
  personalUnit: "your personal unit",
  subscription: (productId: string) => `subscription ${productId}`,
  unit: (unitId: string) => `unit ${unitId}`,
};

/**
 * Presents an authoritative rejection of an Administration command. The displayed resource and its
 * canonical route are never changed by a rejection, so every message says so explicitly. Unknown
 * transport facts return `undefined` so the shared error presentation stays in charge.
 */
export const administrationMutationFailureMessage = (
  error: unknown,
  action: string,
  resource: string,
): string | undefined => {
  switch (classifyTransportFailure(error).kind) {
    case "forbidden":
      return `You no longer have permission to ${action} ${resource}. The displayed resource has not changed.`;
    case "not-found":
      return `${resource} is no longer available. The displayed resource has not changed.`;
    case "network":
    case "rate-limited":
    case "server":
    case "timeout":
      return `Could not ${action} ${resource}. The displayed resource has not changed; retry is available.`;
    case "unknown":
      return undefined;
  }
};

/**
 * Presents a refused unit deletion. Delete is offered only to a caller the client has already
 * confirmed may take it, and the Account Server refuses to delete a unit that still holds products,
 * so a rejection is a precondition the unit carries rather than a permission the caller lost. The
 * message names that precondition instead of the generic "permission" wording, which sent the owner
 * of a still-populated personal unit looking for an access problem that was not there.
 */
export const unitDeletionFailureMessage = (error: unknown, resource: string): string => {
  switch (classifyTransportFailure(error).kind) {
    case "not-found":
      return `${resource} is no longer available. The displayed resource has not changed.`;
    case "network":
    case "rate-limited":
    case "server":
    case "timeout":
      return `Could not delete ${resource}. The displayed resource has not changed; retry is available.`;
    case "forbidden":
    case "unknown":
      return `Could not delete ${resource}. It may still contain projects, datasets or subscriptions that must be removed first.`;
  }
};
