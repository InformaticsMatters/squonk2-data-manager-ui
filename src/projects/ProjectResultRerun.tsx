import { type InstanceGetResponse, type RunningWorkflowGetResponse } from "@/api/data-manager";

import { JobModal } from "../components/runCards/JobCard/JobModal";
import { WorkflowModal } from "../components/runCards/WorkflowCard/WorkflowModal";
import { type ProjectCapability } from "./capabilities";
import { type RerunTarget } from "./resultRerun";
import { type RerunnableCollection } from "./routes";
import { type LaunchOutcome } from "./useRunCommands";

/** The result one accepted rerun created, at the collection its own route is addressed in. */
export type RerunLaunched = { collection: RerunnableCollection; resultId: string };

const launchedResult = (outcome: LaunchOutcome): RerunLaunched =>
  outcome.kind === "instance"
    ? { collection: "instances", resultId: outcome.instanceId }
    : { collection: "workflows", resultId: outcome.runningWorkflowId };

type ProjectResultRerunProps = {
  capability: ProjectCapability;
  onClose: () => void;
  onLaunched: (launched: RerunLaunched) => void;
} & (
  | {
      /** The addressed instance's own read, which is what the form takes its defaults from. */
      instance: InstanceGetResponse;
      target: Extract<RerunTarget, { collection: "instances" }>;
    }
  | {
      /** The addressed running workflow's own read, which is what the form takes its defaults from. */
      runningWorkflow: RunningWorkflowGetResponse;
      target: Extract<RerunTarget, { collection: "workflows" }>;
    }
);

/**
 * The addressed result's definition, offered again with everything that result ran it with. The
 * one project this is composed for is the target's own verified project, which is both the project
 * the capability was decided by and the project the launch names, so a rerun cannot be sent for a
 * pairing this client would not display.
 *
 * The prefilled interaction is the definition's own launch modal, unchanged: a result carries what
 * it was run with, so running it again starts from exactly that and stays editable before it is
 * sent.
 *
 * Everything the modal holds — what was entered into it, and how far its launch got — belongs to
 * the one result of the one project it was addressed for, so it is keyed by that identity and
 * moving between two reruns starts the second one afresh.
 */
export const ProjectResultRerun = (props: ProjectResultRerunProps) => {
  const { capability, target, onClose, onLaunched } = props;
  const key = `${target.projectId}-${target.collection}-${target.resultId}`;
  const modalProps = {
    // A rerun addresses a result rather than a catalogue version, so the Data Manager declares no
    // availability of its own here; only the owning project decides.
    capabilities: { availability: { status: "enabled" }, launch: capability } as const,
    open: true,
    projectId: target.projectId,
    onClose,
    onLaunched: (outcome: LaunchOutcome) => onLaunched(launchedResult(outcome)),
  };

  return "instance" in props ? (
    <JobModal instance={props.instance} jobId={props.target.jobId} key={key} {...modalProps} />
  ) : (
    <WorkflowModal
      key={key}
      runningWorkflow={props.runningWorkflow}
      workflowId={props.target.workflowId}
      {...modalProps}
    />
  );
};
