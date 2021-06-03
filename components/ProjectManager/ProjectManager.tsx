import React from 'react';

import { useUser } from '@auth0/nextjs-auth0';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { Grid, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { useGetAvailableProjects } from '@squonk/data-manager-client';

import { useCurrentProject, useCurrentProjectId } from '../currentProjectContext';
import { AddProject } from './AddProject';
import { EditProject } from './EditProject';

interface ProjectManagerProps {
  inverted: boolean;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({ inverted }) => {
  const { data, isLoading } = useGetAvailableProjects();
  const projects = data?.projects;

  const [, setCurrentProjectId] = useCurrentProjectId();
  const currentProject = useCurrentProject();
  const { user } = useUser();

  const canEdit = !!user && user?.preferred_username === currentProject?.owner;

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
              <InvertedTextField {...params} label="Select project" variant="outlined" />
            ) : (
              <TextField {...params} label="Select project" variant="outlined" />
            )
          }
          style={{ width: 300 }}
          value={currentProject}
          onChange={(_, project) => setCurrentProjectId(project?.project_id ?? null)}
        />
      </Grid>
      <AddProject inverted={inverted} />
      <EditProject canEdit={canEdit} inverted={inverted} currentProject={currentProject} />
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
