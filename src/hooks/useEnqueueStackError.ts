import { captureException } from "@sentry/nextjs";
import { useSnackbar } from "notistack";

import { failureToEnqueue } from "./enqueuedFailure";

export const useEnqueueError = () => {
  const { enqueueSnackbar, ...rest } = useSnackbar();

  const enqueueError = (error: unknown) => {
    const { message, report } = failureToEnqueue(error);

    if (report) {
      console.log("Logging error object from uncaught network error:");
      console.error(error);
      captureException(error);
    }

    enqueueSnackbar(message, { variant: "error" });
  };

  return { enqueueSnackbar, ...rest, enqueueError };
};
