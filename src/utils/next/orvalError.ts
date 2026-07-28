import { type AsError } from "@/api/account-server";
import { type DmError } from "@/api/data-manager";

import { nullEmptyString } from "../text";

type AxiosLikeError<TError = unknown> = {
  response?: { data?: TError | string; statusText?: string };
  message?: string;
  toJSON?: () => unknown;
};

const getMessageFromResponse = <TError>(error: AxiosLikeError<TError>, field: keyof TError) => {
  const apiErrorData = error.response?.data;

  if (!apiErrorData || typeof apiErrorData === "string") {
    return undefined;
  }

  return apiErrorData[field];
};

type APIErrorResponse = AsError | DmError;
type AError = AxiosLikeError<APIErrorResponse>;
type OldAError = AxiosLikeError<{ detail: string }>;

const isAPIError = (error: unknown): error is APIErrorResponse =>
  typeof (error as APIErrorResponse).error === "string";

/**
 * @param error The Axios Error object from which to extract the human error message
 * @returns a string message from the error that hopefully describes what went wrong,
 *          or `null` when no error was supplied
 */
export const getErrorMessage = (
  error: APIErrorResponse | AxiosLikeError | null | undefined,
): string | null => {
  if (!error) {
    return null;
  }

  if (isAPIError(error)) {
    return error.error;
  }

  try {
    // first try get the information assuming it's a well formed API error object
    const infoFromErrorField = getMessageFromResponse(error as AError, "error");
    if (infoFromErrorField) {
      return infoFromErrorField;
    }

    // next check if it has a detail field instead of an error field
    // some errors in the past had this
    // TODO: confirm whether or not the API can still send this type of error response
    const infoFromDetailField = getMessageFromResponse(error as OldAError, "detail");
    if (infoFromDetailField) {
      return infoFromDetailField;
    }
  } catch {
    if (error.message && error.message.length > 0) {
      return error.message;
    }

    return JSON.stringify(error.toJSON?.());
  }

  // try get an error message from the error objects, skipping "", then fallback to a generic message
  return (
    (typeof error.response?.data === "string" ? nullEmptyString(error.response.data) : null) ??
    nullEmptyString(error.response?.statusText) ??
    nullEmptyString(error.message) ??
    "Error: no information provided"
  );
};
