import React from 'react';

import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';

import { Project } from '../Services/apiTypes';
import AddProjectButton from './AddProjectButton';

interface IProps {
  setCurrentProject: (_: Project | null) => void;
  currentProject: Project | null;
  refreshProjects: () => void;
  loading: boolean;
  projects: Project[];
}

const ProjectManager: React.FC<IProps> = ({
  currentProject,
  setCurrentProject,
  refreshProjects,
  loading,
  projects,
}) => {
  const handleProjectChange = (_: React.ChangeEvent<{}>, newValue: Project | null) => {
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
        onChange={handleProjectChange}
      />
      <AddProjectButton refreshProjects={refreshProjects} />
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
