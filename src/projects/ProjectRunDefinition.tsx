import { Alert } from "@mui/material";

import { CenterLoader } from "../components/CenterLoader";
import { ApplicationModal } from "../components/runCards/ApplicationCard/ApplicationModal";
import { JobModal } from "../components/runCards/JobCard/JobModal";
import { WorkflowModal } from "../components/runCards/WorkflowCard/WorkflowModal";
import { type ProjectFacts } from "./projectFacts";
import { type ProjectRoute } from "./routes";
import { resolveRunCapabilities } from "./runCapabilities";
import { findRunDefinition, runCatalogueOf, runDefinitionUnavailability } from "./runFacts";
import { type ProjectRunCatalogue } from "./useProjectRun";
import { type LaunchOutcome } from "./useRunCommands";

type RunDefinitionRoute = Extract<ProjectRoute, { kind: "run-definition" }>;

/**
 * A definition that is absent, refused, or not offered by this project answers identically here.
 * The addressed project and its catalogue stay displayed and nothing is redirected or discovered,
 * so pairing an identity with a project that does not offer it reveals nothing about it.
 */
export const DefinitionNotFound = () => (
  <Alert severity="warning" sx={{ mb: 2 }}>
    This definition was not found in this project.
  </Alert>
);

/**
 * Presents the one definition the URL addresses, over the catalogue it was opened from. The
 * capabilities it offers come from the project in the URL, the definition's own declared
 * availability, and whether the catalogue content could last be established.
 */
export const ProjectRunDefinition = ({
  facts,
  onClose,
  onLaunched,
  route,
  run,
}: {
  facts: ProjectFacts;
  onClose: () => void;
  onLaunched: (outcome: LaunchOutcome) => void;
  route: RunDefinitionRoute;
  run: ProjectRunCatalogue;
}) => {
  const item = findRunDefinition(run.items, route.definitionType, route.definitionId);

  if (!item) {
    // Only the catalogue that publishes this definition type can place it, so only that
    // catalogue's own read decides this: a definition is absent here when its own catalogue
    // answered and did not offer it. A catalogue that could not be read says so through the
    // section, which already offers the retry, and never reports the definition as absent.
    if (run.isLoading) {
      return <CenterLoader />;
    }
    return run.readStates[runCatalogueOf(route.definitionType)].kind === "available" ? (
      <DefinitionNotFound />
    ) : null;
  }

  const capabilities = resolveRunCapabilities(facts, {
    content: run.freshness[item.kind],
    definitionUnavailability: runDefinitionUnavailability(item, route.definitionId),
  });
  const modalProps = { capabilities, open: true, projectId: route.projectId, onClose, onLaunched };

  switch (route.definitionType) {
    case "applications":
      return <ApplicationModal applicationId={route.definitionId} {...modalProps} />;
    case "jobs":
      return <JobModal jobId={Number(route.definitionId)} {...modalProps} />;
    case "workflows":
      return <WorkflowModal workflowId={route.definitionId} {...modalProps} />;
  }
};
