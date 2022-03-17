import { useMemo } from 'react';
import { useState } from 'react';

import { useGetApplications } from '@squonk/data-manager-client/application';
import { useGetJobs } from '@squonk/data-manager-client/job';

import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { css } from '@emotion/react';
import { Container, Grid, MenuItem, TextField, useTheme } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import Head from 'next/head';

import { CenterLoader } from '../components/CenterLoader';
import { ApplicationCard } from '../components/executionsCards/ApplicationCard';
import { JobCard } from '../components/executionsCards/JobCard/JobCard';
import Layout from '../components/Layout';
import { SearchTextField } from '../components/SearchTextField';
import { useCurrentProject } from '../hooks/projectHooks';
import { RoleRequired } from '../utils/RoleRequired';
import { search } from '../utils/search';

/**
 * Page allowing the user to run jobs and applications
 */
const Executions = () => {
  const theme = useTheme();

  const [executionTypes, setExecutionTypes] = useState(['application', 'job']);
  const [searchValue, setSearchValue] = useState('');

  const currentProject = useCurrentProject();

  // Needs to assert some types here as Orval still doesn't get this right
  const {
    data: applicationsData,
    isLoading: isApplicationsLoading,
    isError: isApplicationsError,
    error: applicationsError,
  } = useGetApplications();
  const applications = applicationsData?.applications;

  const {
    data: jobsData,
    isLoading: isJobsLoading,
    isError: isJobsError,
    error: jobsError,
  } = useGetJobs();
  const jobs = jobsData?.jobs;

  const cards = useMemo(() => {
    const applicationCards =
      applications
        // Filter the apps by the search value
        ?.filter(({ kind }) => search([kind], searchValue))
        // Then create a card for each
        ?.map((app) => (
          <Grid item key={app.application_id} md={3} sm={6} xs={12}>
            <ApplicationCard app={app} projectId={currentProject?.project_id} />
          </Grid>
        )) ?? [];

    const jobCards =
      jobs
        // Filter the apps by the search value
        ?.filter(({ keywords, category, name }) => search([keywords, category, name], searchValue))
        // Then create a card for each
        ?.map((job) => (
          <Grid item key={job.id} md={3} sm={6} xs={12}>
            <JobCard job={job} projectId={currentProject?.project_id} />
          </Grid>
        )) ?? [];

    const showApplications = executionTypes.includes('application');
    const showJobs = executionTypes.includes('job');

    if (showApplications && showJobs) {
      return [...applicationCards, ...jobCards];
    } else if (showApplications) {
      return applicationCards;
    }
    return jobCards;
  }, [applications, currentProject?.project_id, executionTypes, jobs, searchValue]);

  return (
    <>
      <Head>
        <title>Squonk | Executions</title>
      </Head>
      <RoleRequired roles={process.env.NEXT_PUBLIC_KEYCLOAK_DM_USER_ROLE?.split(' ')}>
        <Layout>
          <Container>
            <Grid
              container
              css={css`
                margin-bottom: ${theme.spacing(2)}px;
              `}
              spacing={2}
            >
              {/* Filter by apps/jobs */}
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

              {/* Search through each card */}
              <Grid
                item
                css={css`
                  margin-left: auto;
                `}
                md={4}
                sm={6}
                xs={12}
              >
                <SearchTextField
                  fullWidth
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                />
              </Grid>
            </Grid>

            {/* Errors */}
            <Grid container spacing={2}>
              {isApplicationsError && (
                <Grid item xs={12}>
                  <Alert severity="warning">
                    Applications failed to load ({applicationsError.response?.status})
                  </Alert>
                </Grid>
              )}
              {isJobsError && (
                <Grid item xs={12}>
                  <Alert severity="warning">
                    Jobs failed to load ({jobsError.response?.status})
                  </Alert>
                </Grid>
              )}

              {/* Actual content */}
              {!isApplicationsLoading && !isJobsLoading ? cards : <CenterLoader />}
            </Grid>
          </Container>
        </Layout>
      </RoleRequired>
    </>
  );
};

export default withPageAuthRequired(Executions);
