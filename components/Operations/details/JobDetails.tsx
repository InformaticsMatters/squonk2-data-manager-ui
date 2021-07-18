import React, { FC } from 'react';

import { InstanceSummary } from '@squonk/data-manager-client';
import { useGetInstance } from '@squonk/data-manager-client/instance';

import { Grid, Typography } from '@material-ui/core';

import { TimeLine } from '../common/TimeLine';

interface JobDetailsProps {
  instanceSummary: InstanceSummary;
}

export const JobDetails: FC<JobDetailsProps> = ({ instanceSummary }) => {
  const { data: instance } = useGetInstance(instanceSummary.id);

  return instance === undefined ? (
    <p>Loading...</p>
  ) : (
    <>
      <Typography>
        <b>App</b>: {instance.application_id} • <b>Version</b>: {instance.application_version} •{' '}
        <b>Collection</b>: {instanceSummary.job_collection} • <b>Job Version</b>:{' '}
        {instanceSummary.job_version}
      </Typography>

      <Typography>
        <b>Outputs</b>: {instance.outputs}
      </Typography>

      <Grid container spacing={2}>
        <Grid item sm={6} xs={12}>
          <TimeLine states={instance.states} />
        </Grid>
        <Grid item sm={6} xs={12}>
          <TimeLine states={instance.events} />
        </Grid>
      </Grid>
    </>
  );
};
