import { useMemo, useState } from "react";

import { useGetApplications } from "@squonk/data-manager-client/application";
import { useGetJobs } from "@squonk/data-manager-client/job";

import { withPageAuthRequired as withPageAuthRequiredCSR } from "@auth0/nextjs-auth0/client";
import { Alert, Container, Grid, MenuItem, TextField } from "@mui/material";
import dynamic from "next/dynamic";
import Head from "next/head";

import { RoleRequired } from "../components/auth/RoleRequired";
import { CenterLoader } from "../components/CenterLoader";
import { ApplicationCard } from "../components/runCards/ApplicationCard";
import { JobCard } from "../components/runCards/JobCard";
import { TEST_JOB_ID } from "../components/runCards/TestJob/jobId";
import { SearchTextField } from "../components/SearchTextField";
import { AS_ROLES, DM_ROLES } from "../constants/auth";
import { useCurrentProject, useIsUserAdminOrEditorOfCurrentProject } from "../hooks/projectHooks";
import Layout from "../layouts/Layout";
import { search } from "../utils/app/searches";

const TestJobCard = dynamic(
  () => import("../components/runCards/TestJob/TestJobCard").then((mod) => mod.TestJobCard),
  {
    loading: () => <CenterLoader />,
  },
);

/**
 * Page allowing the user to run jobs and applications
 */
const Run = () => {
  const [executionTypes, setExecutionTypes] = useState(["application", "job"]);
  const [searchValue, setSearchValue] = useState("");

  const currentProject = useCurrentProject();

  const hasPermissionToRun = useIsUserAdminOrEditorOfCurrentProject();
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
  } = useGetJobs({ project_id: currentProject?.project_id });
  const jobs = jobsData?.jobs;

  const cards = useMemo(() => {
    const applicationCards =
      applications
        // Filter the apps by the search value
        ?.filter(({ kind }) => search([kind], searchValue))
        // Then create a card for each
        .map((app) => (
          <Grid item key={app.application_id} md={3} sm={6} xs={12}>
            <ApplicationCard app={app} projectId={currentProject?.project_id} />
          </Grid>
        )) ?? [];

    // Filter the apps by the search value
    const filteredJobs = jobs?.filter(({ keywords, category, name, job, description }) =>
      search([keywords, category, name, job, description], searchValue),
    );

    // Then create a card for each
    const jobCards =
      filteredJobs?.map((job) => (
        <Grid item key={job.id} md={3} sm={6} xs={12}>
          <JobCard
            disabled={!hasPermissionToRun}
            job={job}
            projectId={currentProject?.project_id}
          />
        </Grid>
      )) ?? [];

    const showApplications = executionTypes.includes("application");
    const showJobs = executionTypes.includes("job");

    if (showApplications && showJobs) {
      return [...applicationCards, ...jobCards];
    } else if (showApplications) {
      return applicationCards;
    }
    return jobCards;
  }, [
    applications,
    currentProject?.project_id,
    executionTypes,
    jobs,
    searchValue,
    hasPermissionToRun,
  ]);

  process.env.NODE_ENV === "development" && cards.push(<TestJobCard key={TEST_JOB_ID} />);

  return (
    <>
      <Head>
        <title>Squonk | Apps/Jobs</title>
      </Head>
      <RoleRequired roles={DM_ROLES}>
        <RoleRequired roles={AS_ROLES}>
          <Layout>
            <Container maxWidth="xl">
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {/* Filter by apps/jobs */}
                <Grid item md={4} sm={6} xs={12}>
                  <TextField
                    fullWidth
                    select
                    label="Filter"
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
                <Grid item md={4} sm={6} sx={{ ml: "auto" }} xs={12}>
                  <SearchTextField
                    fullWidth
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                  />
                </Grid>
              </Grid>

              {/* Errors */}
              <Grid container spacing={2}>
                {!!isApplicationsError && (
                  <Grid item xs={12}>
                    <Alert severity="error">
                      Applications failed to load ({applicationsError.response?.status})
                    </Alert>
                  </Grid>
                )}
                {!!isJobsError && (
                  <Grid item xs={12}>
                    <Alert severity="error">
                      Jobs failed to load ({jobsError.response?.status})
                    </Alert>
                  </Grid>
                )}

                {/* Warnings */}
                {!currentProject && (
                  <Grid item xs={12}>
                    <Alert severity="warning">
                      Select a project from the settings to launch apps and run jobs.
                    </Alert>
                  </Grid>
                )}

                {!isApplicationsLoading && !isJobsLoading && !hasPermissionToRun && (
                  <Grid item xs={12}>
                    <Alert severity="warning">
                      You must be a project editor to run jobs in this project.
                    </Alert>
                  </Grid>
                )}

                {/* Actual content */}
                {!isApplicationsLoading && !isJobsLoading ? cards : <CenterLoader />}
              </Grid>
            </Container>
          </Layout>
        </RoleRequired>
      </RoleRequired>
    </>
  );
};

export default withPageAuthRequiredCSR(Run);
