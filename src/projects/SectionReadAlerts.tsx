import { Alert, Button } from "@mui/material";

import { AuthButton } from "../components/auth/AuthButton";
import { type SectionReadReport } from "./sectionReads";

/**
 * What a project section tells the caller about the reads it made. A refused read, a read whose
 * token was refused, and a read that merely failed to refresh are reported separately, so losing
 * access to one never withholds the retry — or the sign-in — another one needs. Only the wording
 * for the section's own content is the section's; a lapsed session is a fact about the caller
 * rather than about anything a section holds, so it reads the same wherever it is reported.
 */
export const SectionReadAlerts = ({
  onRetry,
  report,
  retryableMessage,
  unavailableMessage,
}: {
  onRetry: () => void;
  report: SectionReadReport;
  retryableMessage: string;
  unavailableMessage: string;
}) => (
  <>
    {report.unavailable ? (
      <Alert severity="warning" sx={{ mb: 2 }}>
        {unavailableMessage}
      </Alert>
    ) : null}
    {report.sessionLapsed ? (
      <Alert
        action={<AuthButton color="inherit" mode="login" size="small" />}
        severity="warning"
        sx={{ mb: 2 }}
      >
        Your session has expired, so some content could not be refreshed. What is shown is still
        yours; sign in again to work with it.
      </Alert>
    ) : null}
    {report.retryable ? (
      <Alert
        action={
          <Button color="inherit" size="small" onClick={onRetry}>
            Retry
          </Button>
        }
        severity="error"
        sx={{ mb: 2 }}
      >
        {retryableMessage}
      </Alert>
    ) : null}
  </>
);
