import { Alert, Box, Container, Typography } from "@mui/material";
import NextError from "next/error";
import { useRouter } from "next/router";

import { type FamilyRoute } from "../application/familyRoute";
import { useFamilyRoute } from "../application/FamilyRouteBoundary";
import { CenterLoader } from "../components/CenterLoader";
import { ApplicationCard } from "../components/runCards/ApplicationCard";
import { JobCard } from "../components/runCards/JobCard";
import { WorkflowCard } from "../components/runCards/WorkflowCard/WorkflowCard";
import Layout from "../layouts/Layout";
import { capabilityReason, evaluateProjectExecutionCapability } from "./capabilities";
import { type ProjectFacts, useProjectFacts } from "./projectFacts";
import { ProjectRunDefinition } from "./ProjectRunDefinition";
import {
  projectLinks,
  type ProjectRoute,
  runCatalogueState,
  type RunFilterType,
  type RunState,
} from "./routes";
import {
  filterRunItems,
  findRunDefinition,
  runCatalogueOf,
  runDefinitionInstances,
  type RunDefinitionItem,
  runDefinitionRunningWorkflows,
} from "./runFacts";
import { SectionReadAlerts } from "./SectionReadAlerts";
import { resolveProjectSectionRoute } from "./sectionRoute";
import { type SectionFilterOption, SectionToolbar } from "./SectionToolbar";
import { type ProjectRunCatalogue, useProjectRun } from "./useProjectRun";
import { type LaunchOutcome } from "./useRunCommands";

type RunRoute = Extract<ProjectRoute, { kind: "run-definition" | "run" }>;

const isRunRoute = (route: FamilyRoute): route is RunRoute =>
  route.kind === "run" || route.kind === "run-definition";

const filterOptions: readonly SectionFilterOption<RunFilterType>[] = [
  { label: "Workflows", value: "workflow" },
  { label: "Applications", value: "application" },
  { label: "Jobs", value: "job" },
];

/**
 * A definition that is absent, refused, not offered by this project, or addressed through a URL
 * Run cannot read at all answers identically. The addressed project and its catalogue stay
 * displayed and nothing is redirected or discovered, so pairing an identity with a project that
 * does not offer it reveals nothing about it.
 */
const DefinitionNotFound = () => (
  <Alert severity="warning" sx={{ mb: 2 }}>
    This definition was not found in this project.
  </Alert>
);

/**
 * What running work in the addressed project requires, stated once for the catalogue rather than
 * repeated on every card in it. The requirement is a fact of the project, its subscription, and the
 * caller — never of one definition — so the section is the one place that can state it once. What a
 * particular definition requires beyond it is the modal that addresses that definition's to give.
 */
const RunRequirement = ({ facts }: { facts: ProjectFacts }) => {
  const reason = capabilityReason(evaluateProjectExecutionCapability(facts));

  return reason === undefined ? null : (
    <Alert severity="info" sx={{ mb: 2 }}>
      {reason}
    </Alert>
  );
};

/**
 * One definition of the project in the URL. Nothing about the card is derived from a selected or
 * previously current project.
 */
const RunDefinitionCard = ({
  item,
  projectId,
  run,
  runState,
}: {
  item: RunDefinitionItem;
  projectId: string;
  run: ProjectRunCatalogue;
  runState: RunState;
}) => {
  const cardProps = { projectId, runState };
  // A card waits only on the collection it lists, so a slow running-workflow read never holds up a
  // job's instances, or the other way round.
  const instanceProps = {
    executionsLoading: run.executionsLoading.instances,
    instances: runDefinitionInstances(item, run.instances, projectId),
  };

  switch (item.kind) {
    case "application":
      return <ApplicationCard {...cardProps} {...instanceProps} application={item.data} />;
    case "job":
      return <JobCard {...cardProps} {...instanceProps} jobs={item.data} />;
    case "workflow":
      return (
        <WorkflowCard
          {...cardProps}
          executionsLoading={run.executionsLoading.runningWorkflows}
          runningWorkflows={runDefinitionRunningWorkflows(item, run.runningWorkflows, projectId)}
          workflow={item.data}
        />
      );
  }
};

const RunCatalogue = ({
  projectId,
  run,
  state,
}: {
  projectId: string;
  run: ProjectRunCatalogue;
  state: RunState;
}) => {
  const items = filterRunItems(run.items, state);

  if (run.isLoading) {
    return <CenterLoader />;
  }

  if (items.length === 0) {
    return (
      <Typography align="center" variant="body2">
        There are no workflows, applications, or jobs to display.
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        "@container run-page (max-width: 1100px)": {
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        },
        "@container run-page (max-width: 800px)": {
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        },
      }}
    >
      {items.map((item) => (
        <RunDefinitionCard
          item={item}
          key={`${item.definitionType}-${item.id}`}
          projectId={projectId}
          run={run}
          runState={state}
        />
      ))}
    </Box>
  );
};

