import { getGetApplicationSuspenseQueryOptions } from "@/api/data-manager/application";
import { getGetJobSuspenseQueryOptions } from "@/api/data-manager/job";
import { getGetWorkflowSuspenseQueryOptions } from "@/api/data-manager/workflow";

import { ApplicationModal } from "../components/runCards/ApplicationCard/ApplicationModal";
import { JobModal } from "../components/runCards/JobCard/JobModal";
import { WorkflowModal } from "../components/runCards/WorkflowCard/WorkflowModal";
import { useSettledQueries } from "../hooks/useSettledQuery";
import { type ProjectFacts } from "./projectFacts";
import { resolveDefinitionCapabilities } from "./runCapabilities";
import { type RunDefinitionItem } from "./runFacts";
import { type LaunchOutcome } from "./useRunCommands";

/** The generated read of the one definition a modal presents, which the modal reads for itself. */
const definitionRead = (kind: RunDefinitionItem["kind"], definitionId: string) => {
  switch (kind) {
    case "application":
      return getGetApplicationSuspenseQueryOptions(definitionId);
    case "job":
      return getGetJobSuspenseQueryOptions(Number(definitionId));
    case "workflow":
      return getGetWorkflowSuspenseQueryOptions(definitionId);
  }
};

/**
 * Presents the one definition the URL addresses, over the catalogue it was opened from. Whether a
 * definition could be addressed at all is the section's decision, so this is only ever given one
 * that was; the capabilities it offers come from the project in the URL, the addressed version's
 * own declared availability, and whether the catalogue content could last be established.
 *
 * The definition is read before the modal opens, so it opens with its whole form rather than
 * filling in after it appears. Opening one is a route change, which renders in a transition, so
 * the catalogue stays as it is until then.
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
  useSettledQueries([definitionRead(item.kind, definitionId)]);
  const capabilities = resolveDefinitionCapabilities(facts, item, content)(definitionId);
  // Everything a modal holds — what was entered into it, and how far its launch got — belongs to
  // the one definition of the one project the URL addressed. Keying by that identity is what makes
  // moving between two definitions of the same type start the second one afresh, rather than
  // carrying the first one's entries and the answer its launch received into it.
  const key = `${projectId}-${item.kind}-${definitionId}`;
  const modalProps = { capabilities, key, open: true, projectId, onClose, onLaunched };

  switch (item.kind) {
    case "application":
      return <ApplicationModal applicationId={definitionId} {...modalProps} />;
    case "job":
      return <JobModal jobId={Number(definitionId)} {...modalProps} />;
    case "workflow":
      return <WorkflowModal workflowId={definitionId} {...modalProps} />;
  }
};
