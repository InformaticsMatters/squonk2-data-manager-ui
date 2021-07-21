import React, { FC, useState } from 'react';

import type { InstanceSummary } from '@squonk/data-manager-client';

import { Button } from '@material-ui/core';

import { JobModalContent } from '../ExecutionsCard/JobModalContent';

interface RerunJobButtonProps {
  instance: InstanceSummary;
}

export const RerunJobButton: FC<RerunJobButtonProps> = ({ instance }) => {
  const [open, setOpen] = useState(false);

  return instance.job_id !== undefined ? (
    <>
      <Button color="primary" onClick={() => setOpen(true)}>
        Run again
      </Button>
      <JobModalContent
        instance={instance}
        jobId={instance.job_id}
        open={open}
        projectId={instance.project_id}
        onClose={() => setOpen(false)}
      />
    </>
  ) : null;
};
