import { type TransportFailure } from "../api/runtime/classifyTransportFailure";

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
