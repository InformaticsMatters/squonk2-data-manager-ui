import React, { FC, useState } from 'react';

import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { css } from '@emotion/react';
import {
  Container,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
  useTheme,
} from '@material-ui/core';
import SearchRoundedIcon from '@material-ui/icons/SearchRounded';
import { useGetApplications, useGetJobs } from '@squonk/data-manager-client';

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
          spacing={2}
          css={css`
            margin-bottom: ${theme.spacing(2)}px;
          `}
        >
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              onChange={(event) => {
                // When using TextField for a select multiple, we have to cast the event type as
                // ts can't workout it's an array
                setExecutionTypes(event.target.value as unknown as string[]);
              }}
              label="Filter Executions"
              select
              SelectProps={{ multiple: true }}
              value={executionTypes}
            >
              <MenuItem value="application">Applications</MenuItem>
              <MenuItem value="job">Jobs</MenuItem>
            </TextField>
          </Grid>
          <Grid
            item
            xs={12}
            sm={6}
            md={4}
            css={css`
              margin-left: auto;
            `}
          >
            <TextField
              fullWidth
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              label="Search"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton edge="end">
                      <SearchRoundedIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
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
                  job.keywords.some((keyword) =>
                    keyword.toLowerCase().includes(searchValue.toLowerCase()),
                  ) ||
                  job.category.toLowerCase().includes(searchValue.toLowerCase()) ||
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
