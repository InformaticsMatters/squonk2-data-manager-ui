import React, { FC, useState } from 'react';

import { useGetApplications } from '@squonk/data-manager-client/application';
import { useGetJobs } from '@squonk/data-manager-client/job';

import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { css } from '@emotion/react';
import { Container, Grid, InputAdornment, MenuItem, TextField, useTheme } from '@material-ui/core';
import SearchRoundedIcon from '@material-ui/icons/SearchRounded';

import { useCurrentProject } from '../components/CurrentProjectContext';
import { ApplicationCard } from '../components/ExecutionsCard/ApplicationCard';
import { JobCard } from '../components/ExecutionsCard/JobCard';
import Layout from '../components/Layout';

const Executions: FC = () => {
  const theme = useTheme();

  const [executionTypes, setExecutionTypes] = useState<string[]>(['application', 'job']);
  const [searchValue, setSearchValue] = useState('');

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
              SelectProps={{ multiple: true }}
              value={executionTypes}
              onChange={(event) => {
                // TODO: change this to be inside SelectProps for proper argument type
                // When using TextField for a select multiple, we have to cast the event type as
                // ts can't workout it's an array
                setExecutionTypes(event.target.value as unknown as string[]);
              }}
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
              ?.filter((app) => app.kind.toLowerCase().includes(searchValue.toLowerCase()))
              ?.map((app) => (
                <Grid item key={app.application_id} md={3} sm={6} xs={12}>
                  <ApplicationCard app={app} project={currentProject} />
                </Grid>
              ))}
          {executionTypes.includes('job') &&
            jobs
              ?.filter(
                (job) =>
                  job.keywords?.some((keyword) =>
                    keyword.toLowerCase().includes(searchValue.toLowerCase()),
                  ) ||
                  job.category?.toLowerCase().includes(searchValue.toLowerCase()) ||
                  job.name.toLowerCase().includes(searchValue.toLowerCase()),
              )
              ?.map((job) => (
                <Grid item key={job.id} md={3} sm={6} xs={12}>
                  <JobCard jobId={job.id} />
                </Grid>
              ))}
        </Grid>
      </Container>
    </Layout>
  );
};

export default withPageAuthRequired(Executions);
