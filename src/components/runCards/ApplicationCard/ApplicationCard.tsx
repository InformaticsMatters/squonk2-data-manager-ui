import { type ApplicationSummary } from "@squonk/data-manager-client";

import { CircularProgress, LinearProgress, Typography } from "@mui/material";
import dynamic from "next/dynamic";

import { useIsUserAdminOrEditorOfCurrentProject } from "../../../hooks/projectHooks";
import { BaseCard } from "../../BaseCard";
import { type InstancesListProps } from "../InstancesList";
import { type ApplicationModalButtonProps } from "./ApplicationModalButton";

const ApplicationModalButton = dynamic<ApplicationModalButtonProps>(
  () => import("./ApplicationModalButton").then((mod) => mod.ApplicationModalButton),
  { loading: () => <CircularProgress size="1rem" /> },
);

const InstancesList = dynamic<InstancesListProps>(
  () => import("../InstancesList").then((mod) => mod.InstancesList),
  { loading: () => <LinearProgress /> },
);

export interface ApplicationCardProps extends Pick<ApplicationModalButtonProps, "projectId"> {
  /**
   * The application object to display
   */
  app: ApplicationSummary;
}

/**
 * MuiCard that displays a summary of a application with actions to create new instances and view
 * existing instances.
 */
export const ApplicationCard = ({ app, projectId }: ApplicationCardProps) => {
  const hasPermission = useIsUserAdminOrEditorOfCurrentProject();

  return (
    <BaseCard
      accentColor="secondary.dark"
      actions={({ setExpanded }) => (
        <ApplicationModalButton
          applicationId={app.application_id}
          disabled={!hasPermission}
          projectId={projectId}
          onLaunch={() => setExpanded(true)}
        />
      )}
      collapsed={
        <InstancesList predicate={(instance) => instance.application_id === app.application_id} />
      }
      header={{ title: app.kind, subtitle: app.group, avatar: app.kind[0] }}
    >
      <Typography
        color="text.secondary"
        sx={{ textTransform: "uppercase", fontWeight: "bold" }}
        variant="caption"
      >
        Application
      </Typography>
    </BaseCard>
  );
};
