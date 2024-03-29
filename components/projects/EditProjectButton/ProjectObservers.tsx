import type { ProjectDetail } from "@squonk/data-manager-client";
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
  project: ProjectDetail;
}

/**
 * Selector component to manage observers of a project.
 */
export const ProjectObservers = ({ project }: ProjectObserversProps) => {
  const { isLoading: isProjectsLoading } = useGetProjects();

  const { mutateAsync: addObserver, isPending: isAdding } = useAddObserverToProject();
  const { mutateAsync: removeObserver, isPending: isRemoving } = useRemoveObserverFromProject();
  const queryClient = useQueryClient();

  return (
    <ProjectMemberSelection
      addMember={(userId) => addObserver({ projectId: project.project_id, userId })}
      isLoading={isAdding || isRemoving || isProjectsLoading}
      memberList={project.observers}
      removeMember={(userId) => removeObserver({ projectId: project.project_id, userId })}
      title="Observers"
      onSettled={() =>
        Promise.all([
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(project.project_id) }),
          queryClient.invalidateQueries({ queryKey: getGetProjectsQueryKey() }),
        ])
      }
    />
  );
};
