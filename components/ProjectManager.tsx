import React from 'react';

import { Grid, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { useGetAvailableProjects } from '@squonk/data-manager-client';
import { Project } from '@squonk/data-manager-client/dist/orval/model/project';
import { ProjectSummary } from '@squonk/data-manager-client/dist/orval/model/projectSummary';

import AddProject from './AddProject';

const ProjectManager: React.FC<{ currentProject: ProjectSummary }> = () => {
  const { data, isLoading } = useGetAvailableProjects<Project, Error>();

  return (
    <Grid container>
      <Grid item>
        <Autocomplete
          id="project-selection"
          loading={isLoading}
          options={data?.projects ?? []}
          getOptionLabel={(option) => (option as any).name}
          style={{ width: 300 }}
          renderInput={(params) => (
            <TextField {...params} label="Select project" variant="outlined" />
          )}
          onChange={() => {}}
        />
      </Grid>
      <Grid item>
        <AddProject />
      </Grid>
    </Grid>
  );
};

export default ProjectManager;
