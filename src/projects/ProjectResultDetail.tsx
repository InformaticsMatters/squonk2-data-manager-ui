import { type ReactNode } from "react";

import { useGetInstance } from "@/api/data-manager/instance";
import { useGetRunningWorkflow } from "@/api/data-manager/workflow";

import { Alert, Button } from "@mui/material";

import { CenterLoader } from "../components/CenterLoader";
import { Instance } from "../components/instances/Instance";
import { RunningWorkflowCard } from "../components/RunningWorkflowCard/RunningWorkflowCard";
import { ResultTaskCard } from "../components/tasks/ResultTaskCard";
import { type ProjectFacts } from "./projectFacts";
import { resolveResultCapabilities } from "./resultCapabilities";
import { instanceOwner, resolveResultReadState, runningWorkflowOwner } from "./resultFacts";
import { type ProjectRoute, resultsListState } from "./routes";
import { type ProjectResults } from "./useProjectResults";

type ResultRoute = Extract<ProjectRoute, { kind: "result" }>;

/**
 * A result that is absent, refused, or owned by another project answers identically here. The
 * addressed project stays displayed and nothing is redirected or discovered, so pairing a valid
 * result with the wrong project reveals nothing about it.
 */
const ResultNotFound = () => (
  <Alert severity="warning">This result was not found in this project.</Alert>
);

const RecoverableResult = ({ onRetry }: { onRetry: () => void }) => (
  <Alert
    action={
      <Button color="inherit" size="small" onClick={onRetry}>
        Retry
      </Button>
    }
    severity="error"
  >
    This result could not be loaded. Retry it without leaving this project.
  </Alert>
);

/**
 * Presents one addressed result once it has answered for itself. A result that names a project
 * other than the addressed one is not found here, whatever it contains.
 */
const AddressedResult = <TResource,>({
  children,
  error,
  owner,
  projectId,
  refetch,
  resource,
}: {
  children: (resource: TResource) => ReactNode;
  error: unknown;
  /** The project the resource declares; `undefined` when it declares none of its own. */
  owner: (resource: TResource) => string | undefined;
  projectId: string;
  refetch: () => void;
  resource: TResource | undefined;
}) => {
  if (error) {
    return resolveResultReadState(error).kind === "unavailable" ? (
      <ResultNotFound />
    ) : (
      <RecoverableResult onRetry={refetch} />
    );
  }
  if (!resource) {
    return <CenterLoader />;
  }
  const declared = owner(resource);
  return declared !== undefined && declared !== projectId ? <ResultNotFound /> : children(resource);
};

const InstanceResult = ({
  facts,
  route,
}: {
  facts: ProjectFacts;
  route: ResultRoute & { collection: "instances" };
}) => {
  const instance = useGetInstance(route.resultId, { query: { retry: false } });

  return (
    <AddressedResult
      error={instance.error}
      owner={instanceOwner}
      projectId={route.projectId}
      refetch={() => void instance.refetch()}
      resource={instance.data}
    >
      {(resource) => (
        <Instance
          capabilities={resolveResultCapabilities(facts, {
            owningProjectId: instanceOwner(resource) ?? route.projectId,
            routeProjectId: route.projectId,
          })}
          collapsedByDefault={false}
          instanceId={route.resultId}
          resultsState={resultsListState(route)}
        />
      )}
    </AddressedResult>
  );
};

const WorkflowResult = ({
  facts,
  route,
}: {
  facts: ProjectFacts;
  route: ResultRoute & { collection: "workflows" };
}) => {
  const workflow = useGetRunningWorkflow(route.resultId, { query: { retry: false } });

  return (
    <AddressedResult
      error={workflow.error}
      owner={runningWorkflowOwner}
      projectId={route.projectId}
      refetch={() => void workflow.refetch()}
      resource={workflow.data}
    >
      {(resource) => (
        <RunningWorkflowCard
          capabilities={resolveResultCapabilities(facts, {
            owningProjectId: runningWorkflowOwner(resource) ?? route.projectId,
            routeProjectId: route.projectId,
          })}
          collapsedByDefault={false}
          projectId={route.projectId}
          resultsState={resultsListState(route)}
          runningWorkflowId={route.resultId}
        />
      )}
    </AddressedResult>
  );
};

/**
 * A task resource declares no project of its own, so the project-constrained task collection is
 * the only fact that can place it. A task the addressed project's collection does not contain is
 * therefore not found here, exactly as a refused or missing one is.
 */
const TaskResult = ({
  facts,
  results,
  route,
}: {
  facts: ProjectFacts;
  results: ProjectResults;
  route: ResultRoute & { collection: "tasks" };
}) => {
  const item = results.items.find(
    (candidate) => candidate.kind === "task" && candidate.id === route.resultId,
  );

  if (item?.kind === "task") {
    return (
      <ResultTaskCard
        capabilities={resolveResultCapabilities(facts, {
          content: results.freshness,
          owningProjectId: item.owningProjectId,
          routeProjectId: route.projectId,
        })}
        collapsedByDefault={false}
        projectId={item.owningProjectId}
        resultsState={resultsListState(route)}
        task={item.data}
      />
    );
  }
  if (results.isLoading) {
    return <CenterLoader />;
  }
  // A collection that could not be read cannot place the task either way; the section already says
  // what happened to it and offers the retry.
  return results.readState.kind === "available" ? <ResultNotFound /> : null;
};

export const ProjectResultDetail = ({
  facts,
  results,
  route,
}: {
  facts: ProjectFacts;
  results: ProjectResults;
  route: ResultRoute;
}) => {
  switch (route.collection) {
    case "instances":
      return <InstanceResult facts={facts} route={route} />;
    case "tasks":
      return <TaskResult facts={facts} results={results} route={route} />;
    case "workflows":
      return <WorkflowResult facts={facts} route={route} />;
  }
};
