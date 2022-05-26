import { useState } from 'react';

import { Button, Tooltip } from '@mui/material';

import type { ApplicationModalProps } from './ApplicationModal';
import { ApplicationModal } from './ApplicationModal';

export type ApplicationModalButtonProps = Pick<
  ApplicationModalProps,
  'onLaunch' | 'applicationId' | 'projectId'
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