const RunSection = ({ localNotFound, route }: { localNotFound?: boolean; route: RunRoute }) => {
  const router = useRouter();
  const { projectId } = route;
  const state = runCatalogueState(route);
  const run = useProjectRun(projectId);
  const facts = useProjectFacts();

  const addressed =
    route.kind === "run-definition"
      ? {
          catalogue: runCatalogueOf(route.definitionType),
          definitionId: route.definitionId,
          item: findRunDefinition(run.items, route.definitionType, route.definitionId),
        }
      : undefined;
  // Only the catalogue that publishes this definition type can place it, so only that catalogue's
  // own read decides this: a definition is absent here when its own catalogue answered and did not
  // offer it. A catalogue that could not be read says so through the retry the section already
  // offers, and never reports the definition as absent.
  const definitionAbsent =
    addressed !== undefined &&
    addressed.item === undefined &&
    !run.isLoading &&
    run.readStates[addressed.catalogue].kind === "available";

  const handleStateChange = (change: RunState) => {
    const href =
      route.kind === "run"
        ? projectLinks.run(projectId, change)
        : projectLinks.runDefinition(projectId, route.definitionType, route.definitionId, change);
    void router.replace(href as never, undefined, { shallow: true });
  };

  // Closing a definition replaces it with the catalogue it was opened over, carrying only the
  // catalogue state Run owns, so Close never adds an entry Back would have to walk back through.
  const handleClose = () => void router.replace(projectLinks.run(projectId, state) as never);

  // A launch is only reported once the Data Manager has accepted it, so the execution it opens is
  // one that exists — and it is opened inside the project that ran it.
  const handleLaunched = (outcome: LaunchOutcome) =>
    void router.push(
      (outcome.kind === "instance"
        ? projectLinks.result(projectId, "instances", outcome.instanceId)
        : projectLinks.result(projectId, "workflows", outcome.runningWorkflowId)) as never,
    );

  return (
    <Layout>
      <Container
        maxWidth="xl"
        sx={{ containerType: "inline-size", containerName: "run-page", py: 3 }}
      >
        <Typography gutterBottom component="h1" variant="h4">
          Run
        </Typography>
        <SectionToolbar
          filter={{ label: "Filter", options: filterOptions, size: { md: 4, sm: 6, xs: 12 } }}
          refreshLabel="Refresh catalogue"
          state={state}
          onRefresh={() => run.refresh()}
          onStateChange={handleStateChange}
        />

        <SectionReadAlerts
          report={run.report}
          retryableMessage="Some Run content could not be refreshed. It may be out of date, and definitions that could not be refreshed cannot be run until they load again."
          unavailableMessage="Some Run content is unavailable or you no longer have access to it."
          onRetry={() => run.retry()}
        />
        {/* However a definition failed to be addressed, it is reported in the one place, so a
        malformed identity and one the project does not offer are indistinguishable. */}
        {localNotFound === true || definitionAbsent ? <DefinitionNotFound /> : null}

        {facts === undefined ? (
          <CenterLoader />
        ) : (
          <>
            <RunRequirement facts={facts} />
            <RunCatalogue projectId={projectId} run={run} state={state} />
            {addressed?.item ? (
              <ProjectRunDefinition
                content={run.freshness[addressed.item.kind]}
                definitionId={addressed.definitionId}
                facts={facts}
                item={addressed.item}
                projectId={projectId}
                onClose={handleClose}
                onLaunched={handleLaunched}
              />
            ) : null}
          </>
        )}
      </Container>
    </Layout>
  );
};

/**
 * The Run section of the project in the URL. Every definition it fetches, displays, links to, and
 * launches belongs to that project: no read, link, capability, or launch here consults a selected
 * or previously current project.
 */
export const ProjectRun = () => {
  const section = resolveProjectSectionRoute(useFamilyRoute(), isRunRoute);

  switch (section.kind) {
    case "not-found":
      return <NextError statusCode={404} />;
    // A definition route the section could not address keeps the project and its catalogue rather
    // than guessing a correction for it.
    case "local-not-found":
      return <RunSection localNotFound route={{ kind: "run", projectId: section.projectId }} />;
    case "route":
      return <RunSection route={section.route} />;
  }
};
