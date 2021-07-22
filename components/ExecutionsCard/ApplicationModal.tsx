import type { FC } from 'react';
import React, { useState } from 'react';

import type { ApplicationSummary } from '@squonk/data-manager-client';

import { Button, Tooltip } from '@material-ui/core';

import type { ProjectId } from '../state/currentProjectHooks';
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
