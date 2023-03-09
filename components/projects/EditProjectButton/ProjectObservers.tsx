import type { DmError, ProjectDetail } from "@squonk/data-manager-client";
import {
  getGetProjectQueryKey,
  getGetProjectsQueryKey,
  useAddObserverToProject,
  useGetProjects,
  useRemoveObserverFromProject,
} from "@squonk/data-manager-client/project";

import { useQueryClient } from "@tanstack/react-query";

import { useEnqueueError } from "../../../hooks/useEnqueueStackError";
import { useKeycloakUser } from "../../../hooks/useKeycloakUser";
import { ManageUsers } from "../../ManageUsers";

export interface ProjectObserversProps {
  /**
   * Project to be edited.
   */
  project: ProjectDetail;
}

/**
 * Selector component to manage observers of a project.
 */
export const ProjectObservers = ({ project }: ProjectObserversProps) => {
  const { user: currentUser } = useKeycloakUser();

  const { isLoading: isProjectsLoading } = useGetProjects();
  const { mutateAsync: addObserver, isLoading: isAdding } = useAddObserverToProject();
  const { mutateAsync: removeObserver, isLoading: isRemoving } = useRemoveObserverFromProject();
  const queryClient = useQueryClient();

  const { enqueueError, enqueueSnackbar } = useEnqueueError<DmError>();

  if (currentUser.username) {
    return (
      <ManageUsers
        currentUsername={currentUser.username}
        isLoading={isAdding || isRemoving || isProjectsLoading}
        title="Observers"
        users={project.observers.filter((user) => user !== currentUser.username)}
        onRemove={async (value) => {
          const username = project.observers.find((user) => !value.includes(user));
          if (username) {
            try {
              await removeObserver({ projectId: project.project_id, userId: username });
            } catch (error) {
              enqueueError(error);
            }
            // DM Queries
            queryClient.invalidateQueries(getGetProjectQueryKey(project.project_id));
            queryClient.invalidateQueries(getGetProjectsQueryKey());
          } else {
            enqueueSnackbar("Username not found", { variant: "warning" });
          }
        }}
        onSelect={async (value) => {
          const username = value.find(
            (user) => user !== currentUser.username && !project.observers.includes(user),
          );
          if (username) {
            try {
              await addObserver({ projectId: project.project_id, userId: username });
            } catch (error) {
              enqueueError(error);
            }
            // DM Queries
            queryClient.invalidateQueries(getGetProjectQueryKey(project.project_id));
            queryClient.invalidateQueries(getGetProjectsQueryKey());
          } else {
            enqueueSnackbar("Username not found", { variant: "warning" });
          }
        }}
      />
    );
  }
  return null;
};
