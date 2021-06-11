import React, { FC, useState } from 'react';

import { Button, Grid, Tooltip, Typography } from '@material-ui/core';
import Form from '@rjsf/material-ui';
import { useCreateInstance, useGetJob } from '@squonk/data-manager-client';

import { useCurrentProjectId } from '../CurrentProjectContext';
import { useSelectedFiles } from '../DataTable/FileSelectionContext';
import { ModalWrapper } from '../ModalWrapper';
import { JobInputFields } from './JobInputFields';

interface JobSpecification {
  collection: string;
  job: string;
  version: string;
  variables: { [key: string]: string | string[] };
}

interface JobModalProps {
  jobId: number;
}

export const JobModal: FC<JobModalProps> = ({ jobId }) => {
  const [open, setOpen] = useState(false);

  const [projectId] = useCurrentProjectId();
  const { data: job } = useGetJob(jobId); // Get extra details about the job

  // Data to populate file/dir inputs
  const selectedFilesState = useSelectedFiles();

  // Control for generated options form
  const [optionsFormData, setOptionsFormData] = useState<any>(null);

  // Control for the inputs fields
  const [inputsData, setInputsData] = useState({});

  const createInstanceMutation = useCreateInstance();
  const handleRunJob = async () => {
    if (projectId && job) {
      // Construct the specification
      const specification: JobSpecification = {
        collection: job.collection,
        job: job.job,
        version: job.version,
        variables: { ...inputsData, ...optionsFormData },
      };

      if (projectId && process.env.NEXT_PUBLIC_JOBS_APPID) {
        const instance = await createInstanceMutation.mutateAsync({
          data: {
            application_id: process.env.NEXT_PUBLIC_JOBS_APPID,
            application_version: 'v1',
            as_name: 'Test',
            project_id: projectId,
            specification: JSON.stringify(specification),
          },
        });

        // instance.task_id
      }
      // We run a job via the instance endpoint

      setOpen(false);
    }
  };

  if (selectedFilesState) {
    return (
      <>
        <Tooltip
          arrow
          title={
            selectedFilesState.selectedFiles.length
              ? 'Run this job'
              : 'Please select some files on the data tab first'
          }
        >
          <span>
            <Button
              color="primary"
              disabled={!job || !selectedFilesState.selectedFiles.length}
              onClick={() => setOpen(true)}
            >
              Run
            </Button>
          </span>
        </Tooltip>
        <ModalWrapper
          title="Run Job"
          submitText="Run"
          open={open}
          onClose={() => setOpen(false)}
          onSubmit={handleRunJob}
        >
          {job && (
            <Grid container spacing={2}>
              {job.variables.inputs && (
                <>
                  <Grid item xs={12}>
                    <Typography gutterBottom variant="subtitle1" component="h3">
                      <b>Inputs</b>
                    </Typography>
                  </Grid>
                  <JobInputFields
                    setInputsData={setInputsData}
                    inputs={job.variables.inputs as any}
                  />
                </>
              )}

              <Grid item xs={12}>
                {job.variables.options && (
                  <>
                    <Typography gutterBottom variant="subtitle1" component="h3">
                      <b>Options</b>
                    </Typography>
                    <Form
                      showErrorList={false}
                      liveValidate
                      noHtml5Validate
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
