import { type ReactNode } from "react";

import { useGetInstance } from "@/api/data-manager/instance";
import { useGetRunningWorkflow } from "@/api/data-manager/workflow";

import { Alert, Button } from "@mui/material";
import { useRouter } from "next/router";

import { CenterLoader } from "../components/CenterLoader";
import { Instance } from "../components/instances/Instance";
import { RunningWorkflowCard } from "../components/RunningWorkflowCard/RunningWorkflowCard";
import { ResultTaskDetail } from "../components/tasks/ResultTaskDetail";
import { type ProjectFacts } from "./projectFacts";
import { resolveResultCapabilities } from "./resultCapabilities";
import { instanceOwner, type ResultItem, runningWorkflowOwner, taskOwner } from "./resultFacts";
import { projectLinks, type ProjectRoute, resultsListState } from "./routes";
import { resolveSectionReadState, sectionReadFailure, type SectionReadState } from "./sectionReads";
import { resultTaskSettlement } from "./taskFacts";
import { type ProjectResults } from "./useProjectResults";
import { useResultTask } from "./useResultTask";

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
 * other than the addressed one is not found here, whatever it contains. A read that merely failed
 * to refresh keeps whatever it last loaded on screen, marked stale and offering retry, so the
 * addressed result follows the same rule its collection does.
 */
const AddressedResult = <TResource,>({
  children,
  owner,
  projectId,
  readState,
  refetch,
  resource,
}: {
  children: (resource: TResource, content: "current" | "stale") => ReactNode;
  /** The project the resource declares; `undefined` when it declares none of its own. */
  owner: (resource: TResource) => string | undefined;
  projectId: string;
  /** How this resource's own read answered, classified by the rule every section read shares. */
  readState: SectionReadState;
  refetch: () => void;
  resource: TResource | undefined;
}) => {
  if (readState.kind === "unavailable") {
    return <ResultNotFound />;
  }
  if (!resource) {
    return readState.kind === "recoverable" ? (
      <RecoverableResult onRetry={refetch} />
    ) : (
      <CenterLoader />
    );
  }
  const declared = owner(resource);
  if (declared !== undefined && declared !== projectId) {
    return <ResultNotFound />;
  }
  if (readState.kind === "recoverable") {
    return (
      <>
        <RecoverableResult onRetry={refetch} />
        {children(resource, "stale")}
      </>
    );
  }
  return children(resource, "current");
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
      owner={instanceOwner}
      projectId={route.projectId}
      readState={resolveSectionReadState(sectionReadFailure(instance))}
      refetch={() => void instance.refetch()}
      resource={instance.data}
    >
      {(resource, content) => (
        <Instance
          capabilities={resolveResultCapabilities(facts, {
            content,
            owningProjectId: instanceOwner(resource) ?? route.projectId,
            routeProjectId: route.projectId,
          })}
          collapsedByDefault={false}
          instanceId={route.resultId}
          instanceSummary={resource}
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
      owner={runningWorkflowOwner}
      projectId={route.projectId}
      readState={resolveSectionReadState(sectionReadFailure(workflow))}
      refetch={() => void workflow.refetch()}
      resource={workflow.data}
    >
      {(resource, content) => (
        <RunningWorkflowCard
          capabilities={resolveResultCapabilities(facts, {
            content,
            owningProjectId: runningWorkflowOwner(resource) ?? route.projectId,
            routeProjectId: route.projectId,
          })}
          collapsedByDefault={false}
          projectId={route.projectId}
          resultsState={resultsListState(route)}
          runningWorkflowId={route.resultId}
          workflowSummary={resource}
        />
      )}
    </AddressedResult>
  );
};

/**
 * One task the addressed project has already been shown to own, read for itself. Ownership is
 * settled before this mounts, so the task's own read only has to answer for the task: a refusal or
 * an absence is the same non-disclosing not-found the collection gives, and a read that merely
 * failed to refresh keeps what it last loaded, marked stale.
 */
const OwnedTaskResult = ({
  facts,
  item,
  route,
}: {
  facts: ProjectFacts;
  item: Extract<ResultItem, { kind: "task" }>;
  route: ResultRoute & { collection: "tasks" };
}) => {
  const router = useRouter();
  const read = useResultTask(item.id);
  const state = resultsListState(route);

  return (
    <AddressedResult
      owner={taskOwner}
      projectId={route.projectId}
      readState={read.readState}
      refetch={read.refetch}
      resource={read.task}
    >
      {(task, content) => (
        <ResultTaskDetail
          capabilities={resolveResultCapabilities(facts, {
            content,
            owningProjectId: item.owningProjectId,
            routeProjectId: route.projectId,
            taskSettlement: resultTaskSettlement(read.lifecycle),
          })}
          lifecycle={read.lifecycle}
          projectId={item.owningProjectId}
          resultsState={state}
          summary={item.data}
          task={task}
          // A deleted task has no route of its own left, so the caller is returned to the list of
          // the project that owned it, with that list's own state. A rejected deletion changes
          // nothing and leaves the caller exactly where the rejection happened.
          onDeleted={() =>
            void router.replace(projectLinks.results(item.owningProjectId, state) as never)
          }
        />
      )}
    </AddressedResult>
  );
};

/**
 * A task resource declares no project of its own, so the project-constrained task collection is
 * the only fact that can place it. A task the addressed project's collection does not contain is
 * therefore not found here, exactly as a refused or missing one is, and no other owner is looked
 * for or adopted on its behalf.
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
    return <OwnedTaskResult facts={facts} item={item} route={route} />;
  }
  if (results.isLoading) {
    return <CenterLoader />;
  }
  // Only the task collection can place a task, so only its own read decides this: a task is absent
  // here when that collection answered and did not contain it. A task collection that could not be
  // read says so through the section, which already offers the retry.
  return results.readStates.task.kind === "available" ? <ResultNotFound /> : null;
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
