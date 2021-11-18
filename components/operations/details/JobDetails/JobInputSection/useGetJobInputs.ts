import type {
  Error as DMError,
  InstanceSummary,
  JobGetResponse,
} from '@squonk/data-manager-client';
import { useGetJob } from '@squonk/data-manager-client/job';

import type { AxiosError } from 'axios';

// Contains only fields we are interested in
type ApplicationSpecification = {
  variables: Record<string, unknown>;
};

// Contains only fields we are interested in
type JobInput = {
  title: string;
  type: 'file' | 'directory';
};

type JobInputs = {
  properties: Record<string, JobInput>;
};

/**
 * Returns provided inputs with their information. It matches the provided inputs with their
 * property definition which are provided by the GET /jobs/job_id endpoint
 */
export const useGetJobInputs = (instanceSummary: InstanceSummary) => {
  const inputsEnabled =
    instanceSummary.job_id !== undefined && instanceSummary.application_specification !== undefined;

  const { data, isLoading, isError, error } = useGetJob<JobGetResponse, AxiosError<DMError>>(
    // Since the query will be disabled if job_id is undefined, providing -1 is fine
    instanceSummary.job_id ?? -1,
    {
      query: { enabled: inputsEnabled },
    },
  );

  // Parse application specification
  const applicationSpecification: ApplicationSpecification =
    instanceSummary.application_specification
      ? JSON.parse(instanceSummary.application_specification)
      : { variables: {} };

  // Parse job inputs
  const jobVariables: JobInputs = data?.variables?.inputs
    ? JSON.parse(data.variables.inputs)
    : { properties: {} };

  // Get information about inputs that were provided when creating the job with their respective
  // values
  const usedInputs = Object.entries(jobVariables.properties)
    .filter(([name]) => Boolean(applicationSpecification.variables[name]))
    .map(([name, jobInput]) => {
      // Let's assume inputs can only contain string or array of strings as values
      const value = applicationSpecification.variables[name] as string | string[];

      return {
        name,
        // If value is not an array, make an array out of it
        value: Array.isArray(value) ? value : [value],
        ...jobInput,
      };
    });

  return {
    inputs: usedInputs,
    isLoading,
    isError,
    error,
  };
};
