import { type ProjectDetail } from "@squonk/data-manager-client";
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
  projectId: ProjectDetail["project_id"];
  /**
   * editors
   */
  editors: ProjectDetail["editors"];
  /**
   * onChange function to be called after the project editors have been updated
   */
  onChange?: () => Promise<void>;
}

/**
 * MuiAutocomplete to manage the current editors of the selected project
 */
export const ProjectEditors = ({ projectId, editors, onChange }: ProjectEditorsProps) => {
  const { isLoading: isProjectsLoading } = useGetProjects();

  const { mutateAsync: addEditor, isPending: isAdding } = useAddEditorToProject();
  const { mutateAsync: removeEditor, isPending: isRemoving } = useRemoveEditorFromProject();
  const queryClient = useQueryClient();

  return (
    <ProjectMemberSelection
      addMember={(userId) => addEditor({ projectId, userId })}
      isLoading={isAdding || isRemoving || isProjectsLoading}
      memberList={editors}
      removeMember={(userId) => removeEditor({ projectId, userId })}
      title="Editors"
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
