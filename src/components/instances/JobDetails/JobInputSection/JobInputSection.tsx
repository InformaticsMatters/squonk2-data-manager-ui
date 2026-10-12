import { type InstanceGetResponse, type InstanceSummary } from "@/api/data-manager";

import { Alert } from "@mui/material";

import { getErrorMessage } from "../../../../utils/next/orvalError";
import { CenterLoader } from "../../../CenterLoader";
import { RunInputList } from "../RunInputList";
import { useGetJobInputs } from "./useGetJobInputs";

export interface JobInputSectionProps {
  /**
   * Instance of the job.
   */
  instance: InstanceGetResponse | InstanceSummary;
}

/**
 * Displays provided inputs for a task.
 */
export const JobInputSection = ({ instance }: JobInputSectionProps) => {
  const { inputs, isLoading, isError, error } = useGetJobInputs(instance);

  if (isLoading) {
    return <CenterLoader />;
  }

  if (isError) {
    return <Alert severity="error">{getErrorMessage(error)}</Alert>;
  }

  return <RunInputList inputs={inputs} noun="job" projectId={instance.project_id} />;
};
