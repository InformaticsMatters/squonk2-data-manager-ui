import type { FC } from 'react';
import React from 'react';

import type { InstanceSummary } from '@squonk/data-manager-client';
import { useGetInstance } from '@squonk/data-manager-client/instance';

import { Grid, ListItem, ListItemText } from '@material-ui/core';

import { CenterLoader } from '../../CenterLoader';
import { HorizontalList } from '../common/HorizontalList';
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
      <HorizontalList datetimeString={instance.launched}>
        <ListItem>
          <ListItemText
            primary={instance.application_id}
            secondary={instance.application_version}
          />
        </ListItem>
      </HorizontalList>

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
