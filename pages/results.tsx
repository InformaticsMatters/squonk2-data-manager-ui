import { useState } from "react";
import { QueryClient } from "react-query";
import { dehydrate } from "react-query/hydration";

import {
  getGetInstancesQueryKey,
  getInstances,
  useGetInstances,
} from "@squonk/data-manager-client/instance";
import { getGetProjectsQueryKey, getProjects } from "@squonk/data-manager-client/project";
import { getGetTasksQueryKey, getTasks, useGetTasks } from "@squonk/data-manager-client/task";

import { getAccessToken, withPageAuthRequired } from "@auth0/nextjs-auth0";
import { Alert, Container, Grid } from "@mui/material";
import type { GetServerSideProps } from "next";
import Head from "next/head";

import { CenterLoader } from "../components/CenterLoader";
import Layout from "../components/Layout";
import { ResultCards } from "../components/results/ResultCards";
import { ResultsToolbar } from "../components/results/ResultToolbar";
import { useCurrentProjectId } from "../hooks/projectHooks";
import { RoleRequired } from "../utils/RoleRequired";
import { options } from "../utils/ssrQueryOptions";

// This was a SSR test/example. Not sure if we want to do SSR everywhere but probably should.
export const getServerSideProps: GetServerSideProps = async ({ req, res, query }) => {
  const queryClient = new QueryClient();

  try {
    const { accessToken } = await getAccessToken(req, res);

    const projectId = query.project as string | undefined;

    if (projectId && accessToken) {
      // Prefetch some data
      const queries = [
        queryClient.prefetchQuery(getGetProjectsQueryKey(), () =>
          getProjects(options(accessToken)),
        ),

        queryClient.prefetchQuery(getGetInstancesQueryKey({ project_id: projectId }), async () =>
          getInstances({ project_id: projectId }, options(accessToken)),
        ),

        queryClient.prefetchQuery(getGetTasksQueryKey({ project_id: projectId }), () =>
          getTasks({ project_id: projectId }, options(accessToken)),
        ),
      ];

      // Make the queries in parallel
      await Promise.allSettled(queries);
    }
  } catch (error) {
    // TODO: smarter handling
    console.error(error);
  }

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  };
};

const Tasks = () => {
  const { projectId } = useCurrentProjectId();

  const {
    data: instancesData,
    isLoading: isInstancesLoading,
    isError: isInstancesError,
    error: instancesError,
  } = useGetInstances({
    project_id: projectId,
  });
  const instances = instancesData?.instances;

  const {
    data: tasksData,
    isLoading: isTasksLoading,
    isError: isTasksError,
    error: tasksError,
  } = useGetTasks({ project_id: projectId });
  const tasks = tasksData?.tasks;

  const [resultTypes, setResultTypes] = useState(["task", "instance"]);
  const [searchValue, setSearchValue] = useState("");

  return (
    <>
      <Head>
        <title>Squonk | Results</title>
      </Head>
      <RoleRequired roles={process.env.NEXT_PUBLIC_KEYCLOAK_DM_USER_ROLE?.split(" ")}>
        <Layout>
          <Container maxWidth="md">
            <ResultsToolbar
              resultTypes={resultTypes}
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              onSelectChange={setResultTypes}
            />

            <Grid container spacing={1}>
              <Grid item xs={12}>
                {isInstancesError && (
                  <Alert severity="warning">
                    Instances failed to load ({instancesError.response?.status})
                  </Alert>
                )}
              </Grid>

              <Grid item xs={12}>
                {isTasksError && (
                  <Alert severity="warning">
                    Tasks failed to load ({tasksError.response?.status})
                  </Alert>
                )}
              </Grid>

              <Grid item xs={12}>
                {(instances !== undefined || tasks !== undefined) &&
                !isTasksLoading &&
                !isInstancesLoading ? (
                  <ResultCards
                    instances={instances ?? []}
                    resultTypes={resultTypes}
                    searchValue={searchValue}
                    tasks={tasks ?? []}
                  />
                ) : (
                  <CenterLoader />
                )}
              </Grid>
            </Grid>
          </Container>
        </Layout>
      </RoleRequired>
    </>
  );
};

export default withPageAuthRequired(Tasks);
