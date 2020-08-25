import React, { useState } from 'react';

import { Container, Paper, Typography } from '@material-ui/core';

import DataTable from '../components/DataTable';
import LoginButton from '../components/LoginButton';
import ProjectManager from '../components/ProjectManager';
import APIService from '../Services/APIService';
import { Project } from '../Services/apiTypes';

const MainView = () => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  return (
    <Container>
      <Typography variant="h1">Data Tier</Typography>
      <LoginButton />
      {APIService.hasToken() && (
        <>
          <ProjectManager
            currentProject={currentProject}
            setCurrentProject={setCurrentProject}
          />
          <Paper>
            <DataTable currentProject={currentProject} />
          </Paper>
        </>
      )}
    </Container>
  );
};

export default MainView;
