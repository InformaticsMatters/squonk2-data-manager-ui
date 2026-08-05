import { type InstanceGetResponse, type InstanceSummary } from "@/api/data-manager";

import { CardContent, ListItem, ListItemText } from "@mui/material";

import { capabilityIsEnabled } from "../../projects/capabilities";
import { type ResultCapabilities } from "../../projects/resultCapabilities";
import { projectLinks, type ResultsState } from "../../projects/routes";
import { HrefButton } from "../HrefButton";
import { CapabilityReasons } from "../results/CapabilityReasons";
import { ResultCard } from "../results/ResultCard";
import { ApplicationDetails } from "./ApplicationDetails";
import { ArchivedStatus } from "./ArchivedStatus";
import { ArchiveInstance } from "./ArchiveInstance";
import { TerminateInstance } from "./TerminateInstance";

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
   * What the caller may do with this instance, decided from the instance itself and the project
   * that owns it.
   */
  capabilities: ResultCapabilities;
  /**
   * Results list state this card's links preserve.
   */
  resultsState?: ResultsState;
  /**
   * Whether the card should have its collapsed content visible immediately. Defaults to true.
   */
  collapsedByDefault?: boolean;
}

export const ResultApplicationCard = ({
  instance,
  instanceId,
  capabilities,
  resultsState,
  collapsedByDefault = true,
}: ResultApplicationCardProps) => {
  const projectId = instance.project_id;

  return (
    <ResultCard
      actions={({ setSlideIn }) => (
        <>
          <TerminateInstance
            disabled={!capabilityIsEnabled(capabilities.termination)}
            instanceId={instanceId}
            phase={instance.phase}
            projectId={projectId}
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
          <ArchiveInstance
            archived={instance.archived}
            disabled={!capabilityIsEnabled(capabilities.archive)}
            instanceId={instanceId}
            projectId={projectId}
          />
          <CapabilityReasons capabilities={[capabilities.termination, capabilities.archive]} />
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
      href={projectLinks.result(projectId, "instances", instanceId, resultsState)}
      linkTitle="App"
      state={instance.phase}
    >
      <ListItem>
        <ListItemText primary={instance.name} secondary={instance.application_id} />
      </ListItem>
      <ArchivedStatus archived={instance.archived} />
    </ResultCard>
  );
};
