import { type RunningWorkflowGetResponse } from "@/api/data-manager";
import { useGetWorkflow } from "@/api/data-manager/workflow";

import { Alert, Grid } from "@mui/material";

import { readRunDefinitionVariables, suppliedRunInputs } from "../../projects/runLaunchForm";
import { resultWorkflowOutputs } from "../../projects/workflowFacts";
import { getErrorMessage } from "../../utils/next/orvalError";
import { CenterLoader } from "../CenterLoader";
import { RunInputList } from "../instances/JobDetails/RunInputList";
import { RunOutputList } from "../instances/JobDetails/RunOutputList";
import { PageSection } from "../PageSection";

export interface WorkflowInputsAndOutputsProps {
  /**
   * The project the workflow declares it belongs to. Every path it names is a file of that
   * project, so locating an input or an output can never address another project's files.
   */
  projectId: string;
  /** The addressed workflow's own read. */
  workflow: Pick<RunningWorkflowGetResponse, "variables" | "workflow">;
}

/**
 * What one running workflow was given and produced, presented as a job's are. A workflow is made of
 * many jobs but has one set of inputs and outputs of its own: its definition declares them, and the
 * running workflow's variables hold the values it was launched with.
 */
export const WorkflowInputsAndOutputs = ({
  projectId,
  workflow,
}: WorkflowInputsAndOutputsProps) => {
  const { data: definition, isLoading, isError, error } = useGetWorkflow(workflow.workflow.id);

  // The definition is what names and titles the workflow's inputs and outputs, so until it answers
  // neither section can say anything about them.
  const unread = isLoading ? (
    <CenterLoader />
  ) : isError ? (
    <Alert severity="error">{getErrorMessage(error)}</Alert>
  ) : undefined;

  return (
    <Grid container sx={{ mb: 2 }}>
      <Grid size={{ sm: 6, xs: 12 }}>
        <PageSection level={3} title="Inputs">
          {unread ?? (
            <RunInputList
              inputs={suppliedRunInputs(
                readRunDefinitionVariables(definition?.variables).inputs,
                workflow.variables,
              )}
              noun="workflow"
              projectId={projectId}
            />
          )}
        </PageSection>
      </Grid>

      <Grid size={{ sm: 6, xs: 12 }}>
        <PageSection level={3} title="Outputs">
          {unread ?? (
            <RunOutputList
              noun="workflow"
              outputs={resultWorkflowOutputs(definition?.variables, workflow.variables)}
              projectId={projectId}
            />
          )}
        </PageSection>
      </Grid>
    </Grid>
  );
};
