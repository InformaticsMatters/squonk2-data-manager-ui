import React from 'react';

import { useQueryClient } from 'react-query';

import { Button as MuiButton, Grid, Typography } from '@material-ui/core';
import {
  getGetInstancesQueryKey,
  Instance,
  useGetInstance,
  useTerminateInstance,
} from '@squonk/data-manager-client';

// Button Props doesn't support target and rel when using as a Link
const Button = MuiButton as any;

export const InstanceDetail: React.FC<{ instanceId: string }> = ({ instanceId }) => {
  const queryClient = useQueryClient();
  const { data } = useGetInstance(instanceId);
  const detailedInstance = data as Instance | undefined;

  const mutation = useTerminateInstance();
  return (
    <>
      <Typography variant="body2">Name: {detailedInstance?.name}</Typography>
      <Typography variant="body2">Version: {detailedInstance?.application_version}</Typography>
      <Typography variant="body2">Owner: {detailedInstance?.owner}</Typography>

      <Grid container>
        <Grid item>
          <Button
            onClick={async () => {
              await mutation.mutateAsync({ instanceid: instanceId });
              queryClient.invalidateQueries(getGetInstancesQueryKey());
            }}
          >
            Terminate
          </Button>
        </Grid>
        <Grid item>
          <Button
            href={detailedInstance?.url}
            rel="noopener noreferrer"
            target="_blank"
            color="primary"
          >
            Open
          </Button>
        </Grid>
      </Grid>
    </>
  );
};
