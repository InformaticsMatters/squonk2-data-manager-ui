import { type InstanceGetResponse, type InstanceSummary } from "@squonk/data-manager-client";

import { Alert, CardContent, ListItem, ListItemText } from "@mui/material";

import { useIsUserAdminOrEditorOfCurrentProject, useProjectFromId } from "../../hooks/projectHooks";
import { ProjectListItem, type ProjectListItemProps } from "../projects/ProjectListItem";
import { LogsButton } from "../results/LogsButton";
import { RerunJobButton } from "../results/RerunJobButton";
import { ResultCard } from "../results/ResultCard";
import { ArchivedStatus } from "./ArchivedStatus";
import { ArchiveInstance } from "./ArchiveInstance";
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
  instance: InstanceGetResponse | InstanceSummary;
  /**
   * Action to take when the project is clicked
   */
  projectClickAction: ProjectListItemProps["clickAction"];
  collapsedByDefault?: boolean;
}

/**
 * Displays details of an instance of a job
 */
export const ResultJobCard = ({
  instanceId,
  instance,
  projectClickAction,
  collapsedByDefault = true,
}: ResultJobCardProps) => {
  const query = useInstanceRouterQuery();

  const associatedProject = useProjectFromId(instance.project_id);

  const hasPermission = useIsUserAdminOrEditorOfCurrentProject();

  if (instance.job_id === undefined) {
    return <Alert severity="error">Instance is missing a job ID</Alert>;
  }

  return (
    <ResultCard
      actions={({ setSlideIn }) => (
        <>
          <TerminateInstance
            disabled={!hasPermission}
            instanceId={instanceId}
            phase={instance.phase}
            projectId={instance.project_id}
            onTermination={() => setSlideIn(false)}
          />
          <RerunJobButton disabled={!hasPermission} instance={instance} />
          <LogsButton instance={instance} instanceId={instanceId} />
          <ArchiveInstance archived={instance.archived} instanceId={instanceId} />
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
      {!!associatedProject && (
        <ProjectListItem clickAction={projectClickAction} project={associatedProject} />
      )}
      <ArchivedStatus archived={instance.archived} />
    </ResultCard>
  );
};
