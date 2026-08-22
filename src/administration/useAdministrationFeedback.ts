import { type AsError } from "@/api/account-server";

import { useEnqueueError } from "../hooks/useEnqueueStackError";
import { administrationMutationFailureMessage } from "./failures";

/**
 * Every Administration command reports the same way: success is announced, an authoritative
 * rejection explains that the displayed resource is unchanged, and anything the transport cannot
 * classify falls through to the shared error presentation.
 */
export const useAdministrationCommandFeedback = () => {
  const { enqueueError, enqueueSnackbar } = useEnqueueError<AsError>();
  return {
    announce: (message: string) => enqueueSnackbar(message, { variant: "success" }),
    /** States an already-composed failure, for a command whose rejection it explains for itself. */
    fail: (message: string) => enqueueSnackbar(message, { variant: "error" }),
    report: (error: unknown, action: string, resource: string) => {
      const message = administrationMutationFailureMessage(error, action, resource);
      message ? enqueueSnackbar(message, { variant: "error" }) : enqueueError(error);
    },
    warn: (message: string) => enqueueSnackbar(message, { variant: "warning" }),
  };
};
