import type { FC } from 'react';
import React, { useState } from 'react';
import { useQueryClient } from 'react-query';

import type { InstanceSummary, JobSummary } from '@squonk/data-manager-client';
import { getGetInstancesQueryKey, useCreateInstance } from '@squonk/data-manager-client/instance';
import { useGetJob } from '@squonk/data-manager-client/job';

import { Grid, TextField, Typography } from '@material-ui/core';
import type { FormProps } from '@rjsf/core';
import dynamic from 'next/dynamic';

import { CenterLoader } from '../CenterLoader';
import { ModalWrapper } from '../Modals/ModalWrapper';
import type { ProjectId } from '../state/currentProjectHooks';
import type { JobInputFieldsProps } from './JobInputFields';

const JobInputFields = dynamic<JobInputFieldsProps>(
  () => import('./JobInputFields').then((mod) => mod.JobInputFields),
  {
    loading: () => <CenterLoader />,
  },
);

const Form = dynamic<FormProps<any>>(() => import('@rjsf/material-ui'), {
  loading: () => <CenterLoader />,
});

export type InputData = Record<string, string | string[] | undefined>;

interface JobSpecification {
  collection: string;
  job: string;
  version: string;
  variables: { [key: string]: string | string[] };
}

interface JobModalProps {
  jobId: JobSummary['id'];
  open: boolean;
  projectId: ProjectId;
  instance?: InstanceSummary; // Allow loading form values from a previous instance
  onClose: () => void;
  onRun?: () => void;
}

export const JobModal: FC<JobModalProps> = ({
  jobId,
  projectId,
  instance,
  open,
  onClose,
  onRun,
}) => {
  // ? Can we guarantee every job has a parsable spec?

  const queryClient = useQueryClient();

  const [nameState, setNameState] = useState(instance?.name ?? '');

  const { mutate: createInstance } = useCreateInstance();
  // Get extra details about the job
  const { data: job } = useGetJob(jobId);

  const name = nameState || (job?.job ?? '');

  const spec = instance?.application_specification;
  const specVariables =
    spec !== undefined
      ? (JSON.parse(spec).variables as Record<string, string | string[] | undefined>)
      : undefined;

  // Control for generated options form
  const [optionsFormData, setOptionsFormData] = useState<any>(specVariables ?? null);

  // Control for the inputs fields
  const [inputsData, setInputsData] = useState<InputData>({});

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

  console.log(job);

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
      {job !== undefined && projectId !== undefined ? (
        <>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Job name"
                value={name} // Give a default instance name of job.job
                onChange={(event) => setNameState(event.target.value)}
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
                    initialValues={specVariables}
                    inputs={JSON.parse(job.variables.inputs)}
                    inputsData={inputsData}
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
                      schema={JSON.parse(job.variables.options)}
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
