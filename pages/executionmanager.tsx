import React from 'react';

import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { css } from '@emotion/react';
import { Container, Grid, useTheme } from '@material-ui/core';
import { ApplicationSummary, useGetApplications } from '@squonk/data-manager-client';

import { ApplicationCard } from '../components/ApplicationCard/ApplicationCard';
import { useCurrentProject } from '../components/currentProjectContext';
import Layout from '../components/Layout';
import ProjectManager from '../components/ProjectManager';

const ExecutionManager = () => {
  const theme = useTheme();

  const [currentProject, setCurrentProject] = useCurrentProject();

  const { data } = useGetApplications();
  const applications = data?.applications as ApplicationSummary[];

  return (
    <Layout>
      <Container
        css={css`
          margin-top: ${theme.spacing(4)}px;
        `}
      >
        <h1>Execution Manager</h1>
        <Grid container alignItems="center" spacing={1}>
          <ProjectManager setCurrentProject={setCurrentProject} currentProject={currentProject} />
        </Grid>
        <Grid container spacing={2}>
          {applications?.map((app) => (
            <Grid key={app.application_id} item xs={3}>
              <ApplicationCard app={app} project={currentProject} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Layout>
  );
};

export default withPageAuthRequired(ExecutionManager);
