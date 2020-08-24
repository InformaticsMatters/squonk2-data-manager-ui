import React from 'react';

import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';

import { useProjects } from './hooks';
import { Project } from './Services/apiTypes';

interface IProps {
  setCurrentProject: (_: Project | null) => void;
  currentProject: Project | null;
}

const ProjectManager = ({ currentProject, setCurrentProject }: IProps) => {
  const { projects, loading } = useProjects();

  const handleChange = (_: React.ChangeEvent<{}>, newValue: Project | null) => {
    setCurrentProject(newValue);
  };

  return (
    <>
      <Autocomplete
        id="project-selection"
        loading={loading}
        options={projects}
        getOptionLabel={(option) => option.name}
        style={{ width: 300 }}
        renderInput={(params) => (
          <TextField {...params} label="Select project" variant="outlined" />
        )}
        onChange={handleChange}
      />
      <p>
        <b>Owner</b>: {currentProject?.owner}
      </p>
      <p>
        <b>Editors</b>: {currentProject?.editors.join(', ')}
      </p>
    </>
  );
};

export default ProjectManager;
