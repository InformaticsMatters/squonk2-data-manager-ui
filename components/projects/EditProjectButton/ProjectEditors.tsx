import type { DmError, ProjectDetail } from "@squonk/data-manager-client";
import {
  getGetProjectQueryKey,
  getGetProjectsQueryKey,
  useAddEditorToProject,
  useGetProjects,
  useRemoveEditorFromProject,
} from "@squonk/data-manager-client/project";

import { useQueryClient } from "@tanstack/react-query";

import { useEnqueueError } from "../../../hooks/useEnqueueStackError";
import { useKeycloakUser } from "../../../hooks/useKeycloakUser";
import { ManageUsers } from "../../ManageUsers";

export interface ProjectEditorsProps {
  /**
   * Project to be edited.
   */
  project: ProjectDetail;
}

/**
 * MuiAutocomplete to manage the current editors of the selected project
 */
export const ProjectEditors = ({ project }: ProjectEditorsProps) => {
  const { user: currentUser } = useKeycloakUser();

  const { isLoading: isProjectsLoading } = useGetProjects();
  const { mutateAsync: addEditor, isPending: isAdding } = useAddEditorToProject();
  const { mutateAsync: removeEditor, isPending: isRemoving } = useRemoveEditorFromProject();
  const queryClient = useQueryClient();

  const { enqueueError, enqueueSnackbar } = useEnqueueError<DmError>();

  if (currentUser.username) {
    return (
      <ManageUsers
        currentUsername={currentUser.username}
        isLoading={isAdding || isRemoving || isProjectsLoading}
        title="Editors"
        users={project.editors.filter((user) => user !== currentUser.username)}
        onRemove={async (value) => {
          const username = project.editors.find((editor) => !value.includes(editor));
          if (username) {
            try {
              await removeEditor({ projectId: project.project_id, userId: username });
            } catch (error) {
              enqueueError(error);
            }
            // DM Queries
            queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(project.project_id) });
            queryClient.invalidateQueries({ queryKey: getGetProjectsQueryKey() });
          } else {
            enqueueSnackbar("Username not found", { variant: "warning" });
          }
        }}
        onSelect={async (value) => {
          const username = value.find((user) => !project.editors.includes(user));
          if (username) {
            try {
              await addEditor({ projectId: project.project_id, userId: username });
            } catch (error) {
              enqueueError(error);
            }
            // DM Queries
            queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(project.project_id) });
            queryClient.invalidateQueries({ queryKey: getGetProjectsQueryKey() });
          } else {
            enqueueSnackbar("Username not found", { variant: "warning" });
          }
        }}
      />
    );
  }
  return null;
};
