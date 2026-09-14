import { type InstanceGetResponse } from "@/api/data-manager";

import { ListItem, ListItemText } from "@mui/material";

import { type ResultInstanceLifecycle } from "../../projects/instanceFacts";
import { type ResultCapabilities } from "../../projects/resultCapabilities";
import { type RerunTarget } from "../../projects/resultRerun";
import { type ResultsState } from "../../projects/routes";
import { InstanceProgress } from "./InstanceProgress";
import { InstanceResultCard } from "./InstanceResultCard";

export interface ResultInstanceDetailProps {
  /** What the caller may do with this instance, decided by it and the project that owns it. */
  capabilities: ResultCapabilities;
  /** The addressed instance's own read. */
  instance: InstanceGetResponse;
  instanceId: string;
  lifecycle: ResultInstanceLifecycle;
  /**
   * The project this instance declares it belongs to. Every link this card builds is addressed
   * inside that project.
   */
  projectId: string;
  /** What running this instance's job again would target, or `null` where nothing may be run. */
  rerunTarget: RerunTarget | null;
  /** Results list state this card's links preserve. */
  resultsState?: ResultsState;
  /** Called once the Data Manager has accepted the instance's termination or deletion. */
  onRemoved?: () => void;
}

const lifecycleSummary = (lifecycle: ResultInstanceLifecycle) => {
  switch (lifecycle.kind) {
    case "failed":
      return "Failed";
    case "pending":
      return "Running";
    case "stalled":
      return "Not progressing";
    case "succeeded":
      return "Succeeded";
    case "unconfirmed":
    case "unestablished":
    case "unknown":
      return "Not established";
  }
};

/**
 * One addressed instance, presented under the project that owns it. Its identity, its progress,
 * what it ran, what it produced, and its stop, delete, rerun, logs, and archive actions are all
 * taken from the concrete instance and that project, so nothing on this card is derived from a
 * selected or previously current project.
 */
export const ResultInstanceDetail = ({
  capabilities,
  instance,
  instanceId,
  lifecycle,
  projectId,
  rerunTarget,
  resultsState,
  onRemoved,
}: ResultInstanceDetailProps) => (
  <InstanceResultCard
    capabilities={capabilities}
    collapsed={<InstanceProgress instance={instance} lifecycle={lifecycle} />}
    collapsedByDefault={false}
    instance={instance}
    instanceId={instanceId}
    projectId={projectId}
    rerunTarget={rerunTarget}
    resultsState={resultsState}
    onRemoved={onRemoved}
  >
    <ListItem>
      <ListItemText primary="Status" secondary={lifecycleSummary(lifecycle)} />
    </ListItem>
    <ListItem>
      <ListItemText primary="Owner" secondary={instance.owner} />
    </ListItem>
  </InstanceResultCard>
);
