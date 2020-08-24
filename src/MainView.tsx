import React, { useState } from 'react';

import { Container, Paper, Typography } from '@material-ui/core';

import DataTable from './DataTable';
import LoginButton from './LoginButton';
import ProjectManager from './ProjectManager';
import APIService from './Services/APIService';
import { Project } from './Services/apiTypes';

// Mock data
const rows = [
  { id: 0, fileName: 'poses.sdf', projects: ['p1', 'p2'], labels: ['a', 'b'] },
  { id: 1, fileName: 'protein.pdb', projects: ['p1', 'p3'], labels: ['c', 'b'] },
];

const MainView = () => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  return (
    <Container>
      <Typography variant="h1">Data Tier</Typography>
      <LoginButton />
      {APIService.hasToken() && (
        <>
          <ProjectManager currentProject={currentProject} setCurrentProject={setCurrentProject} />
          <Paper>
            <DataTable rows={rows} />
          </Paper>
        </>
      )}
    </Container>
  );
};

export default MainView;
