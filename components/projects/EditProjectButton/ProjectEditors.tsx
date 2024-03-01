import type { ProjectDetail } from "@squonk/data-manager-client";
import {
  getGetProjectQueryKey,
  getGetProjectsQueryKey,
  useAddEditorToProject,
  useGetProjects,
  useRemoveEditorFromProject,
} from "@squonk/data-manager-client/project";

import { useQueryClient } from "@tanstack/react-query";

import { ProjectMemberSelection } from "./ProjectMemberSelection";

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
  const { isLoading: isProjectsLoading } = useGetProjects();

  const { mutateAsync: addEditor, isPending: isAdding } = useAddEditorToProject();
  const { mutateAsync: removeEditor, isPending: isRemoving } = useRemoveEditorFromProject();
  const queryClient = useQueryClient();

  return (
    <ProjectMemberSelection
      addMember={(userId) => addEditor({ projectId: project.project_id, userId })}
      isLoading={isAdding || isRemoving || isProjectsLoading}
      memberList={project.editors}
      removeMember={(userId) => removeEditor({ projectId: project.project_id, userId })}
      title="Editors"
      onSettled={() =>
        Promise.all([
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(project.project_id) }),
          queryClient.invalidateQueries({ queryKey: getGetProjectsQueryKey() }),
        ])
      }
    />
  );
};
