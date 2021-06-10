import React from 'react';

import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { css } from '@emotion/react';
import { Container, Grid, useTheme } from '@material-ui/core';
import { useGetApplications, useGetJobs } from '@squonk/data-manager-client';

import { useCurrentProject } from '../components/CurrentProjectContext';
import { ApplicationCard } from '../components/ExecutionsCard/ApplicationCard';
import { JobCard } from '../components/ExecutionsCard/JobCard';
import Layout from '../components/Layout';

const Executions = () => {
  const theme = useTheme();

  const currentProject = useCurrentProject();

  const { data: applicationsData } = useGetApplications();
  const applications = applicationsData?.applications;

  const { data: jobsData } = useGetJobs();
  const jobs = jobsData?.jobs;

  return (
    <Layout>
      <Container
        css={css`
          margin-top: ${theme.spacing(4)}px;
        `}
      >
        <Grid container spacing={2}>
          {applications?.map((app) => (
            <Grid item key={app.application_id} md={3} sm={6} xs={12}>
              <ApplicationCard app={app} project={currentProject} />
            </Grid>
          ))}
          {jobs?.map((job) => (
            <Grid item key={job.id} md={3} sm={6} xs={12}>
              <JobCard job={job} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Layout>
  );
};

export default withPageAuthRequired(Executions);
