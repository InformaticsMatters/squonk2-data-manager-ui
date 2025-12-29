import { useCallback, useEffect, useMemo, useState } from "react";

import { useGetApplications } from "@squonk/data-manager-client/application";
import { useGetJobs } from "@squonk/data-manager-client/job";
import { useGetRunningWorkflows, useGetWorkflows } from "@squonk/data-manager-client/workflow";

import { withPageAuthRequired as withPageAuthRequiredCSR } from "@auth0/nextjs-auth0/client";
import { Alert, Container, Grid, MenuItem, TextField } from "@mui/material";
import groupBy from "just-group-by";
import { debounce } from "lodash-es";
import dynamic from "next/dynamic";
import Head from "next/head";

import { RoleRequired } from "../components/auth/RoleRequired";
import { CenterLoader } from "../components/CenterLoader";
import { ApplicationCard } from "../components/runCards/ApplicationCard";
import { JobCard } from "../components/runCards/JobCard";
import { TEST_JOB_ID } from "../components/runCards/TestJob/jobId";
import { WorkflowCard } from "../components/runCards/WorkflowCard/WorkflowCard";
import { SearchTextField } from "../components/SearchTextField";
import { AS_ROLES, DM_ROLES } from "../constants/auth";
import { useCurrentProject, useIsUserAdminOrEditorOfCurrentProject } from "../hooks/projectHooks";
import { useKeyboardFocus } from "../hooks/useKeyboardFocus";
import Layout from "../layouts/Layout";
import { search } from "../utils/app/searches";

const TestJobCard = dynamic(
  () => import("../components/runCards/TestJob/TestJobCard").then((mod) => mod.TestJobCard),
  { loading: () => <CenterLoader /> },
);

type FilterOptions = "application" | "job" | "workflow";

/**
 * Page allowing the user to run jobs and applications
 */
