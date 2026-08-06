import { useEffect, useState } from "react";

import { RefreshRounded as RefreshRoundedIcon } from "@mui/icons-material";
import {
  Alert,
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
import Link from "next/link";
import { useRouter } from "next/router";

import { useFamilyRoute } from "../application/FamilyRouteBoundary";
import { CenterLoader } from "../components/CenterLoader";
import { Instance } from "../components/instances/Instance";
import { EventDebugSwitch } from "../components/results/EventDebugSwitch";
import { RunningWorkflowCard } from "../components/RunningWorkflowCard/RunningWorkflowCard";
import { SearchTextField } from "../components/SearchTextField";
import { ResultTaskCard } from "../components/tasks/ResultTaskCard";
import Layout from "../layouts/Layout";
import { type ProjectFacts, useProjectFacts } from "./projectFacts";
import { ProjectResultDetail } from "./ProjectResultDetail";
import { resolveResultCapabilities } from "./resultCapabilities";
import { filterResultItems, type ResultItem } from "./resultFacts";
import {
  projectLinks,
  type ProjectRoute,
  type ResultFilterType,
  resultsListState,
  type ResultsState,
} from "./routes";
import { type ProjectResults as ProjectResultsData, useProjectResults } from "./useProjectResults";

type ResultsRoute = Extract<ProjectRoute, { kind: "result" | "results" }>;

const filterOptions = [
  { label: "Workflows", value: "workflow" },
  { label: "Tasks", value: "task" },
  { label: "Instances", value: "instance" },
] as const satisfies readonly { label: string; value: ResultFilterType }[];

const allTypes = filterOptions.map(({ value }) => value);

const ResultsToolbar = ({
  onRefresh,
  onStateChange,
  state,
}: {
  onRefresh: () => void;
  onStateChange: (change: ResultsState) => void;
  state: ResultsState;
}) => {
  const [search, setSearch] = useState(state.search ?? "");

  useEffect(() => setSearch(state.search ?? ""), [state.search]);

  return (
    <Grid container spacing={2} sx={{ alignItems: "center", mb: 2 }}>
      <Grid size={{ md: 4, sm: 4, xs: 12 }}>
        <TextField
          fullWidth
          select
          label="Filter Results"
          slotProps={{
            select: {
              multiple: true,
              onChange: (event) => {
                const selected = event.target.value as ResultFilterType[];
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
      <Grid size={{ md: 1, sm: 2 }}>
        <EventDebugSwitch />
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
        <Tooltip title="Refresh results">
          <IconButton size="large" sx={{ ml: "auto" }} onClick={onRefresh}>
            <RefreshRoundedIcon />
          </IconButton>
        </Tooltip>
      </Grid>
    </Grid>
  );
};

/**
 * One result, offered with the capabilities its own owning project decides. Nothing about the card
 * is derived from the project the caller happens to be looking at.
 */
const ResultItemCard = ({
  content,
  facts,
  item,
  resultsState,
  routeProjectId,
  collapsedByDefault = true,
}: {
  collapsedByDefault?: boolean;
  content: "current" | "stale";
  facts: ProjectFacts;
  item: ResultItem;
  resultsState?: ResultsState;
  routeProjectId: string;
}) => {
  const capabilities = resolveResultCapabilities(facts, {
    content,
    owningProjectId: item.owningProjectId,
    routeProjectId,
  });

  switch (item.kind) {
    case "instance":
      return (
        <Instance
          capabilities={capabilities}
          collapsedByDefault={collapsedByDefault}
          instanceId={item.id}
          instanceSummary={item.data}
          resultsState={resultsState}
        />
      );
    case "task":
      return (
        <ResultTaskCard
          capabilities={capabilities}
          collapsedByDefault={collapsedByDefault}
          projectId={item.owningProjectId}
          resultsState={resultsState}
          task={item.data}
        />
      );
    case "workflow":
      return (
        <RunningWorkflowCard
          capabilities={capabilities}
          collapsedByDefault={collapsedByDefault}
          projectId={item.owningProjectId}
          resultsState={resultsState}
          runningWorkflowId={item.id}
          workflowSummary={item.data}
        />
      );
  }
};

const ResultsList = ({
  facts,
  results,
  routeProjectId,
  state,
}: {
  facts: ProjectFacts;
  results: ProjectResultsData;
  routeProjectId: string;
  state: ResultsState;
}) => {
  const items = filterResultItems(results.items, state);

  if (results.isLoading) {
    return <CenterLoader />;
  }

  if (items.length === 0) {
    return (
      <Typography align="center" variant="body2">
        There are no tasks, instances, or workflows to display.
      </Typography>
    );
  }

  return (
    <Grid container spacing={2}>
      {items.map((item) => (
        <Grid key={`${item.kind}-${item.id}`} size={{ xs: 12 }}>
          <ResultItemCard
            content={results.freshness[item.kind]}
            facts={facts}
            item={item}
            resultsState={state}
            routeProjectId={routeProjectId}
          />
        </Grid>
      ))}
    </Grid>
  );
};

const ResultsSection = ({ route }: { route: ResultsRoute }) => {
  const router = useRouter();
  const { projectId } = route;
  const state = resultsListState(route);
  const results = useProjectResults(projectId);
  const facts = useProjectFacts();

  const handleStateChange = (change: ResultsState) => {
    const href =
      route.kind === "results"
        ? projectLinks.results(projectId, change)
        : projectLinks.result(projectId, route.collection, route.resultId, change);
    void router.replace(href as never, undefined, { shallow: true });
  };
  const handleRefresh = () => results.refresh();
  const handleRetry = () => results.retry();

  return (
    <Layout>
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Typography gutterBottom component="h1" variant="h4">
          Results
        </Typography>
        <ResultsToolbar state={state} onRefresh={handleRefresh} onStateChange={handleStateChange} />

        {/* A refused collection and a collection that merely failed to refresh are reported
        separately, so losing access to one never withholds the retry another one needs. */}
        {results.report.unavailable ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            These results are unavailable or you no longer have access to them.
          </Alert>
        ) : null}
        {results.report.retryable ? (
          <Alert
            action={
              <Button color="inherit" size="small" onClick={handleRetry}>
                Retry
              </Button>
            }
            severity="error"
            sx={{ mb: 2 }}
          >
            Some results could not be refreshed. Those results may be out of date, so they cannot be
            changed until they load again.
          </Alert>
        ) : null}

        {facts === undefined ? (
          <CenterLoader />
        ) : route.kind === "result" ? (
          <>
            <Button component={Link} href={projectLinks.results(projectId, state)} sx={{ mb: 1 }}>
              All results
            </Button>
            <ProjectResultDetail facts={facts} results={results} route={route} />
          </>
        ) : (
          <ResultsList facts={facts} results={results} routeProjectId={projectId} state={state} />
        )}
      </Container>
    </Layout>
  );
};

/**
 * The Results section of the project in the URL. Every result it fetches, displays, links to, and
 * offers actions on belongs to that project: no read, link, or capability here consults a selected
 * or previously current project.
 */
export const ProjectResults = () => {
  const familyRoute = useFamilyRoute();
  const route = familyRoute.localNotFound ? null : familyRoute.route;

  if (!route || (route.kind !== "results" && route.kind !== "result")) {
    return <NextError statusCode={404} />;
  }

  return <ResultsSection route={route} />;
};
