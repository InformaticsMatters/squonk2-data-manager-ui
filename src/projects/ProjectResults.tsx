import { Alert, Button, Container, Grid, Typography } from "@mui/material";
import NextError from "next/error";
import Link from "next/link";
import { useRouter } from "next/router";

import { type FamilyRoute } from "../application/familyRoute";
import { useFamilyRoute } from "../application/FamilyRouteBoundary";
import { CenterLoader } from "../components/CenterLoader";
import { Instance } from "../components/instances/Instance";
import { EventDebugSwitch } from "../components/results/EventDebugSwitch";
import { RunningWorkflowCard } from "../components/RunningWorkflowCard/RunningWorkflowCard";
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
import { resolveProjectSectionRoute } from "./sectionRoute";
import { type SectionFilterOption, SectionToolbar } from "./SectionToolbar";
import { type ProjectResults as ProjectResultsData, useProjectResults } from "./useProjectResults";

type ResultsRoute = Extract<ProjectRoute, { kind: "result" | "results" }>;

const isResultsRoute = (route: FamilyRoute): route is ResultsRoute =>
  route.kind === "results" || route.kind === "result";

const filterOptions: readonly SectionFilterOption<ResultFilterType>[] = [
  { label: "Workflows", value: "workflow" },
  { label: "Tasks", value: "task" },
  { label: "Instances", value: "instance" },
];

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

const ResultsSection = ({
  localNotFound,
  route,
}: {
  localNotFound?: boolean;
  route: ResultsRoute;
}) => {
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
        <SectionToolbar
          filterLabel="Filter Results"
          filterOptions={filterOptions}
          filterSize={{ md: 4, sm: 4, xs: 12 }}
          refreshLabel="Refresh results"
          state={state}
          onRefresh={handleRefresh}
          onStateChange={handleStateChange}
        >
          <Grid size={{ md: 1, sm: 2 }}>
            <EventDebugSwitch />
          </Grid>
        </SectionToolbar>

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

        {localNotFound ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            This result was not found in this project.
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
  const section = resolveProjectSectionRoute(useFamilyRoute(), isResultsRoute);

  switch (section.kind) {
    case "not-found":
      return <NextError statusCode={404} />;
    // A result route the section could not address keeps the project and its list rather than
    // guessing a correction for it.
    case "local-not-found":
      return (
        <ResultsSection localNotFound route={{ kind: "results", projectId: section.projectId }} />
      );
    case "route":
      return <ResultsSection route={section.route} />;
  }
};
