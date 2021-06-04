import { FC, useState } from 'react';

import { Button, Typography } from '@material-ui/core';
import Form from '@rjsf/material-ui';
import { useGetJob } from '@squonk/data-manager-client';

import { ModalWrapper } from '../ModalWrapper';

interface JobModalProps {
  jobId: number;
}

export const JobModal: FC<JobModalProps> = ({ jobId }) => {
  const [open, setOpen] = useState(false);
  const { data: job } = useGetJob(jobId);
  console.log(JSON.stringify(job?.variables, null, 2));
  return (
    <>
      <Button color="primary" disabled={!job} onClick={() => setOpen(true)}>
        Run
      </Button>
      <ModalWrapper title="Run Job" submitText="Run" open={open} onClose={() => setOpen(false)}>
        {job && (
          <>
            <Typography variant="subtitle1" component="h3">
              <b>Options</b>
            </Typography>
            <Form schema={job.variables.options as any}>
              <div />
            </Form>
          </>
        )}
      </ModalWrapper>
    </>
  );
};
