import { useState } from "react";

import { useSnackbar } from "notistack";

import { classifyProjectCommandFailure } from "./failures";
import { type FileCommandOutcome, fileOutcomeMessage } from "./fileMutations";

/**
 * What one Files mutation is doing and what its last attempt answered. Every answer is reported
 * where the caller is working: the displayed project, the addressed directory, and the canonical
 * route are untouched, because a server response to a file command is feedback rather than a
 * navigation event. A rejection, a transport failure, and a change that was never sent each leave
 * the control usable, so the next step is always available without leaving the directory.
 */
export const useFileMutation = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [isPending, setIsPending] = useState(false);

  const run = async (
    action: string,
    subject: string,
    command: () => Promise<FileCommandOutcome>,
  ) => {
    setIsPending(true);
    try {
      const outcome = await command();
      enqueueSnackbar(fileOutcomeMessage(outcome), {
        variant: outcome.kind === "unchanged" ? "info" : "success",
      });
    } catch (error) {
      // Every failure is classified into the one sentence the caller shows, so a rejected command
      // is never also answered by the shared error presentation somewhere else on the page.
      const failure = classifyProjectCommandFailure(error, action, subject);
      enqueueSnackbar(failure.message, {
        variant: failure.kind === "rejected" ? "warning" : "error",
      });
    }
    setIsPending(false);
  };

  return { isPending, run };
};
