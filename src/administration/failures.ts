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

/** Names an Administration resource in command feedback without disclosing anything beyond its ID. */
export const administrationResourceLabel = {
  newOrganisation: "an organisation",
  organisation: (organisationId: string) => `organisation ${organisationId}`,
  personalUnit: "your personal unit",
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
