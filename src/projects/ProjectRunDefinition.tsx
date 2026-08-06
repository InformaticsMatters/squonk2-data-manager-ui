import { ApplicationModal } from "../components/runCards/ApplicationCard/ApplicationModal";
import { JobModal } from "../components/runCards/JobCard/JobModal";
import { WorkflowModal } from "../components/runCards/WorkflowCard/WorkflowModal";
import { type ProjectFacts } from "./projectFacts";
import { resolveDefinitionCapabilities } from "./runCapabilities";
import { type RunDefinitionItem } from "./runFacts";
import { type LaunchOutcome } from "./useRunCommands";

/**
 * Presents the one definition the URL addresses, over the catalogue it was opened from. Whether a
 * definition could be addressed at all is the section's decision, so this is only ever given one
 * that was; the capabilities it offers come from the project in the URL, the addressed version's
 * own declared availability, and whether the catalogue content could last be established.
 */
export const ProjectRunDefinition = ({
  content,
  definitionId,
  facts,
  item,
  onClose,
  onLaunched,
  projectId,
}: {
  /** `stale` for a catalogue a failed refresh left on screen. */
  content: "current" | "stale";
  /** The identity the URL carries, which for a job is the version it addresses. */
  definitionId: string;
  facts: ProjectFacts;
  item: RunDefinitionItem;
  onClose: () => void;
  onLaunched: (outcome: LaunchOutcome) => void;
  projectId: string;
}) => {
  const capabilities = resolveDefinitionCapabilities(facts, item, content)(definitionId);
  const modalProps = { capabilities, open: true, projectId, onClose, onLaunched };

  switch (item.kind) {
    case "application":
      return <ApplicationModal applicationId={definitionId} {...modalProps} />;
    case "job":
      return <JobModal jobId={Number(definitionId)} {...modalProps} />;
    case "workflow":
      return <WorkflowModal workflowId={definitionId} {...modalProps} />;
  }
};
