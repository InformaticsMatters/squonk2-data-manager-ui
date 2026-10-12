import { type InstanceGetResponse, type InstanceSummary } from "@/api/data-manager";

import { resultInstanceOutputs } from "../../../projects/instanceFacts";
import { RunOutputList } from "./RunOutputList";

export interface JobOutputSectionProps {
  /**
   * Instance of the job.
   */
  instance: InstanceGetResponse | InstanceSummary;
}

/**
 * Displays generated outputs for a task. A job accounts for its outputs through the definition it
 * rendered at launch, so the outputs shown are whichever of the instance's own two declarations
 * accounts for it.
 */
export const JobOutputSection = ({ instance }: JobOutputSectionProps) => (
  <RunOutputList
    noun="job"
    outputs={resultInstanceOutputs(instance)}
    projectId={instance.project_id}
  />
);
