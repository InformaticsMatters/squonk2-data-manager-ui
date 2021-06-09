import React, { FC, useState } from 'react';

import { Button, Grid, Tooltip, Typography } from '@material-ui/core';
import Form from '@rjsf/material-ui';
import { useGetJob } from '@squonk/data-manager-client';

import { useSelectedFiles } from '../DataTable/FileSelectionContext';
import { ModalWrapper } from '../ModalWrapper';
import { JobInputFields } from './JobInputFields';

interface JobModalProps {
  jobId: number;
}

export const JobModal: FC<JobModalProps> = ({ jobId }) => {
  const [open, setOpen] = useState(false);
  const { data: job } = useGetJob(jobId);
  const selectedFilesState = useSelectedFiles();

  const [optionsFormData, setOptionsFormData] = useState(null);

  console.log(optionsFormData);

  if (selectedFilesState) {
    return (
      <>
        <Button color="primary" disabled={!job} onClick={() => setOpen(true)}>
          Run
        </Button>
        <ModalWrapper title="Run Job" submitText="Run" open={open} onClose={() => setOpen(false)}>
          {job && (
            <Grid container spacing={2}>
              {job.variables.inputs && (
                <>
                  <Grid item xs={12}>
                    <Typography gutterBottom variant="subtitle1" component="h3">
                      <b>Inputs</b>
                    </Typography>
                  </Grid>
                  <JobInputFields inputs={job.variables.inputs as any} />
                </>
              )}

              <Grid item xs={12}>
                {job.variables.options && (
                  <>
                    <Typography gutterBottom variant="subtitle1" component="h3">
                      <b>Options</b>
                    </Typography>
                    <Form
                      schema={job.variables.options as any}
                      formData={optionsFormData}
                      onChange={(event) => setOptionsFormData(event.formData)}
                    >
                      {/* Remove the default submit button */}
                      <div />
                    </Form>
                  </>
                )}
              </Grid>
            </Grid>
          )}
        </ModalWrapper>
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
