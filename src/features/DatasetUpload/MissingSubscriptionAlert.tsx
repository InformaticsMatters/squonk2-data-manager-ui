import { Alert, AlertTitle, Button } from "@mui/material";
import Link from "next/link";

import { type DatasetSubscriptionRecovery } from "../../datasets/uploadBilling";

export interface MissingSubscriptionAlertProps {
  /** Absent while what this caller could do about the missing subscription is still unknown. */
  recovery?: DatasetSubscriptionRecovery;
  unitName: string;
}

/**
 * A billing unit with no dataset subscription. The alert never clears the form: the files and names
 * already entered stay exactly as they are, so the caller can recover the subscription and upload
 * the same batch. Administration is only offered to a caller who could create the subscription
 * there; everyone else is told who can, and nobody is told anything until it is known which.
 */
export const MissingSubscriptionAlert = ({ recovery, unitName }: MissingSubscriptionAlertProps) => (
  <Alert
    action={
      recovery?.kind === "administration" ? (
        <Button color="inherit" component={Link} href={recovery.href} size="small">
          Go to Subscriptions
        </Button>
      ) : undefined
    }
    severity="warning"
    sx={{ mb: 2 }}
  >
    <AlertTitle>{unitName} has no dataset subscription</AlertTitle>
    {recovery === undefined
      ? "Checking what you can do about this."
      : recovery.kind === "administration"
        ? "Create a dataset subscription for this unit in Administration, then upload this batch without re-entering it."
        : recovery.reason}
  </Alert>
);
