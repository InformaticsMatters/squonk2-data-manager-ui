import { captureException } from "@sentry/nextjs";
import { type AxiosError } from "axios";
import { useSnackbar } from "notistack";

import { getErrorMessage } from "../utils/next/orvalError";

export const useEnqueueError = <TError>() => {
  const { enqueueSnackbar, ...rest } = useSnackbar();

  const enqueueError = (error: any) => {
    const err = error as AxiosError<TError> | null | undefined;
    if (err?.isAxiosError) {
      // Axios errors propagate the API error
      enqueueSnackbar(getErrorMessage(err), { variant: "error" });
    } else if (typeof error === "string") {
      enqueueSnackbar(error, { variant: "error" });
    } else {
      // Anything else
      console.log("Logging error object from uncaught network error:");
      console.error(error);
      captureException(error);
      enqueueSnackbar("An unknown error occurred. This has been reported.", { variant: "error" });
    }
  };

  return { enqueueSnackbar, ...rest, enqueueError };
};
