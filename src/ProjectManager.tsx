import React from 'react';

import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';

import { Project } from './Services/apiTypes';

interface IProps {
  projects: Project[];
}

const ProjectManager = ({ projects }: IProps) => {
  return (
    <Autocomplete
      id="project-selection"
      options={projects}
      getOptionLabel={(option) => option.name}
      style={{ width: 300 }}
      renderInput={(params) => <TextField {...params} label="Select project" variant="outlined" />}
    />
  );
};

export default ProjectManager;
