import { type InstanceGetResponse, type InstanceSummary } from "@squonk/data-manager-client";

import { CardContent, ListItem, ListItemText } from "@mui/material";

import { useIsUserAdminOrEditorOfCurrentProject, useProjectFromId } from "../../hooks/projectHooks";
import { HrefButton } from "../HrefButton";
import { ProjectListItem } from "../projects/ProjectListItem";
import { ResultCard } from "../results/ResultCard";
import { ApplicationDetails } from "./ApplicationDetails";
import { ArchivedStatus } from "./ArchivedStatus";
import { ArchiveInstance } from "./ArchiveInstance";
import { TerminateInstance } from "./TerminateInstance";
import { useInstanceRouterQuery } from "./useInstanceRouterQuery";

export interface ResultApplicationCardProps {
  /**
   * ID of the instance
   */
  instanceId: InstanceSummary["id"];
  /**
   * Instance of the application
   */
  instance: InstanceGetResponse | InstanceSummary;
  /**
   * Action to take when the project is clicked
   */
  projectClickAction: "navigate-to-project" | "select-project";
  /**
   * Whether the card should have its collapsed content visible immediately. Defaults to true.
   */
  collapsedByDefault?: boolean;
}

export const ResultApplicationCard = ({
  instance,
  instanceId,
  projectClickAction,
  collapsedByDefault = true,
}: ResultApplicationCardProps) => {
  const query = useInstanceRouterQuery();

  const associatedProject = useProjectFromId(instance.project_id);

  const hasPermission = useIsUserAdminOrEditorOfCurrentProject();

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
          <ArchiveInstance archived={instance.archived} instanceId={instanceId} />
        </>
      )}
      collapsed={
        <CardContent>
          <ApplicationDetails instanceId={instanceId} />
        </CardContent>
      }
      collapsedByDefault={collapsedByDefault}
      createdDateTime={instance.started ?? instance.launched}
      finishedDateTime={instance.stopped}
      href={{ pathname: "/results/instance/[instanceId]", query: { ...query, instanceId } }}
      linkTitle="App"
      state={instance.phase}
    >
      <ListItem>
        <ListItemText primary={instance.name} secondary={instance.application_id} />
      </ListItem>
      {!!associatedProject && (
        <ProjectListItem clickAction={projectClickAction} project={associatedProject} />
      )}
      <ArchivedStatus archived={instance.archived} />
    </ResultCard>
  );
};
