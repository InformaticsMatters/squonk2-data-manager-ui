import type { ProjectDetail } from "@squonk/data-manager-client";
import {
  getGetProjectQueryKey,
  getGetProjectsQueryKey,
  useAddAdministratorToProject,
  useGetProjects,
  useRemoveAdministratorFromProject,
} from "@squonk/data-manager-client/project";

import { useQueryClient } from "@tanstack/react-query";

import { ProjectMemberSelection } from "./ProjectMemberSelection";

export interface ProjectAdministratorsProps {
  /**
   * Project to be edited.
   */
  project: ProjectDetail;
}

/**
 * MuiAutocomplete to manage the current administrators of the selected project
 */
export const ProjectAdministrators = ({ project }: ProjectAdministratorsProps) => {
  const { isLoading: isProjectsLoading } = useGetProjects();

  const { mutateAsync: addAdministrator, isPending: isAdding } = useAddAdministratorToProject();
  const { mutateAsync: removeAdministrator, isPending: isRemoving } =
    useRemoveAdministratorFromProject();
  const queryClient = useQueryClient();

  return (
    <ProjectMemberSelection
      addMember={(userId) => addAdministrator({ projectId: project.project_id, userId })}
      isLoading={isAdding || isRemoving || isProjectsLoading}
      memberList={project.administrators}
      removeMember={(userId) => removeAdministrator({ projectId: project.project_id, userId })}
      title="Administrators"
      onSettled={() =>
        Promise.all([
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(project.project_id) }),
          queryClient.invalidateQueries({ queryKey: getGetProjectsQueryKey() }),
        ])
      }
    />
  );
};
