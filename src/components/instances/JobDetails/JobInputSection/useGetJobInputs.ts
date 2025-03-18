import { type InstanceGetResponse, type InstanceSummary } from "@squonk/data-manager-client";
import { useGetJob } from "@squonk/data-manager-client/job";

import { type InputFieldSchema } from "../../../runCards/JobCard/JobInputFields";
import { TEST_JOB_ID } from "../../../runCards/TestJob/jobId";

// Contains only fields we are interested in
type ApplicationSpecification = { variables: Record<string, unknown> };

// Contains only fields we are interested in
type JobInput = { title: string; type: InputFieldSchema["type"] };

type JobInputs = { properties: Record<string, JobInput> };

/**
 * Returns provided inputs with their information. It matches the provided inputs with their
 * property definition which are provided by the GET /jobs/job_id endpoint
 */
export const useGetJobInputs = (instance: InstanceGetResponse | InstanceSummary) => {
  const inputsEnabled =
    instance.job_id !== undefined && instance.application_specification !== undefined;

  const { data, isLoading, isError, error } = useGetJob(
    // Since the query will be disabled if job_id is undefined, providing -1 is fine
    instance.job_id ?? -1,
    undefined,
    { query: { enabled: inputsEnabled, retry: instance.job_id === TEST_JOB_ID ? 1 : 3 } },
  );

  // Parse application specification
  const applicationSpecification: ApplicationSpecification = instance.application_specification
    ? JSON.parse(instance.application_specification)
    : { variables: {} };

  // Parse job inputs
  const jobVariables = data?.variables?.inputs
    ? (data.variables.inputs as JobInputs)
    : ({ properties: {} } satisfies JobInputs);

  // Get information about inputs that were provided when creating the job with their respective
  // values
  const usedInputs = Object.entries(jobVariables.properties)
    .filter(([name]) => Boolean(applicationSpecification.variables[name]))
    .map(([name, jobInput]) => {
      // Let's assume inputs can only contain string or array of strings as values
      const value = applicationSpecification.variables[name] as string[] | string;

      return {
        name,
        // If value is not an array, make an array out of it
        value: Array.isArray(value) ? value : [value],
        ...jobInput,
      };
    });

  return { inputs: usedInputs, isLoading, isError, error };
};
