import { type AsError } from "@squonk/account-server-client";
import { type DmError } from "@squonk/data-manager-client";

import { type AxiosError } from "axios";

const getMessageFromResponse = <TError>(error: AxiosError<TError>, field: keyof TError) => {
  const apiErrorData = error.response?.data;
  return apiErrorData?.[field];
};

type APIErrorResponse = AsError | DmError;
type AError = AxiosError<APIErrorResponse>;
type OldAError = AxiosError<{ detail: string }>;

const isAPIError = (error: unknown): error is APIErrorResponse =>
  typeof (error as APIErrorResponse).error === "string";

/**
 * @param error The Axios Error object from which to extract the human error message
 * @returns a string message from the error that hopefully described what went wrong
 */
export const getErrorMessage = (error: APIErrorResponse | AxiosError | null): string => {
  // if we have an error, we try and extract info
  if (error) {
    if (isAPIError(error)) {
      return error.error;
    }

    try {
      // first try get the information assuming is's a well formed API error object
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
      if (error.message.length > 0) {
        return error.message;
      }

      return JSON.stringify(error.toJSON());
    }
  }

  // we haven't got a message from the error
  return "Error: no information provided";
};
