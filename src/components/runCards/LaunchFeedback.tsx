import { Alert } from "@mui/material";

import { type LaunchAttempt, launchStatement } from "../../projects/runLaunch";

/**
 * Where the launch beside it stands. Every answer is presented inside the definition that was
 * launched, so a rejection and a recoverable failure are both read where the next step is, and
 * neither costs the caller the modal, its route, or anything they entered.
 */
export const LaunchFeedback = ({ attempt }: { attempt: LaunchAttempt }) => {
  const statement = launchStatement(attempt);

  return statement ? (
    <Alert severity={statement.severity} sx={{ mt: 1 }}>
      {statement.message}
    </Alert>
  ) : null;
};
