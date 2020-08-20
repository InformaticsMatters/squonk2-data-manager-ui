import React from 'react';

import { Container, Paper, Typography } from '@material-ui/core';

import DataTable from './DataTable';

// Mock data
const rows = [
  { id: 0, fileName: 'poses.sdf', projects: ['p1', 'p2'], labels: ['a', 'b'] },
  { id: 1, fileName: 'protein.pdb', projects: ['p1', 'p3'], labels: ['c', 'b'] },
];

const App = () => {
  return (
    <Container>
      <Typography variant="h1">Data Tier</Typography>
      <Paper>
        <DataTable rows={rows} />
      </Paper>
    </Container>
  );
};

export default App;
