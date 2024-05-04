import { type ProjectDetail } from "@squonk/data-manager-client";
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
  projectId: ProjectDetail["project_id"];
  /**
   * administrators
   */
  administrators: ProjectDetail["administrators"];
  /**
   * onChange function to be called after the project administrators have been updated
   */
  onChange?: () => Promise<void>;
}

/**
 * MuiAutocomplete to manage the current administrators of the selected project
 */
export const ProjectAdministrators = ({
  projectId,
  administrators,
  onChange,
}: ProjectAdministratorsProps) => {
  const { isLoading: isProjectsLoading } = useGetProjects();

  const { mutateAsync: addAdministrator, isPending: isAdding } = useAddAdministratorToProject();
  const { mutateAsync: removeAdministrator, isPending: isRemoving } =
    useRemoveAdministratorFromProject();
  const queryClient = useQueryClient();

  return (
    <ProjectMemberSelection
      addMember={(userId) => addAdministrator({ projectId, userId })}
      isLoading={isAdding || isRemoving || isProjectsLoading}
      memberList={administrators}
      removeMember={(userId) => removeAdministrator({ projectId, userId })}
      title="Administrators"
      onSettled={() => {
        const promises = [
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) }),
          queryClient.invalidateQueries({ queryKey: getGetProjectsQueryKey() }),
        ];
        onChange && promises.push(onChange());
        return Promise.all(promises);
      }}
    />
  );
};
