import { type InstanceGetResponse, type InstanceSummary } from "@/api/data-manager";

import { Alert, CardContent, ListItem, ListItemText } from "@mui/material";

import { capabilityIsEnabled } from "../../projects/capabilities";
import { type ResultCapabilities } from "../../projects/resultCapabilities";
import { projectLinks, type ResultsState } from "../../projects/routes";
import { CapabilityReasons } from "../results/CapabilityReasons";
import { LogsButton } from "../results/LogsButton";
import { RerunJobButton } from "../results/RerunJobButton";
import { ResultCard } from "../results/ResultCard";
import { ArchivedStatus } from "./ArchivedStatus";
import { ArchiveInstance } from "./ArchiveInstance";
import { JobDetails } from "./JobDetails";
import { TerminateInstance } from "./TerminateInstance";

export interface ResultJobCardProps {
  /**
   * Instance ID of the job
   *
   * @private
   * Also included in an InstanceSummary but isn't currently in an InstanceGetResponse
   */
  instanceId: InstanceSummary["id"];
  /**
   * Instance of the job
   */
  instance: InstanceGetResponse | InstanceSummary;
  /**
   * What the caller may do with this instance, decided from the instance itself and the project
   * that owns it rather than from any selected project.
   */
  capabilities: ResultCapabilities;
  /**
   * Results list state this card's links preserve.
   */
  resultsState?: ResultsState;
  collapsedByDefault?: boolean;
}

/**
 * Displays details of an instance of a job. Every link and action it generates addresses the
 * project the instance itself declares, so a card can neither act on nor navigate into another
 * project's scope.
 */
export const ResultJobCard = ({
  instanceId,
  instance,
  capabilities,
  resultsState,
  collapsedByDefault = true,
}: ResultJobCardProps) => {
  if (instance.job_id === undefined) {
    return <Alert severity="error">Instance is missing a job ID</Alert>;
  }

  const projectId = instance.project_id;

  return (
    <ResultCard
      accentColor="primary.main"
      actions={({ setSlideIn }) => (
        <>
          <TerminateInstance
            disabled={!capabilityIsEnabled(capabilities.termination)}
            instanceId={instanceId}
            phase={instance.phase}
            projectId={projectId}
            onTermination={() => setSlideIn(false)}
          />
          <RerunJobButton
            disabled={!capabilityIsEnabled(capabilities.rerun)}
            instance={instance}
            resultsState={resultsState}
          />
          <LogsButton instanceId={instanceId} projectId={projectId} />
          <ArchiveInstance
            archived={instance.archived}
            disabled={!capabilityIsEnabled(capabilities.archive)}
            instanceId={instanceId}
          />
          <CapabilityReasons
            capabilities={[capabilities.termination, capabilities.rerun, capabilities.archive]}
          />
        </>
      )}
      collapsed={
        <CardContent>
          <JobDetails instanceId={instanceId} jobId={instance.job_id} />
        </CardContent>
      }
      collapsedByDefault={collapsedByDefault}
      createdDateTime={instance.started ?? instance.launched}
      finishedDateTime={instance.stopped}
      href={projectLinks.result(projectId, "instances", instanceId, resultsState)}
      linkTitle="Job"
      state={instance.phase}
    >
      <ListItem>
        <ListItemText primary={instance.name} secondary={instance.job_name} />
      </ListItem>
      <ArchivedStatus archived={instance.archived} />
    </ResultCard>
  );
};
