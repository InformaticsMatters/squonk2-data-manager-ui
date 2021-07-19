import React, { FC } from 'react';

import type { InstanceSummary } from '@squonk/data-manager-client';
import { useGetInstance } from '@squonk/data-manager-client/instance';

import { Grid, Typography } from '@material-ui/core';

import { CenterLoader } from '../common/CenterLoader';
import { TimeLine } from '../common/TimeLine';

interface ApplicationDetailsProps {
  instanceId: InstanceSummary['id'];
}

export const ApplicationDetails: FC<ApplicationDetailsProps> = ({ instanceId }) => {
  const { data: instance } = useGetInstance(instanceId);

  return instance === undefined ? (
    <CenterLoader />
  ) : (
    <>
      <Typography>
        <b>App</b>: {instance.application_id} • <b>Version</b>: {instance.application_version}
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
