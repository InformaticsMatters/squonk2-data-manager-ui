import { isAxiosError } from "axios";

import { isFetchRuntimeFailure } from "../api/runtime/classifyTransportFailure";
import { getErrorMessage, noErrorInformation } from "../utils/next/orvalError";

/**
 * What a failure is shown as, and whether it is also worth an engineer's attention.
 *
 * `report` is a Sentry capture. A service refusing a request accounts for itself and is the system
 * working as designed, however unwelcome the answer; a value this client cannot read at all is a
 * defect in this client, and that is the only thing reporting is for.
 */
export type EnqueuedFailure = { message: string; report: boolean };

/** What is said about a value nothing here can read a reason from. */
const unknownFailureMessage = "An unknown error occurred. This has been reported.";

/**
 * What a failure said of itself, for a value that certainly is one: `getErrorMessage` answers
 * `null` only for a value that is no error at all, which neither transport below can hand over.
 */
const statedBy = (failure: unknown): string => getErrorMessage(failure) ?? noErrorInformation;

/**
 * How a failure is presented to a person, for every shape one reaches the snackbar in.
 *
 * Axios rejections are what the generated hooks throw today; a string is a sentence the caller
 * wrote itself and needs nothing added to it. The Fetch runtime beside them does not throw on a
 * non-2xx at all — it returns the body, the status and the headers — so a perfectly ordinary
 * refusal arriving through it is read for its reason by the same extractor, rather than being
 * called unknown and reported as though the client had failed to understand it.
 *
 * The one thing a Fetch answer does not carry is the transport's own words: there is no reason
 * phrase and no message behind the body, so where the extractor reaches its placeholder the status
 * is all that is left to state.
 */
export const failureToEnqueue = (error: unknown): EnqueuedFailure => {
  if (isAxiosError(error)) {
    return { message: statedBy(error), report: false };
  }
  if (isFetchRuntimeFailure(error)) {
    const stated = statedBy(error);
    return {
      message:
        stated === noErrorInformation ? `Request failed with status ${error.status}` : stated,
      report: false,
    };
  }
  if (typeof error === "string") {
    return { message: error, report: false };
  }
  return { message: unknownFailureMessage, report: true };
};
