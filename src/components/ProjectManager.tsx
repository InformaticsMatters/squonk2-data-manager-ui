import React from 'react';

import styled from 'styled-components';

import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';

import { useProjects } from '../hooks';
import { Project } from '../Services/apiTypes';
import DataTierAPI from '../Services/DataTierAPI';
import AddProjectButton from './AddProjectButton';

interface IProps {
  setCurrentProject: (_: Project | null) => void;
  currentProject: Project | null;
}

const ProjectManager: React.FC<IProps> = ({ currentProject, setCurrentProject }) => {
  const { projects, loading, refreshProjects } = useProjects();

  const handleProjectChange = (_: React.ChangeEvent<{}>, newValue: Project | null) => {
    setCurrentProject(newValue);
  };

  const handleAddNewProject = async (name: string) => {
    await DataTierAPI.createNewProject(name);
    refreshProjects();
  };

  return (
    <Wrapper>
      <ProjectSelection>
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
        <AddProjectButton addNewProject={handleAddNewProject} />
      </ProjectSelection>
      {!!currentProject && (
        <div>
          <b>Owner</b>: {currentProject.owner}
          <br />
          <b>Editors</b>: {currentProject.editors.join(', ')}
        </div>
      )}
    </Wrapper>
  );
};

export default ProjectManager;

const Wrapper = styled.section`
  padding-top: ${({ theme }) => theme.spacing(2)}px;
  padding-bottom: ${({ theme }) => theme.spacing(2)}px;
`;

const ProjectSelection = styled.div`
  display: flex;
  align-items: center;
`;
