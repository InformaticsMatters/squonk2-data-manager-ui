import React, { useState } from 'react';

import { Container, Paper, Typography } from '@material-ui/core';

import DataTable from '../components/DataTable';
import LoginButton from '../components/LoginButton';
import ProjectManager from '../components/ProjectManager';
import UploadFileButton from '../components/UploadFileButton';
import { DatasetsProvider } from '../context/datasets';
import { Project } from '../Services/apiTypes';

const MainView = () => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  return (
    <DatasetsProvider project={currentProject}>
      <Container>
        <Typography variant="h2" component="h1">
          Squonk Data
        </Typography>
        <LoginButton />
        <UploadFileButton currentProject={currentProject} />
        <ProjectManager currentProject={currentProject} setCurrentProject={setCurrentProject} />
        <Paper>
          <DataTable />
        </Paper>
      </Container>
    </DatasetsProvider>
  );
};

export default MainView;
