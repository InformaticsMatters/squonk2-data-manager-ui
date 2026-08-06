import { useEffect, useState } from "react";

import { RefreshRounded as RefreshRoundedIcon } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Container,
  Grid,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import NextError from "next/error";
import { useRouter } from "next/router";

import { useFamilyRoute } from "../application/FamilyRouteBoundary";
import { CenterLoader } from "../components/CenterLoader";
import { ApplicationCard } from "../components/runCards/ApplicationCard";
import { JobCard } from "../components/runCards/JobCard";
import { WorkflowCard } from "../components/runCards/WorkflowCard/WorkflowCard";
import { SearchTextField } from "../components/SearchTextField";
import Layout from "../layouts/Layout";
import { type ProjectFacts, useProjectFacts } from "./projectFacts";
import { DefinitionNotFound, ProjectRunDefinition } from "./ProjectRunDefinition";
import {
  localNotFoundProjectId,
  projectLinks,
  type ProjectRoute,
  runCatalogueState,
  type RunFilterType,
  type RunState,
} from "./routes";
import { resolveRunCapabilities } from "./runCapabilities";
import {
  filterRunItems,
  runDefinitionInstances,
  type RunDefinitionItem,
  runDefinitionRunningWorkflows,
} from "./runFacts";
import { type ProjectRunCatalogue, useProjectRun } from "./useProjectRun";
import { type LaunchOutcome } from "./useRunCommands";

type RunRoute = Extract<ProjectRoute, { kind: "run-definition" | "run" }>;

const filterOptions = [
  { label: "Workflows", value: "workflow" },
  { label: "Applications", value: "application" },
  { label: "Jobs", value: "job" },
] as const satisfies readonly { label: string; value: RunFilterType }[];

const allTypes = filterOptions.map(({ value }) => value);

const RunToolbar = ({
  onRefresh,
  onStateChange,
  state,
}: {
  onRefresh: () => void;
  onStateChange: (change: RunState) => void;
  state: RunState;
}) => {
  const [search, setSearch] = useState(state.search ?? "");

  useEffect(() => setSearch(state.search ?? ""), [state.search]);

  return (
    <Grid container spacing={2} sx={{ alignItems: "center", mb: 2 }}>
      <Grid size={{ md: 4, sm: 6, xs: 12 }}>
        <TextField
          fullWidth
          select
          label="Filter"
          slotProps={{
            select: {
              multiple: true,
              onChange: (event) => {
                const selected = event.target.value as RunFilterType[];
                onStateChange({
                  ...state,
                  types: selected.length === allTypes.length ? undefined : selected,
                });
              },
            },
          }}
          value={state.types ?? allTypes}
        >
          {filterOptions.map(({ label, value }) => (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid size={{ md: 4, sm: 5, xs: 12 }} sx={{ ml: "auto" }}>
        <SearchTextField
          fullWidth
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            onStateChange({ ...state, search: event.target.value || undefined });
          }}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: "auto" }} sx={{ textAlign: "center" }}>
        <Tooltip title="Refresh catalogue">
          <IconButton size="large" sx={{ ml: "auto" }} onClick={onRefresh}>
            <RefreshRoundedIcon />
          </IconButton>
        </Tooltip>
      </Grid>
    </Grid>
  );
};

/**
 * One definition, offered with the capabilities the project in the URL decides. Nothing about the
 * card is derived from a selected or previously current project.
 */
const RunDefinitionCard = ({
  facts,
  item,
  projectId,
  run,
  runState,
}: {
  facts: ProjectFacts;
  item: RunDefinitionItem;
  projectId: string;
  run: ProjectRunCatalogue;
  runState: RunState;
}) => {
  // A card offers every version of its definition, so it states only what the project decides. A
  // version the Data Manager itself disabled says so on the card that offers it and in the modal
  // that addresses it, where the version being run is known.
  const capabilities = resolveRunCapabilities(facts, { content: run.freshness[item.kind] });

  switch (item.kind) {
    case "application":
      return (
        <ApplicationCard
          application={item.data}
          capabilities={capabilities}
          instances={runDefinitionInstances(item, run.instances, projectId)}
          projectId={projectId}
          runState={runState}
        />
      );
    case "job":
      return (
        <JobCard
          capabilities={capabilities}
          instances={runDefinitionInstances(item, run.instances, projectId)}
          jobs={item.data}
          projectId={projectId}
          runState={runState}
        />
      );
    case "workflow":
      return (
        <WorkflowCard
          capabilities={capabilities}
          projectId={projectId}
          runningWorkflows={runDefinitionRunningWorkflows(item, run.runningWorkflows, projectId)}
          runState={runState}
          workflow={item.data}
        />
      );
  }
};

const RunCatalogue = ({
  facts,
  projectId,
  run,
  state,
}: {
  facts: ProjectFacts;
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
          facts={facts}
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
        <RunToolbar
          state={state}
          onRefresh={() => run.refresh()}
          onStateChange={handleStateChange}
        />

        {/* A refused read and a read that merely failed to refresh are reported separately, so
        losing access to one never withholds the retry another one needs. */}
        {run.report.unavailable ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Some Run content is unavailable or you no longer have access to it.
          </Alert>
        ) : null}
        {run.report.retryable ? (
          <Alert
            action={
              <Button color="inherit" size="small" onClick={() => run.retry()}>
                Retry
              </Button>
            }
            severity="error"
            sx={{ mb: 2 }}
          >
            Some Run content could not be refreshed. It may be out of date, and definitions that
            could not be refreshed cannot be run until they load again.
          </Alert>
        ) : null}
        {localNotFound ? <DefinitionNotFound /> : null}

        {facts === undefined ? (
          <CenterLoader />
        ) : (
          <>
            <RunCatalogue facts={facts} projectId={projectId} run={run} state={state} />
            {route.kind === "run-definition" ? (
              <ProjectRunDefinition
                facts={facts}
                route={route}
                run={run}
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
  const familyRoute = useFamilyRoute();

  // A definition route the section could not address keeps the project and its catalogue rather
  // than guessing a correction for it.
  if (familyRoute.localNotFound) {
    const projectId = localNotFoundProjectId(familyRoute.parent);
    return projectId ? (
      <RunSection localNotFound route={{ kind: "run", projectId }} />
    ) : (
      <NextError statusCode={404} />
    );
  }

  const { route } = familyRoute;
  if (route.kind !== "run" && route.kind !== "run-definition") {
    return <NextError statusCode={404} />;
  }

  return <RunSection route={route} />;
};
