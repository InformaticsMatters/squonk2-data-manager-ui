import { useState } from "react";

import { Button, CircularProgress, Tooltip } from "@mui/material";
import dynamic from "next/dynamic";

import type { ApplicationModalProps } from "./ApplicationModal";

const ApplicationModal = dynamic<ApplicationModalProps>(
  () => import("./ApplicationModal").then((mod) => mod.ApplicationModal),
  {
    loading: () => <CircularProgress size="1rem" />,
  },
);

export type ApplicationModalButtonProps = Pick<
  ApplicationModalProps,
  "onLaunch" | "applicationId" | "projectId"
>;

/**
 * Button controlling a modal that allows the user to create an new instance of an application
 */
export const ApplicationModalButton = ({
  applicationId,
  projectId,
  onLaunch,
}: ApplicationModalButtonProps) => {
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  return (
    <>
      <Tooltip title="Launch application">
        <span>
          <Button
            color="primary"
            disabled={!projectId}
            onClick={() => {
              setOpen(true);
              setHasOpened(true);
            }}
          >
            Run
          </Button>
        </span>
      </Tooltip>

      {hasOpened && (
        <ApplicationModal
          applicationId={applicationId}
          open={open}
          projectId={projectId}
          onClose={() => setOpen(false)}
          onLaunch={onLaunch}
        />
      )}
    </>
  );
};
