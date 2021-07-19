import React, { FC, useState } from 'react';

import { useCreateInstance } from '@squonk/data-manager-client/instance';
import { useGetJob } from '@squonk/data-manager-client/job';

import { Button, Grid, Tooltip, Typography } from '@material-ui/core';
import Form from '@rjsf/material-ui';

import { ModalWrapper } from '../Modals/ModalWrapper';
import { useCurrentProjectId } from '../state/currentProjectHooks';
import { useSelectedFiles } from '../state/FileSelectionContext';
import { JobInputFields } from './JobInputFields';

interface JobSpecification {
  collection: string;
  job: string;
  version: string;
  variables: { [key: string]: string | string[] };
}

interface JobModalProps {
  jobId: number;
  disabled?: boolean;
}

export const JobModal: FC<JobModalProps> = ({ jobId, disabled }) => {
  const [open, setOpen] = useState(false);

  const { projectId } = useCurrentProjectId();

  const { mutateAsync: createInstance } = useCreateInstance();
  const { data: job } = useGetJob(jobId); // Get extra details about the job

  // Data to populate file/dir inputs
  const selectedFilesState = useSelectedFiles();

  // Control for generated options form
  const [optionsFormData, setOptionsFormData] = useState<any>(null);

  // Control for the inputs fields
  const [inputsData, setInputsData] = useState({});

  const handleSubmit = async () => {
    if (projectId && job) {
      // Construct the specification
      const specification: JobSpecification = {
        collection: job.collection,
        job: job.job,
        version: job.version,
        variables: { ...inputsData, ...optionsFormData },
      };

      await createInstance({
        data: {
          application_id: job.application.application_id,
          application_version: 'v1',
          as_name: 'Test',
          project_id: projectId,
          specification: JSON.stringify(specification),
        },
      });

      setOpen(false);
    }
  };

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
              disabled={!job || !selectedFilesState.selectedFiles.length || disabled}
              onClick={() => setOpen(true)}
            >
              Run
            </Button>
          </span>
        </Tooltip>
        <ModalWrapper
          id={`job-${jobId}`}
          open={open}
          submitText="Run"
          title={job?.name ?? 'Run Job'}
          onClose={() => setOpen(false)}
          onSubmit={handleSubmit}
        >
          {job?.variables && (
            <Grid container spacing={2}>
              {job.variables.inputs && (
                <>
                  <Grid item xs={12}>
                    <Typography gutterBottom component="h3" variant="subtitle1">
                      <b>Inputs</b>
                    </Typography>
                  </Grid>
                  <JobInputFields
                    inputs={job.variables.inputs as any}
                    setInputsData={setInputsData}
                  />
                </>
              )}

              <Grid item xs={12}>
                {job.variables.options && (
                  <>
                    <Typography gutterBottom component="h3" variant="subtitle1">
                      <b>Options</b>
                    </Typography>
                    <Form
                      liveValidate
                      noHtml5Validate
                      formData={optionsFormData}
                      schema={job.variables.options as any}
                      // TODO: fix when openapi is updated
                      showErrorList={false}
                      uiSchema={{ 'ui:order': (job.variables as any)?.order?.options }}
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