const Run = () => {
  const [executionTypes, setExecutionTypes] = useState<FilterOptions[]>([
    "workflow",
    "application",
    "job",
  ]);
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearchValue, setDebouncedSearchValue] = useState("");
  const inputRef = useKeyboardFocus();

  // Create debounced search function
  const debouncedSetSearch = useMemo(
    () => debounce((value: string) => setDebouncedSearchValue(value), 300),
    [],
  );

  // Update debounced value when search value changes
  useEffect(() => {
    debouncedSetSearch(searchValue);
    return () => debouncedSetSearch.cancel();
  }, [searchValue, debouncedSetSearch]);

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
    data: jobs,
    isLoading: isJobsLoading,
    isError: isJobsError,
    error: jobsError,
  } = useGetJobs(
    { project_id: currentProject?.project_id },
    { query: { select: (data) => data.jobs } },
  );

  // Memoize filtered applications
  const filteredApplications = useMemo(() => {
    if (!applications) {
      return [];
    }
    return applications.filter(({ kind }) => search([kind], debouncedSearchValue));
  }, [applications, debouncedSearchValue]);

  // Memoize filtered and grouped jobs
  const filteredAndGroupedJobs = useMemo(() => {
    if (!jobs) {
      return {};
    }
    const filteredJobs = jobs
      .filter(({ keywords, category, name, job, description }) =>
        search([keywords, category, name, job, description], debouncedSearchValue),
      )
      .filter((job) => !job.replaced_by);

    return groupBy(filteredJobs, (job) => `${job.collection}+${job.job}`);
  }, [jobs, debouncedSearchValue]);

  // Memoize event handlers
  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value);
  }, []);

  const {
    data: workflows,
    isError: isWorkflowsError,
    error: workflowsError,
  } = useGetWorkflows({ query: { select: (data) => data.workflows } });

  // Fetch running workflows (instances of workflow definitions)
  const { data: runningWorkflowsData } = useGetRunningWorkflows(undefined, {
    query: { select: (data) => data.running_workflows },
  });

  // Memoize filtered and grouped jobs
  const filteredAndGroupedWorkflows = useMemo(() => {
    if (!workflows) {
      return {};
    }
    const filteredWorkflows = workflows.filter(({ workflow_name, workflow_description }) =>
      search([workflow_name, workflow_description], debouncedSearchValue),
    );

    return groupBy(filteredWorkflows, (workflow) => workflow.name);
  }, [workflows, debouncedSearchValue]);

  const cards = useMemo(() => {
    const applicationCards = filteredApplications.map((app) => (
      <Grid key={app.application_id} size={{ md: 3, sm: 6, xs: 12 }}>
        <ApplicationCard app={app} projectId={currentProject?.project_id} />
      </Grid>
    ));

    const jobCards = Object.entries(filteredAndGroupedJobs).map(([key, jobs]) => (
      <Grid key={key} size={{ md: 3, sm: 6, xs: 12 }}>
        <JobCard disabled={!hasPermissionToRun} job={jobs} projectId={currentProject?.project_id} />
      </Grid>
    ));

    const runningWorkflows = runningWorkflowsData ?? [];
    const workflowCards = Object.entries(filteredAndGroupedWorkflows).map(
      ([name, workflowGroup]) => {
        // Find all runs for this workflow definition
        const runs = runningWorkflows.filter((rw) => rw.workflow.id === workflowGroup[0].id);

        return (
          <Grid key={name} size={{ md: 3, sm: 6, xs: 12 }}>
            <WorkflowCard runningWorkflows={runs} workflow={workflowGroup[0]} />
          </Grid>
        );
      },
    );

    process.env.NODE_ENV === "development" && jobCards.push(<TestJobCard key={TEST_JOB_ID} />);

    // Create a map of execution types to their corresponding card arrays
    const cardsByType = { application: applicationCards, job: jobCards, workflow: workflowCards };

    // Filter and flatten the card arrays based on selected execution types
    const visibleCards = executionTypes
      .map((type) => cardsByType[type])
      .filter(Boolean)
      .flat();

    return visibleCards.length > 0 ? visibleCards : [];
  }, [
    filteredApplications,
    filteredAndGroupedJobs,
    runningWorkflowsData,
    filteredAndGroupedWorkflows,
    executionTypes,
    currentProject?.project_id,
    hasPermissionToRun,
  ]);

  return (
    <>
      <Head>
        <title>Squonk | Run</title>
      </Head>
      <RoleRequired roles={DM_ROLES}>
        <RoleRequired roles={AS_ROLES}>
          <Layout>
            <Container maxWidth="xl">
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ md: 4, sm: 6, xs: 12 }}>
                  <TextField
                    fullWidth
                    select
                    label="Filter"
                    slotProps={{
                      select: {
                        multiple: true,
                        onChange: (event) => {
                          setExecutionTypes(event.target.value as FilterOptions[]);
                        },
                      },
                    }}
                    value={executionTypes}
                  >
                    <MenuItem value="workflow">Workflows</MenuItem>
                    <MenuItem value="application">Applications</MenuItem>
                    <MenuItem value="job">Jobs</MenuItem>
                  </TextField>
                </Grid>

                {/* Search through each card */}
                <Grid size={{ md: 4, sm: 6, xs: 12 }} sx={{ ml: "auto" }}>
                  <SearchTextField
                    fullWidth
                    ref={inputRef}
                    value={searchValue}
                    onChange={handleSearchChange}
                  />
                </Grid>
              </Grid>

              {/* Errors */}
              <Grid container spacing={2}>
                {!!isApplicationsError && (
                  <Grid size={12}>
                    <Alert severity="error">
                      Applications failed to load ({applicationsError.response?.status})
                    </Alert>
                  </Grid>
                )}
                {!!isJobsError && (
                  <Grid size={12}>
                    <Alert severity="error">
                      Jobs failed to load ({jobsError.response?.status})
                    </Alert>
                  </Grid>
                )}
                {!!isWorkflowsError && (
                  <Grid size={12}>
                    <Alert severity="error">
                      Workflows failed to load ({workflowsError.response?.status})
                    </Alert>
                  </Grid>
                )}
                {/* Warnings */}
                {!currentProject && (
                  <Grid size={12}>
                    <Alert severity="warning">
                      Select a project from the settings to launch apps and run jobs.
                    </Alert>
                  </Grid>
                )}

                {!isApplicationsLoading && !isJobsLoading && !hasPermissionToRun && (
                  <Grid size={12}>
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
