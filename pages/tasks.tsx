import React, { FC } from 'react';
import { QueryClient, useQueryClient } from 'react-query';
import { dehydrate } from 'react-query/hydration';

import type { InstanceSummary, TaskSummary } from '@squonk/data-manager-client';
import {
  getGetInstanceQueryKey,
  getGetInstancesQueryKey,
  getInstances,
  useGetInstances,
} from '@squonk/data-manager-client/instance';
import {
  getGetProjectsQueryKey,
  getProjects,
  useGetProjects,
} from '@squonk/data-manager-client/project';
import { getGetTasksQueryKey, getTasks, useGetTasks } from '@squonk/data-manager-client/task';

import { getAccessToken, withPageAuthRequired } from '@auth0/nextjs-auth0';
import { css } from '@emotion/react';
import { Container, Grid, IconButton, Tooltip, Typography, useTheme } from '@material-ui/core';
import RefreshRoundedIcon from '@material-ui/icons/RefreshRounded';
import dayjs from 'dayjs';
import { GetServerSideProps } from 'next';

import Layout from '../components/Layout';
import { OperationApplicationCard } from '../components/Operations/OperationApplicationCard';
import { OperationJobCard } from '../components/Operations/OperationJobCard';
import { OperationTaskCard } from '../components/Operations/OperationTaskCard';
import { useCurrentProjectId } from '../components/state/currentProjectHooks';

export const getServerSideProps: GetServerSideProps = async ({ req, res, query }) => {
  const queryClient = new QueryClient();

  try {
    const { accessToken } = await getAccessToken(req, res);

    const projectId = query.project as string | undefined;

    // Skip prefetching if there is no project. We react-query can't handle undefined in the data as
    // it can't be serialised in JSON.
    if (projectId) {
      await queryClient.prefetchQuery(getGetProjectsQueryKey(), () =>
        getProjects({
          baseURL: process.env.DATA_MANAGER_API_SERVER,
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      );

      await queryClient.prefetchQuery(getGetInstancesQueryKey({ project_id: projectId }), () =>
        getInstances(
          { project_id: projectId },
          {
            baseURL: process.env.DATA_MANAGER_API_SERVER,
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        ),
      );

      await queryClient.prefetchQuery(getGetTasksQueryKey({ project_id: projectId }), () =>
        getTasks(
          { project_id: projectId },
          {
            baseURL: process.env.DATA_MANAGER_API_SERVER,
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        ),
      );
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

const isTaskSummary = (
  taskOrInstance: TaskSummary | InstanceSummary,
): taskOrInstance is TaskSummary => {
  return (taskOrInstance as unknown as TaskSummary).created !== undefined;
};

const getTimeStamp = (taskOrInstance: TaskSummary | InstanceSummary) => {
  if (isTaskSummary(taskOrInstance)) {
    return taskOrInstance.created;
  }
  return taskOrInstance.launched;
};

const Tasks: FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();

  const { refetch: projectRefetch } = useGetProjects();
  const { projectId } = useCurrentProjectId();

  const { data: instancesData, refetch: instancesRefetch } = useGetInstances({
    project_id: projectId ?? undefined,
  });
  const instances = instancesData?.instances;

  const { data: tasksData } = useGetTasks({ project_id: projectId });
  const tasks = tasksData?.tasks;

  const refreshOperations = [
    projectRefetch,
    instancesRefetch,
    ...(instances ?? []).map(
      ({ id }) =>
        () =>
          queryClient.invalidateQueries(getGetInstanceQueryKey(id)),
    ),
  ];

  return (
    <Layout>
      <Container
        css={css`
          margin-top: ${theme.spacing(4)}px;
        `}
        maxWidth="md"
      >
        <div
          css={css`
            display: flex;
            align-items: flex-start;
          `}
        >
          <Typography gutterBottom component="h1" variant="h4">
            Tasks
          </Typography>
          <Tooltip title="Refresh Tasks">
            <IconButton
              css={css`
                margin-left: auto;
              `}
              onClick={() => refreshOperations.forEach((func) => func())}
            >
              <RefreshRoundedIcon />
            </IconButton>
          </Tooltip>
        </div>
        <Grid container spacing={2}>
          {[
            ...(instances ?? []),
            ...(tasks?.filter((task) => task.purpose === 'DATASET' || task.purpose === 'FILE') ??
              []),
          ]
            .sort((a, b) => {
              const aTime = getTimeStamp(a);
              const bTime = getTimeStamp(b);

              return dayjs(aTime).isBefore(dayjs(bTime)) ? 1 : -1;
            })
            .map((instanceOrTask) => {
              if (!isTaskSummary(instanceOrTask)) {
                const instance = instanceOrTask;
                return instance.application_type === 'JOB' ? (
                  <Grid item key={instance.id} xs={12}>
                    <OperationJobCard instance={instance} />
                  </Grid>
                ) : (
                  <Grid item key={instance.id} xs={12}>
                    <OperationApplicationCard instance={instance} />
                  </Grid>
                );
              }
              const task = instanceOrTask;
              return (
                <Grid item key={task.id} xs={12}>
                  <OperationTaskCard task={task} />
                </Grid>
              );
            })}
        </Grid>
      </Container>
    </Layout>
  );
};

export default withPageAuthRequired(Tasks);
