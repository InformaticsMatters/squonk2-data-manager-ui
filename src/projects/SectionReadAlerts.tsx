import { Alert, Button } from "@mui/material";

import { type SectionReadReport } from "./sectionReads";

/**
 * What a project section tells the caller about the reads it made. A refused read and a read that
 * merely failed to refresh are reported separately, so losing access to one never withholds the
 * retry another one needs. Only the wording is the section's own; which outcomes are reported, and
 * that a retry accompanies exactly one of them, is decided here for every section alike.
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
