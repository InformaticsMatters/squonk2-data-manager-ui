import type { FC } from 'react';
import React, { useState } from 'react';
import { QueryClient } from 'react-query';
import { dehydrate } from 'react-query/hydration';

import type { InstancesGetResponse, TasksGetResponse } from '@squonk/data-manager-client';
import {
  getGetInstancesQueryKey,
  getInstances,
  useGetInstances,
} from '@squonk/data-manager-client/instance';
import { getGetProjectsQueryKey, getProjects } from '@squonk/data-manager-client/project';
import { getGetTasksQueryKey, getTasks, useGetTasks } from '@squonk/data-manager-client/task';

import { getAccessToken, withPageAuthRequired } from '@auth0/nextjs-auth0';
import { css } from '@emotion/react';
import { Container, Grid, useTheme } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import type { AxiosError } from 'axios';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';

import { CenterLoader } from '../components/CenterLoader';
import Layout from '../components/Layout';
import { OperationCards } from '../components/Operations/OperationCards';
import { OperationsFilters } from '../components/Operations/OperationsFilters';
import { useCurrentProjectId } from '../components/state/currentProjectHooks';
import { RoleRequired } from '../utils/RoleRequired';

export const getServerSideProps: GetServerSideProps = async ({ req, res, query }) => {
  const queryClient = new QueryClient();

  try {
    const { accessToken } = await getAccessToken(req, res);

    const projectId = query.project as string | undefined;

    if (projectId) {
      const queries = [
        queryClient.prefetchQuery(getGetProjectsQueryKey(), () =>
          getProjects({
            baseURL: process.env.DATA_MANAGER_API_SERVER,
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ),

        queryClient.prefetchQuery(getGetInstancesQueryKey({ project_id: projectId }), async () =>
          getInstances(
            { project_id: projectId },
            {
              baseURL: process.env.DATA_MANAGER_API_SERVER,
              headers: { Authorization: `Bearer ${accessToken}` },
            },
          ),
        ),

        queryClient.prefetchQuery(getGetTasksQueryKey({ project_id: projectId }), () =>
          getTasks(
            { project_id: projectId },
            {
              baseURL: process.env.DATA_MANAGER_API_SERVER,
              headers: { Authorization: `Bearer ${accessToken}` },
            },
          ),
        ),
      ];

      // Make the queries in parallel
      await Promise.all(queries);
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

const Tasks: FC = () => {
  const theme = useTheme();

  const { projectId } = useCurrentProjectId();

  const {
    data: instancesData,
    isLoading: isInstancesLoading,
    isError: isInstancesError,
    error: instancesError,
  } = useGetInstances<InstancesGetResponse, AxiosError<InstancesGetResponse>>({
    project_id: projectId,
  });
  const instances = instancesData?.instances;

  const {
    data: tasksData,
    isLoading: isTasksLoading,
    isError: isTasksError,
    error: tasksError,
  } = useGetTasks<TasksGetResponse, AxiosError<TasksGetResponse> | void>({ project_id: projectId });
  const tasks = tasksData?.tasks;

  const [operationTypes, setOperationTypes] = useState(['task', 'instance']);
  const [searchValue, setSearchValue] = useState('');

  return (
    <>
      <Head>
        <title>Squonk | Tasks</title>
      </Head>
      <RoleRequired roles={process.env.NEXT_PUBLIC_KEYCLOAK_USER_ROLE?.split(' ')}>
        <Layout>
          <Container
            css={css`
              margin-top: ${theme.spacing(4)}px;
            `}
            maxWidth="md"
          >
            <OperationsFilters
              operationTypes={operationTypes}
              searchValue={searchValue}
              setOperationTypes={setOperationTypes}
              setSearchValue={setSearchValue}
            />

            <Grid container spacing={1}>
              <Grid item xs={12}>
                {isInstancesError && (
                  <Alert severity="warning">
                    Instances failed to load ({(instancesError as AxiosError).response?.status})
                  </Alert>
                )}
              </Grid>
              <Grid item xs={12}>
                {isTasksError && (
                  <Alert severity="warning">
                    Tasks failed to load ({(tasksError as AxiosError).response?.status})
                  </Alert>
                )}
              </Grid>
              <Grid item xs={12}>
                {(instances !== undefined || tasks !== undefined) &&
                !isTasksLoading &&
                !isInstancesLoading ? (
                  <OperationCards
                    instances={instances ?? []}
                    operationTypes={operationTypes}
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
