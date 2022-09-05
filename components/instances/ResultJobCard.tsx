import type { InstanceGetResponse, InstanceSummary } from "@squonk/data-manager-client";

import { Alert, CardContent, ListItem, ListItemText } from "@mui/material";

import { LogsButton } from "../../components/results/LogsButton";
import { RerunJobButton } from "../../components/results/RerunJobButton";
import { ResultCard } from "../../components/results/ResultCard";
import { useProjectFromId } from "../../hooks/projectHooks";
import { ProjectListItem } from "../projects/ProjectListItem";
import { JobDetails } from "./JobDetails";
import { TerminateInstance } from "./TerminateInstance";
import { useInstanceRouterQuery } from "./useInstanceRouterQuery";

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
  instance: InstanceSummary | InstanceGetResponse;
  collapsedByDefault?: boolean;
}

/**
 * Displays details of an instance of a job
 */
export const ResultJobCard = ({
  instanceId,
  instance,
  collapsedByDefault = true,
}: ResultJobCardProps) => {
  const query = useInstanceRouterQuery();

  const associatedProject = useProjectFromId(instance.project_id);

  if (instance.job_id === undefined) {
    return <Alert severity="error">Instance is missing a job ID</Alert>;
  }

  return (
    <ResultCard
      actions={({ setSlideIn }) => (
        <>
          <TerminateInstance
            instanceId={instanceId}
            phase={instance.phase}
            projectId={instance.project_id}
            onTermination={() => setSlideIn(false)}
          />
          <RerunJobButton instance={instance} />
          <LogsButton instance={instance} instanceId={instanceId} />
        </>
      )}
      collapsed={
        <CardContent>
          <JobDetails instanceId={instanceId} jobId={instance.job_id} />
        </CardContent>
      }
      collapsedByDefault={collapsedByDefault}
      createdDateTime={instance.launched}
      href={{
        pathname: "/results/instance/[instanceId]",
        query: { ...query, instanceId },
      }}
      linkTitle="Job"
      state={instance.phase}
    >
      <ListItem>
        <ListItemText primary={instance.name} secondary={instance.job_name} />
      </ListItem>
      <ProjectListItem projectName={associatedProject?.name || "loading..."} />
    </ResultCard>
  );
};
