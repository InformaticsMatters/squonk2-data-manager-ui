import React, { FC } from 'react';

import { useQueryClient } from 'react-query';

import { IconButton, Tooltip } from '@material-ui/core';
import AddCircleRoundedIcon from '@material-ui/icons/AddCircleRounded';
import {
  getGetAvailableProjectsQueryKey,
  useAddNewProject,
  useGetAvailableProjects,
} from '@squonk/data-manager-client';

import { PopoverTextField } from '../PopoverTextField';

interface AddProjectProps {
  inverted?: boolean;
}

export const AddProject: FC<AddProjectProps> = ({ inverted = false }) => {
  const queryClient = useQueryClient();

  const mutation = useAddNewProject();

  const { data } = useGetAvailableProjects();
  const projects = data?.projects;

  const handleSubmit = async (value: string) => {
    const name = value.trim();
    const alreadyExists = !!projects?.find((project) => project.name === name);
    if (name && !alreadyExists) {
      await mutation.mutateAsync({ data: { name } });
      queryClient.invalidateQueries(getGetAvailableProjectsQueryKey());
    }
  };

  return (
    <PopoverTextField
      onSubmit={handleSubmit}
      textFieldLabel="Project Name"
      textFieldName="projectName"
      popoverId="add-project"
    >
      {(buttonProps) => (
        <Tooltip arrow title="Add new project">
          <IconButton color={inverted ? 'inherit' : 'default'} {...buttonProps}>
            <AddCircleRoundedIcon />
          </IconButton>
        </Tooltip>
      )}
    </PopoverTextField>
  );
};
