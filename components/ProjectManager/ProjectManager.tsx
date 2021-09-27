import React from 'react';
import { useQueryClient } from 'react-query';

import {
  getGetProjectsQueryKey,
  useDeleteProject,
  useGetProjects,
} from '@squonk/data-manager-client/project';
import { getGetUserAccountQueryKey } from '@squonk/data-manager-client/user';

import styled from '@emotion/styled';
import type { TextFieldProps } from '@material-ui/core';
import { Box } from '@material-ui/core';
import { IconButton } from '@material-ui/core';
import { InputAdornment, TextField } from '@material-ui/core';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import PersonIcon from '@material-ui/icons/Person';
import { Autocomplete } from '@material-ui/lab';

import { useCurrentProject, useCurrentProjectId } from '../../hooks/currentProjectHooks';
import { useKeycloakUser } from '../../hooks/useKeycloakUser';
import { WarningDeleteButton } from '../WarningDeleteButton';
import { AddProject } from './AddProject';
import { EditProject } from './EditProject';
import type { CommonProps } from './types';

export interface ProjectManagerProps extends CommonProps {
  /**
   * Whether the input and buttons should wrap onto a new line. Defaults to false.
   */
  wrap?: boolean;
}

/**
 * MuiAutocomplete to manage the selected project and manage this project by selecting editors and
 * deletion.
 */
export const ProjectManager = ({ inverted = false, wrap = false }: ProjectManagerProps) => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useGetProjects();
  const projects = data?.projects;

  const { setCurrentProjectId } = useCurrentProjectId();
  const currentProject = useCurrentProject();
  const { user } = useKeycloakUser();

  const isOwner = user.username === currentProject?.owner;
  const isEditor = !!user.username && !!currentProject?.editors.includes(user.username);

  const deleteProjectMutation = useDeleteProject();

  const handleDelete = async () => {
    if (currentProject?.project_id) {
      await deleteProjectMutation.mutateAsync({ projectid: currentProject.project_id });
    }
    queryClient.invalidateQueries(getGetProjectsQueryKey());
    queryClient.invalidateQueries(getGetUserAccountQueryKey());
  };

  const textFieldProps: TextFieldProps = {
    label: 'Select project',
  };

  const adornment = (
    <InputAdornment position="start">
      <WarningDeleteButton
        modalId={`delete-${currentProject?.project_id}`}
        title="Delete Project"
        tooltipText="Delete selected project"
        onDelete={handleDelete}
      >
        {({ openModal }) => (
          <IconButton aria-label="Delete selected project" onClick={openModal}>
            <DeleteForeverIcon />
          </IconButton>
        )}
      </WarningDeleteButton>
    </InputAdornment>
  );

  const InputProps = {
    startAdornment: isOwner ? (
      <>
        {adornment}
        {isEditor && <PersonIcon htmlColor={inverted ? 'white' : undefined} />}
      </>
    ) : (
      isEditor && <PersonIcon htmlColor={inverted ? 'white' : undefined} />
    ),
  };

  return (
    <Box alignItems="center" display="flex" flexWrap={wrap ? 'wrap' : 'nowrap'}>
      <Autocomplete
        fullWidth
        getOptionLabel={(option) => option.name}
        id="project-selection"
        loading={isLoading}
        options={projects ?? []}
        renderInput={(params) =>
          inverted ? (
            <InvertedTextField
              {...textFieldProps}
              {...params}
              InputProps={{ ...params.InputProps, ...InputProps }}
              size="medium" // Must be last to override size being set to undefined by above spreads
            />
          ) : (
            <TextField {...textFieldProps} {...params} size="medium" />
          )
        }
        style={{ minWidth: 240, width: '100%' }}
        value={currentProject}
        onChange={(_, project) => {
          setCurrentProjectId(project?.project_id, true);
        }}
      />
      <AddProject inverted={inverted} />
      <EditProject canEdit={isEditor} inverted={inverted} />
    </Box>
  );
};

// Textfield but inverted color to work well on a dark background
const InvertedTextField = styled(TextField)`
  & * input {
    color: white;
  }
  & label,
  & .MuiIconButton-label,
  & label.Mui-focused {
    color: white;
  }

  & .MuiOutlinedInput-root {
    & fieldset,
    &:hover fieldset,
    &.Mui-focused fieldset {
      border-color: white;
    }
  }
`;
