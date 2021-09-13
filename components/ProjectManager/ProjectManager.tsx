import React from 'react';
import { useQueryClient } from 'react-query';

import {
  getGetProjectsQueryKey,
  useDeleteProject,
  useGetProjects,
} from '@squonk/data-manager-client/project';
import { getGetUserAccountQueryKey } from '@squonk/data-manager-client/user';

import { useUser } from '@auth0/nextjs-auth0';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import type { TextFieldProps } from '@material-ui/core';
import { IconButton } from '@material-ui/core';
import { Grid, InputAdornment, TextField } from '@material-ui/core';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import PersonIcon from '@material-ui/icons/Person';
import { Autocomplete } from '@material-ui/lab';

import { useCurrentProject, useCurrentProjectId } from '../../hooks/currentProjectHooks';
import { WarningDeleteButton } from '../WarningDeleteButton';
import { AddProject } from './AddProject';
import { EditProject } from './EditProject';

export interface ProjectManagerProps {
  inverted?: boolean;
  wrap?: boolean;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  inverted = false,
  wrap = false,
}) => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useGetProjects();
  const projects = data?.projects;

  const { setCurrentProjectId } = useCurrentProjectId();
  const currentProject = useCurrentProject();
  const { user } = useUser();

  const isOwner = !!user && user.preferred_username === currentProject?.owner;
  const isEditor = !!user && !!currentProject?.editors.includes(user.preferred_username as string);

  const deleteProjectMutation = useDeleteProject();

  const handleDelete = async () => {
    currentProject?.project_id &&
      (await deleteProjectMutation.mutateAsync({ projectid: currentProject.project_id }));
    queryClient.invalidateQueries(getGetProjectsQueryKey());
    queryClient.invalidateQueries(getGetUserAccountQueryKey());
  };

  const textFieldProps: TextFieldProps = {
    label: 'Select project',
  };

  const InputProps = {
    startAdornment: isOwner ? (
      <>
        {currentProject?.owner === user.preferred_username && (
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
        )}

        {isEditor && <PersonIcon htmlColor="white" />}
      </>
    ) : (
      isEditor && <PersonIcon htmlColor="white" />
    ),
  };

  return (
    <div
      css={css`
        display: flex;
        align-items: center;
        flex-wrap: ${wrap ? 'wrap' : 'nowrap'};
      `}
    >
      <Grid item xs={12}>
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
      </Grid>
      <AddProject inverted={inverted} />
      <EditProject canEdit={isEditor} inverted={inverted} />
    </div>
  );
};

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
