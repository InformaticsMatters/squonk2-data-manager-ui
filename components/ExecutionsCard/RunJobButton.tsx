import type { FC } from 'react';
import React, { useState } from 'react';

import { Button, Tooltip } from '@material-ui/core';

import type { ProjectId } from '../../hooks/currentProjectHooks';
import { JobModal } from './JobModal';

interface RunJobButtonProps {
  projectId: ProjectId;
  jobId: number;
  onRun?: () => void;
}

export const RunJobButton: FC<RunJobButtonProps> = ({ projectId, jobId, onRun }) => {
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  return (
    <>
      <Tooltip arrow title="Run this job">
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
        <JobModal
          jobId={jobId}
          open={open}
          projectId={projectId}
          onClose={() => setOpen(false)}
          onRun={onRun}
        />
      )}
    </>
  );
};
