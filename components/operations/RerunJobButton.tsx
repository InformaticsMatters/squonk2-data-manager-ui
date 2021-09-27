import React, { useState } from 'react';

import type { InstanceSummary } from '@squonk/data-manager-client';

import { Button } from '@material-ui/core';

import { JobModal } from '../executionsCards/JobCard/JobModal';

export interface RerunJobButtonProps {
  /**
   * Instance of the job that will be used to provide default options to rerun the job
   */
  instance: InstanceSummary;
}

/**
 * Wrapper around the *execution card* job run modal that reloads defaults from an existing instance
 */
export const RerunJobButton = ({ instance }: RerunJobButtonProps) => {
  const [open, setOpen] = useState(false);

  // If the job id is undefined, it's probably an application which we don't currently let be rerun.
  return instance.job_id !== undefined ? (
    <>
      <Button color="primary" onClick={() => setOpen(true)}>
        Run again
      </Button>
      <JobModal
        instance={instance}
        jobId={instance.job_id}
        open={open}
        projectId={instance.project_id}
        onClose={() => setOpen(false)}
      />
    </>
  ) : null;
};
