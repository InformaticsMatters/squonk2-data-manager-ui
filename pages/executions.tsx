import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { css } from '@emotion/react';
import { Container, Grid, useTheme } from '@material-ui/core';
import { useGetApplications } from '@squonk/data-manager-client';

import { ApplicationCard } from '../components/ApplicationCard/ApplicationCard';
import { useCurrentProject } from '../components/currentProjectContext';
import Layout from '../components/Layout';

const Executions = () => {
  const theme = useTheme();

  const currentProject = useCurrentProject();

  const { data } = useGetApplications();
  const applications = data?.applications;

  return (
    <Layout>
      <Container
        css={css`
          margin-top: ${theme.spacing(4)}px;
        `}
      >
        <h1>Execution Manager</h1>
        <Grid container spacing={2}>
          {applications?.map((app) => (
            <Grid item key={app.application_id} md={3} sm={6} xs={12}>
              <ApplicationCard app={app} project={currentProject} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Layout>
  );
};

export default withPageAuthRequired(Executions);
