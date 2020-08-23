import React from 'react';

import { Container, Paper, Typography } from '@material-ui/core';

import DataTable from './DataTable';
import { useProjects } from './hooks';
// import { useProjects } from './hooks';
import LoginButton from './LoginButton';
import ProjectManager from './ProjectManager';

// Mock data
const rows = [
  { id: 0, fileName: 'poses.sdf', projects: ['p1', 'p2'], labels: ['a', 'b'] },
  { id: 1, fileName: 'protein.pdb', projects: ['p1', 'p3'], labels: ['c', 'b'] },
];

const MainView = () => {
  const projects = useProjects();
  return (
    <Container>
      <Typography variant="h1">Data Tier</Typography>
      <ProjectManager projects={projects} />
      <LoginButton />
      <Paper>
        <DataTable rows={rows} />
      </Paper>
    </Container>
  );
};

export default MainView;
