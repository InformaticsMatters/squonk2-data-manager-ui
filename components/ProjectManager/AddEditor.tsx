import { FC } from 'react';

import { useQueryClient } from 'react-query';

import { Button, Tooltip } from '@material-ui/core';
import {
  getGetAvailableProjectsQueryKey,
  ProjectSummary,
  useAddEditorToProject,
} from '@squonk/data-manager-client';

import { PopoverTextField } from '../PopoverTextField';

interface AddEditorProps {
  currentProject: ProjectSummary;
}

export const AddEditor: FC<AddEditorProps> = ({ currentProject }) => {
  const queryClient = useQueryClient();

  const addEditorMutation = useAddEditorToProject();

  const handleSubmit = async (value: string) => {
    if (currentProject.project_id) {
      await addEditorMutation.mutateAsync({
        projectid: currentProject.project_id,
        userid: value,
      });
      queryClient.invalidateQueries(getGetAvailableProjectsQueryKey());
    }
  };

  return (
    <PopoverTextField
      onSubmit={handleSubmit}
      textFieldLabel="Editor username"
      textFieldName="username"
      popoverId="add-editor"
    >
      {(buttonProps) => (
        <Tooltip arrow title="Add editor to project">
          <Button {...buttonProps}>Add Editor</Button>
        </Tooltip>
      )}
    </PopoverTextField>
  );
};
