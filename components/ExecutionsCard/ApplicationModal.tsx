import React, { FC, useState } from 'react';

import { ApplicationSummary } from '@squonk/data-manager-client';

import { Button, Tooltip } from '@material-ui/core';

import { ProjectId } from '../state/projectPathHooks';
import { ApplicationModalContent } from './ApplicationModalContents';

interface ApplicationModalProps {
  applicationId: ApplicationSummary['application_id'];
  projectId: ProjectId;
}

export const ApplicationModal: FC<ApplicationModalProps> = ({ applicationId, projectId }) => {
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  return (
    <>
      <Tooltip arrow title="Launch application">
        <span>
          <Button
            color="primary"
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
        <ApplicationModalContent
          applicationId={applicationId}
          open={open}
          projectId={projectId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
};
