import React, { FC, useState } from 'react';

import { Button, Tooltip } from '@material-ui/core';

import { useSelectedFiles } from '../state/FileSelectionContext';
import { JobModalContent } from './JobModalContent';

interface JobModalProps {
  jobId: number;
  disabled?: boolean;
}

export const JobModal: FC<JobModalProps> = ({ jobId, disabled }) => {
  const selectedFilesState = useSelectedFiles();

  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  if (selectedFilesState) {
    const tooltipTitle = selectedFilesState.selectedFiles.length
      ? disabled
        ? 'This job is currently in use'
        : 'Run this job'
      : 'Please select some files on the data tab first';
    return (
      <>
        <Tooltip arrow title={tooltipTitle}>
          <span>
            <Button
              color="primary"
              disabled={!selectedFilesState.selectedFiles.length || disabled}
              onClick={() => {
                setOpen(true);
                setHasOpened(true);
              }}
            >
              Run
            </Button>
          </span>
        </Tooltip>
        {hasOpened && <JobModalContent jobId={jobId} open={open} onClose={() => setOpen(false)} />}
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
