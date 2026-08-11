import { type ReactNode } from "react";

import { type InstanceGetResponse, type InstanceSummary } from "@/api/data-manager";

import { ListItem, ListItemText } from "@mui/material";

import {
  resolveResultInstanceLifecycle,
  resultInstanceJob,
  resultInstanceKind,
} from "../../projects/instanceFacts";
import { type ResultCapabilities } from "../../projects/resultCapabilities";
import { projectLinks, type ResultsState } from "../../projects/routes";
import { HrefButton } from "../HrefButton";
import { CapabilityReasons } from "../results/CapabilityReasons";
import { LogsButton } from "../results/LogsButton";
import { RerunJobButton } from "../results/RerunJobButton";
import { ResultCard } from "../results/ResultCard";
import { ArchivedStatus } from "./ArchivedStatus";
import { ArchiveInstance } from "./ArchiveInstance";
import { TerminateInstance } from "./TerminateInstance";

export interface InstanceResultCardProps {
  /** What the caller may do with this instance, decided by it and the project that owns it. */
  capabilities: ResultCapabilities;
  /** Whatever the card is showing about this instance's progress. */
  collapsed?: ReactNode;
  collapsedByDefault: boolean;
  /** The instance as its project's own collection listed it, or as its own read answered. */
  instance: InstanceGetResponse | InstanceSummary;
  /**
   * The instance's own ID. An instance's own read does not carry it, so it is always the ID the
   * caller addressed rather than one read back out of the response.
   */
  instanceId: string;
  /**
   * The project this instance declares it belongs to. Every link built here, and every command
   * sent from here, is addressed inside that project rather than the one the caller happens to be
   * looking at.
   */
  projectId: string;
  /** Results list state this card's own link preserves. */
  resultsState?: ResultsState;
  /** Rows naming what the instance is, shown beside its identity. */
  children?: ReactNode;
  /** Called once the Data Manager has accepted the instance's termination or deletion. */
  onRemoved?: () => void;
}

/**
 * What the instance names itself as, taken from the instance alone. A job names the definition it
 * ran; anything else names the application it is an instance of, because that is the only identity
 * the Data Manager promises for it.
 */
const instanceIdentity = (instance: InstanceGetResponse | InstanceSummary) =>
  resultInstanceKind(instance) === "job"
    ? { primary: instance.job_name, secondary: instance.job_version }
    : { primary: instance.application_id, secondary: instance.application_version };

/**
 * The card one instance is presented on, wherever it is shown. Its identity, its own canonical
 * route, and its stop/delete, rerun, logs, and archive actions are decided here once, so an
 * instance listed with its project and the same instance on its own route can never drift apart in
 * what they address or offer.
 */
export const InstanceResultCard = ({
  capabilities,
  collapsed,
  collapsedByDefault,
  instance,
  instanceId,
  projectId,
  resultsState,
  children,
  onRemoved,
}: InstanceResultCardProps) => {
  const identity = instanceIdentity(instance);
  const kind = resultInstanceKind(instance);
  // The job definition this instance ran, where this client can address it. A job instance whose
  // definition it cannot address is still a job: it wrote its own logs and still says what it is.
  const job = resultInstanceJob(instance);

  return (
    <ResultCard
      accentColor={kind === "job" ? "primary.main" : undefined}
      actions={({ setSlideIn }) => (
        <>
          <TerminateInstance
            capability={capabilities.termination}
            instanceId={instanceId}
            // The control names what it would do to the instance this card is displaying. A card
            // showing content a refresh could not renew therefore still names the request that
            // content calls for, while the capability disables it for exactly that reason.
            lifecycle={resolveResultInstanceLifecycle({ instance })}
            projectId={projectId}
            // The Data Manager removes the instance whichever word the control used, so only a
            // rejected request leaves it where it is.
            onRemoved={() => {
              setSlideIn(false);
              onRemoved?.();
            }}
          />
          {!!instance.url && (
            <HrefButton
              color="primary"
              href={instance.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              Open
            </HrefButton>
          )}
          {job === undefined ? null : (
            <RerunJobButton
              instance={instance}
              rerun={capabilities.rerun}
              resultsState={resultsState}
            />
          )}
          {kind === "job" && <LogsButton instanceId={instanceId} projectId={projectId} />}
          <ArchiveInstance
            archived={instance.archived}
            capability={capabilities.archive}
            instanceId={instanceId}
            projectId={projectId}
          />
          <CapabilityReasons
            capabilities={
              job === undefined
                ? [capabilities.termination, capabilities.archive]
                : [capabilities.termination, capabilities.rerun, capabilities.archive]
            }
          />
        </>
      )}
      collapsed={collapsed}
      collapsedByDefault={collapsedByDefault}
      createdDateTime={instance.started ?? instance.launched}
      finishedDateTime={instance.stopped}
      href={projectLinks.result(projectId, "instances", instanceId, resultsState)}
      linkTitle={instance.name}
      state={instance.phase}
    >
      <ListItem>
        <ListItemText primary={identity.primary} secondary={identity.secondary} />
      </ListItem>
      {children}
      <ArchivedStatus archived={instance.archived} />
    </ResultCard>
  );
};
