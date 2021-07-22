import type { FC } from 'react';
import React, { useState } from 'react';

import { Button, Tooltip } from '@material-ui/core';

import type { ProjectId } from '../state/currentProjectHooks';
import { useSelectedFiles } from '../state/FileSelectionContext';
import { JobModalContent } from './JobModalContent';

interface JobModalProps {
  projectId: ProjectId;
  jobId: number;
}

export const JobModal: FC<JobModalProps> = ({ projectId, jobId }) => {
  const selectedFilesState = useSelectedFiles();

  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  if (selectedFilesState) {
    const tooltipTitle = selectedFilesState.selectedFiles.length
      ? 'Run this job'
      : 'Please select some files on the data tab first';
    return (
      <>
        <Tooltip arrow title={tooltipTitle}>
          <span>
            <Button
              color="primary"
              disabled={!selectedFilesState.selectedFiles.length}
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
          <JobModalContent
            jobId={jobId}
            open={open}
            projectId={projectId}
            onClose={() => setOpen(false)}
          />
        )}
      </>
    );
  } else {
    return (
      <Tooltip title="Please select a project first">
        <span>
          <Button disabled color="primary">
            Run
          </Button>
        </span>
      </Tooltip>
    );
  }
};
