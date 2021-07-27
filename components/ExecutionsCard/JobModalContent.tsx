import type { FC } from 'react';
import React, { useState } from 'react';
import { useQueryClient } from 'react-query';

import type { InstanceSummary, JobSummary } from '@squonk/data-manager-client';
import { getGetInstancesQueryKey, useCreateInstance } from '@squonk/data-manager-client/instance';
import { useGetJob } from '@squonk/data-manager-client/job';

import { Grid, TextField, Typography } from '@material-ui/core';
import Form from '@rjsf/material-ui';

import { ModalWrapper } from '../Modals/ModalWrapper';
import { CenterLoader } from '../Operations/common/CenterLoader';
import type { ProjectId } from '../state/currentProjectHooks';
import { JobInputFields } from './JobInputFields';

interface JobSpecification {
  collection: string;
  job: string;
  version: string;
  variables: { [key: string]: string | string[] };
}

interface JobModalContentProps {
  jobId: JobSummary['id'];
  open: boolean;
  projectId: ProjectId;
  instance?: InstanceSummary; // Allow loading form values from a previous instance
  onClose: () => void;
  onRun?: () => void;
}

export const JobModalContent: FC<JobModalContentProps> = ({
  jobId,
  projectId,
  instance,
  open,
  onClose,
  onRun,
}) => {
  // ? Can we guarantee every job has a parsable spec?

  const queryClient = useQueryClient();

  const [name, setName] = useState(instance?.name ?? '');

  const { mutate: createInstance } = useCreateInstance();
  // Get extra details about the job
  const { data: job } = useGetJob(jobId);

  const spec = instance?.application_specification;
  const variables =
    spec !== undefined
      ? (JSON.parse(spec).variables as Record<string, string | string[] | undefined>)
      : undefined;

  // Control for generated options form
  const [optionsFormData, setOptionsFormData] = useState<any>(variables ?? null);

  // Control for the inputs fields
  const [inputsData, setInputsData] = useState({});

  const handleSubmit = () => {
    if (projectId && job) {
      // Construct the specification
      const specification: JobSpecification = {
        collection: job.collection,
        job: job.job,
        version: job.version,
        variables: { ...inputsData, ...optionsFormData },
      };

      createInstance(
        {
          data: {
            application_id: job.application.application_id,
            application_version: 'v1',
            as_name: name,
            project_id: projectId,
            specification: JSON.stringify(specification),
          },
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries(getGetInstancesQueryKey({ project_id: projectId }));

            onRun && onRun();
            onClose();
          },
        },
      );
    }
  };

  return (
    <ModalWrapper
      DialogProps={{ maxWidth: 'sm', fullWidth: true }}
      id={`job-${jobId}`}
      open={open}
      submitText="Run"
      title={job?.name ?? 'Run Job'}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      {job !== undefined ? (
        <>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Job name"
                value={name || job.job} // Give a default instance name of job.job
                onChange={(event) => setName(event.target.value)}
              />
            </Grid>
          </Grid>
          {job.variables && (
            <Grid container spacing={2}>
              {job.variables.inputs && (
                <>
                  <Grid item xs={12}>
                    <Typography component="h3" variant="subtitle1">
                      <b>Inputs</b>
                    </Typography>
                  </Grid>
                  <JobInputFields
                    initialValues={variables}
                    inputs={job.variables.inputs as any}
                    projectId={projectId}
                    setInputsData={setInputsData}
                  />
                </>
              )}

              <Grid item xs={12}>
                {job.variables.options && (
                  <>
                    <Typography component="h3" variant="subtitle1">
                      <b>Options</b>
                    </Typography>
                    <Form
                      liveValidate
                      noHtml5Validate
                      formData={optionsFormData}
                      schema={job.variables.options as any} // TODO: fix when openapi is updated
                      showErrorList={false}
                      uiSchema={{ 'ui:order': job.variables.order?.options }}
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
        </>
      ) : (
        <CenterLoader />
      )}
    </ModalWrapper>
  );
};
