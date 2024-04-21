import { type ProjectDetail } from "@squonk/data-manager-client";
import {
  getGetProjectQueryKey,
  getGetProjectsQueryKey,
  useAddObserverToProject,
  useGetProjects,
  useRemoveObserverFromProject,
} from "@squonk/data-manager-client/project";

import { useQueryClient } from "@tanstack/react-query";

import { ProjectMemberSelection } from "./ProjectMemberSelection";

export interface ProjectObserversProps {
  /**
   * Project to be edited.
   */
  projectId: ProjectDetail["project_id"];
  /**
   * observers
   */
  observers: ProjectDetail["observers"];
  /**
   * onChange function to be called after the project observers have been updated
   */
  onChange?: () => Promise<void>;
}

/**
 * Selector component to manage observers of a project.
 */
export const ProjectObservers = ({ projectId, observers, onChange }: ProjectObserversProps) => {
  const { isLoading: isProjectsLoading } = useGetProjects();

  const { mutateAsync: addObserver, isPending: isAdding } = useAddObserverToProject();
  const { mutateAsync: removeObserver, isPending: isRemoving } = useRemoveObserverFromProject();
  const queryClient = useQueryClient();

  return (
    <ProjectMemberSelection
      addMember={(userId) => addObserver({ projectId, userId })}
      isLoading={isAdding || isRemoving || isProjectsLoading}
      memberList={observers}
      removeMember={(userId) => removeObserver({ projectId, userId })}
      title="Observers"
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
