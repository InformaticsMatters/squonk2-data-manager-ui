import type { FC } from 'react';
import React, { useState } from 'react';

import { useGetApplications } from '@squonk/data-manager-client/application';
import { useGetJobs } from '@squonk/data-manager-client/job';

import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { css } from '@emotion/react';
import { Container, Grid, InputAdornment, MenuItem, TextField, useTheme } from '@material-ui/core';
import SearchRoundedIcon from '@material-ui/icons/SearchRounded';

import { ApplicationCard } from '../components/ExecutionsCard/ApplicationCard';
import { JobCard } from '../components/ExecutionsCard/JobCard';
import Layout from '../components/Layout';
import { useCurrentProject } from '../components/state/currentProjectHooks';
import { RoleRequired } from '../utils/RoleRequired';
import { search } from '../utils/search';

const Executions: FC = () => {
  const theme = useTheme();

  const [executionTypes, setExecutionTypes] = useState(['application', 'job']);
  const [searchValue, setSearchValue] = useState('');

  const currentProject = useCurrentProject();

  const { data: applicationsData } = useGetApplications();
  const applications = applicationsData?.applications;

  const { data: jobsData } = useGetJobs();
  const jobs = jobsData?.jobs;

  return (
    <RoleRequired roles={process.env.NEXT_PUBLIC_KEYCLOAK_USER_ROLE?.split(' ')}>
      <Layout>
        <Container
          css={css`
            margin-top: ${theme.spacing(4)}px;
          `}
        >
          <Grid
            container
            css={css`
              margin-bottom: ${theme.spacing(2)}px;
            `}
            spacing={2}
          >
            <Grid item md={4} sm={6} xs={12}>
              <TextField
                fullWidth
                select
                label="Filter Executions"
                SelectProps={{
                  multiple: true,
                  onChange: (event) => {
                    setExecutionTypes(event.target.value as string[]);
                  },
                }}
                value={executionTypes}
              >
                <MenuItem value="application">Applications</MenuItem>
                <MenuItem value="job">Jobs</MenuItem>
              </TextField>
            </Grid>
            <Grid
              item
              css={css`
                margin-left: auto;
              `}
              md={4}
              sm={6}
              xs={12}
            >
              <TextField
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <SearchRoundedIcon />
                    </InputAdornment>
                  ),
                }}
                label="Search"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
              />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            {executionTypes.includes('application') &&
              applications
                ?.filter(({ kind }) => search([kind], searchValue))
                ?.map((app) => (
                  <Grid item key={app.application_id} md={3} sm={6} xs={12}>
                    <ApplicationCard app={app} projectId={currentProject?.project_id} />
                  </Grid>
                ))}
            {executionTypes.includes('job') &&
              jobs
                ?.filter(({ keywords, category, name }) =>
                  search([keywords, category, name], searchValue),
                )
                ?.map((job) => (
                  <Grid item key={job.id} md={3} sm={6} xs={12}>
                    <JobCard job={job} projectId={currentProject?.project_id} />
                  </Grid>
                ))}
          </Grid>
        </Container>
      </Layout>
    </RoleRequired>
  );
};

export default withPageAuthRequired(Executions);
