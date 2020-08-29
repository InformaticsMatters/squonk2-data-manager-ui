import React from 'react';

import { Container, Typography } from '@material-ui/core';

import LoginButton from '../components/LoginButton';
import { ProjectsProvider } from '../context/projects';
import DataTierAPI from '../Services/DataTierAPI';
import DataTierView from './DataTierView';

interface IProps {}

const MainView: React.FC<IProps> = () => {
  return (
    <Container component="main">
      <Typography variant="h2" component="h1">
        Squonk Data
      </Typography>
      <LoginButton />
      {DataTierAPI.hasToken() && (
        <ProjectsProvider>
          <DataTierView />
        </ProjectsProvider>
      )}
    </Container>
  );
};

export default MainView;
