import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from 'react-query';

import type { DmError, InstanceSummary, JobSummary } from '@squonk/data-manager-client';
import { getGetInstancesQueryKey, useCreateInstance } from '@squonk/data-manager-client/instance';
import { useGetJob } from '@squonk/data-manager-client/job';

import { Box, Grid, TextField, Typography } from '@material-ui/core';
import type { FormProps } from '@rjsf/core';
import dynamic from 'next/dynamic';

import { useEnqueueError } from '../../../hooks/useEnqueueStackError';
import { CenterLoader } from '../../CenterLoader';
import { ModalWrapper } from '../../modals/ModalWrapper';
import type { CommonModalProps } from '../types';
import type { InputSchema, JobInputFieldsProps } from './JobInputFields';

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

export interface JobModalProps extends CommonModalProps {
  /**
   * ID of the job to instantiate
   */
  jobId: JobSummary['id'];
  /**
   * An existing instance of this job from which fields take their default values.
   * Allows loading form values from a previous instance
   */
  instance?: InstanceSummary;
}

/**
 * Modal with options to create a new instance if a job. An instance can be passed to inherit
 * default values.
 */
export const JobModal = ({
  jobId,
  projectId,
  instance,
  open,
  onClose,
  onLaunch,
}: JobModalProps) => {
  // ? Can we guarantee every job has a parsable spec?

  const queryClient = useQueryClient();
  const { enqueueError, enqueueSnackbar } = useEnqueueError<DmError>();

  const [nameState, setNameState] = useState(instance?.name ?? '');

  const { mutateAsync: createInstance } = useCreateInstance();
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

  const inputsDefault = useMemo(() => {
    // Parse the inputs schema which is untyped
    const inputs: InputSchema | undefined = JSON.parse(job?.variables?.inputs ?? '{}');
    // Access the default values and use them for the "initial" values for state
    return Object.entries(inputs?.properties ?? {})
      .filter(([, schema]) => schema.default !== undefined)
      .map(([key, { default: defaultValue }]) => [key, defaultValue as string] as const);
  }, [job]);

  const [inputsData, setInputsData] = useState<InputData>({});

  // Since the default value are obtained async, we have to wait for them to arrive in order to set
  useEffect(() => {
    setInputsData(Object.fromEntries(inputsDefault));
  }, [inputsDefault]);

  const handleSubmit = async () => {
    if (projectId && job) {
      // Construct the specification
      const specification: JobSpecification = {
        collection: job.collection,
        job: job.job,
        version: job.version,
        variables: { ...inputsData, ...optionsFormData },
      };
      try {
        await createInstance({
          data: {
            application_id: job.application.application_id,
            application_version: 'v1',
            as_name: name,
            project_id: projectId,
            specification: JSON.stringify(specification),
          },
        });
        await queryClient.invalidateQueries(getGetInstancesQueryKey({ project_id: projectId }));
      } catch (error) {
        enqueueError(error);
      } finally {
        onLaunch && onLaunch();
        onClose();
      }
    } else {
      enqueueSnackbar('No project provided', { variant: 'warning' });
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
      {job !== undefined && projectId !== undefined ? (
        <>
          <Box p={2}>
            <TextField
              fullWidth
              label="Job name"
              value={name} // Give a default instance name of job.job
              onChange={(event) => setNameState(event.target.value)}
            />
          </Box>

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
                    onChange={setInputsData}
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
