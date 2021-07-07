import React, { FC } from 'react';

import { useQueryClient } from 'react-query';

import { css } from '@emotion/react';
import { Button, Divider, Grid, Typography, useTheme } from '@material-ui/core';
import { useGetInstance, useTerminateInstance } from '@squonk/data-manager-client/instance';
import { useGetJobs } from '@squonk/data-manager-client/job';
import { getGetTasksQueryKey } from '@squonk/data-manager-client/task';

import { LocalTime } from './LocalTime/LocalTime';

// Button Props doesn't support target and rel when using as a Link
const HrefButton = Button as any;

interface TaskInstanceDetailProps {
  instanceId: string;
}

export const TaskInstanceDetail: FC<TaskInstanceDetailProps> = ({ instanceId }) => {
  const theme = useTheme();

  const { data: instance } = useGetInstance(instanceId);
  const { data: jobs } = useGetJobs();
  const terminateInstanceMutation = useTerminateInstance();
  const queryClient = useQueryClient();

  if (instance) {
    // If the instance is a job, parse the spec otherwise the spec if undefined
    const spec = instance.application_specification
      ? JSON.parse(instance.application_specification)
      : undefined;

    // Match the job against the jobs endpoint to get the job name as the spec only has the ID
    const job = spec
      ? jobs?.jobs.find((job) => job.job === spec.job && job.version === spec.version)
      : undefined;

    return (
      <Grid
        container
        alignItems="center"
        spacing={2}
        css={css`
          margin-top: ${theme.spacing(1)}px;
        `}
      >
        <Grid item xs={12} sm={4}>
          <Typography>
            <b>Instance Name</b>: {instance.name}
          </Typography>
          <Typography>
            <b>Instance Version</b>: {instance.application_version}
          </Typography>
          <Typography gutterBottom>
            <b>Created</b>: <LocalTime utcTimestamp={instance.launched} showTime showDate={false} />
          </Typography>
        </Grid>

        {spec && job && (
          <>
            <Divider orientation="vertical" flexItem />
            <Grid item xs={12} sm={4}>
              <Typography>
                <b>Job</b>: {job.name}
              </Typography>
              <Typography>
                <b>Version</b>: {spec.version}
              </Typography>
              <Typography>
                <b>{job.category}</b>
              </Typography>
            </Grid>
          </>
        )}

        <Divider orientation="vertical" flexItem />

        {/* 1 sm smaller to cause the dividers to vanish */}
        <Grid item xs={12} sm={3}>
          <Button
            onClick={async () => {
              await terminateInstanceMutation.mutateAsync({ instanceid: instanceId });
              queryClient.invalidateQueries(getGetTasksQueryKey());
            }}
          >
            Terminate
          </Button>
          {instance.url && (
            <HrefButton
              href={instance.url}
              rel="noopener noreferrer"
              target="_blank"
              color="primary"
            >
              Open
            </HrefButton>
          )}
        </Grid>
      </Grid>
    );
  }
  return null;
};
