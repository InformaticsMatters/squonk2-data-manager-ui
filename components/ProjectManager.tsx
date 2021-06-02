import React from 'react';

import { Grid, TextField, Typography } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { ProjectSummary, useGetAvailableProjects } from '@squonk/data-manager-client';

import AddProject from './AddProject';

interface ProjectManagerProps {
  currentProject: ProjectSummary | null;
  setCurrentProject: (project: ProjectSummary | null) => void;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({ currentProject, setCurrentProject }) => {
  const { data, isLoading } = useGetAvailableProjects();
  const projects = data?.projects;

  return (
    <>
      <Grid item>
        <Autocomplete
          getOptionLabel={(option) => (option as any).name}
          id="project-selection"
          loading={isLoading}
          options={projects ?? []}
          renderInput={(params) => (
            <TextField {...params} label="Select project" variant="outlined" />
          )}
          size="small"
          style={{ width: 300 }}
          value={currentProject}
          onChange={(_, project) => setCurrentProject(project)}
        />
      </Grid>
      <Grid item>
        <AddProject />
      </Grid>
      <Grid item>
        {!!currentProject && (
          <>
            <Typography>
              <b>Owner</b>: {currentProject.owner}
            </Typography>
            <Typography>
              <b>Editors</b>: {currentProject.editors?.join(', ')}
            </Typography>
          </>
        )}
      </Grid>
    </>
  );
};

export default ProjectManager;
