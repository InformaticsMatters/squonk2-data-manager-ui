import React from 'react';

import { useQueryClient } from 'react-query';

import { useUser } from '@auth0/nextjs-auth0';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import {
  Grid,
  IconButton,
  InputAdornment,
  TextField,
  TextFieldProps,
  Tooltip,
} from '@material-ui/core';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import PersonIcon from '@material-ui/icons/Person';
import { Autocomplete } from '@material-ui/lab';
import {
  getGetAvailableProjectsQueryKey,
  useDeleteProject,
  useGetAvailableProjects,
} from '@squonk/data-manager-client';

import { useCurrentProject, useCurrentProjectId } from '../currentProjectContext';
import { AddProject } from './AddProject';
import { EditProject } from './EditProject';

interface ProjectManagerProps {
  inverted: boolean;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({ inverted }) => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useGetAvailableProjects();
  const projects = data?.projects;

  const [, setCurrentProjectId] = useCurrentProjectId();
  const currentProject = useCurrentProject();
  const { user } = useUser();

  const isOwner = !!user && user?.preferred_username === currentProject?.owner;
  const isEditor =
    !!user && !!currentProject?.editors?.includes(user?.preferred_username as string);

  const deleteProjectMutation = useDeleteProject();

  const handleDelete = async () => {
    currentProject?.project_id &&
      (await deleteProjectMutation.mutateAsync({ projectid: currentProject.project_id }));
    queryClient.invalidateQueries(getGetAvailableProjectsQueryKey());
  };

  const textFieldProps: TextFieldProps = {
    label: 'Select project',
    variant: 'outlined',
  };

  const InputProps = {
    startAdornment: isOwner ? (
      <>
        {currentProject?.owner === user?.preferred_username && (
          <InputAdornment position="start">
            <Tooltip arrow title="Delete selected project">
              <IconButton aria-label="Delete selected project" onClick={handleDelete}>
                <DeleteForeverIcon />
              </IconButton>
            </Tooltip>
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
      `}
    >
      <Grid item>
        <Autocomplete
          getOptionLabel={(option) => (option as any).name}
          id="project-selection"
          loading={isLoading}
          options={projects ?? []}
          renderInput={(params) =>
            inverted ? (
              <InvertedTextField
                {...textFieldProps}
                {...params}
                InputProps={{ ...params.InputProps, ...InputProps }}
              />
            ) : (
              <TextField {...textFieldProps} {...params} />
            )
          }
          style={{ width: 300 }}
          value={currentProject}
          onChange={(_, project) => setCurrentProjectId(project?.project_id ?? null)}
        />
      </Grid>
      <AddProject inverted={inverted} />
      <EditProject canEdit={isEditor} inverted={inverted} currentProject={currentProject} />
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
