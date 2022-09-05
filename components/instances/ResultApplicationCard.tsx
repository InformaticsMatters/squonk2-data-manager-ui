import type { HTMLProps } from "react";

import type { InstanceGetResponse, InstanceSummary } from "@squonk/data-manager-client";

import type { ButtonProps } from "@mui/material";
import { Button, CardContent, ListItem, ListItemText } from "@mui/material";

import { useProjectFromId } from "../../hooks/projectHooks";
import { ProjectListItem } from "../projects/ProjectListItem";
import { ResultCard } from "../results/ResultCard";
import { ApplicationDetails } from "./ApplicationDetails";
import { TerminateInstance } from "./TerminateInstance";
import { useInstanceRouterQuery } from "./useInstanceRouterQuery";

// Button Props doesn't support target and rel when using as a Link
type MissingButtonProps = Pick<HTMLProps<HTMLAnchorElement>, "target" | "rel">;

// ? odd that typescript doesn't raise an issue here as `MissingButtonProps` contains invalid props
const HrefButton = (props: ButtonProps & MissingButtonProps) => <Button {...props} />;

export interface ResultApplicationCardProps {
  /**
   * ID of the instance
   */
  instanceId: InstanceSummary["id"];
  /**
   * Instance of the application
   */
  instance: InstanceSummary | InstanceGetResponse;
  /**
   * Whether the card should have its collapsed content visible immediately. Defaults to true.
   */
  collapsedByDefault?: boolean;
}

export const ResultApplicationCard = ({
  instance,
  instanceId,
  collapsedByDefault = true,
}: ResultApplicationCardProps) => {
  const query = useInstanceRouterQuery();

  const associatedProject = useProjectFromId(instance.project_id);

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
          {instance.url && (
            <HrefButton
              color="primary"
              href={instance.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              Open
            </HrefButton>
          )}
        </>
      )}
      collapsed={
        <CardContent>
          <ApplicationDetails instanceId={instanceId} />
        </CardContent>
      }
      collapsedByDefault={collapsedByDefault}
      createdDateTime={instance.launched}
      href={{
        pathname: "/results/instance/[instanceId]",
        query: { ...query, instanceId },
      }}
      linkTitle="App"
      state={instance.phase}
    >
      <ListItem>
        <ListItemText primary={instance.name} />
      </ListItem>
      <ProjectListItem projectName={associatedProject?.name || "loading..."} />
    </ResultCard>
  );
};
