import { type ResultsState } from "../../projects/routes";
import { useResultWorkflow } from "../../projects/useResultWorkflow";
import { WorkflowStepsPanel } from "./WorkflowProgress";

export interface ResultWorkflowStepsProps {
  /**
   * The project the listed workflow declares it belongs to; its steps are read and addressed
   * inside that project rather than the one whose list the caller opened it from.
   */
  projectId: string;
  resultsState?: ResultsState;
  runningWorkflowId: string;
}

/**
 * The steps of one listed workflow, read only once a caller opens it. It goes through the same
 * owner the addressed workflow's own route reads it through, so a workflow expanded in a list and
 * the same workflow on its own route show one read, polled by one rule.
 *
 * Only its steps are shown. What the workflow itself came to is stated by the card this is
 * expanded inside, from the collection that listed it, so a card and its own expansion can never
 * give two accounts of one workflow's outcome.
 */
export const ResultWorkflowSteps = ({
  projectId,
  resultsState,
  runningWorkflowId,
}: ResultWorkflowStepsProps) => {
  const read = useResultWorkflow(runningWorkflowId, projectId);

  return (
    <WorkflowStepsPanel
      projectId={projectId}
      resultsState={resultsState}
      steps={read.steps}
      stepsReadState={read.stepsReadState}
    />
  );
};
