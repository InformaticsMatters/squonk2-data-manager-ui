import React from 'react';

import { useQueryClient } from 'react-query';

import { Button, Grid, Typography } from '@material-ui/core';
import {
  getGetInstancesQueryKey,
  useGetInstance,
  useTerminateInstance,
} from '@squonk/data-manager-client/instance';

// Button Props doesn't support target and rel when using as a Link
const HrefButton = Button as any;

export const InstanceDetail: React.FC<{ instanceId: string }> = ({ instanceId }) => {
  const queryClient = useQueryClient();
  const { data: detailedInstance } = useGetInstance(instanceId);

  const terminateInstanceMutation = useTerminateInstance();
  return (
    <>
      <Typography variant="body2">Name: {detailedInstance?.name}</Typography>
      <Typography variant="body2">Version: {detailedInstance?.application_version}</Typography>
      <Typography variant="body2">Owner: {detailedInstance?.owner}</Typography>

      <Grid container>
        <Grid item>
          <Button
            onClick={async () => {
              await terminateInstanceMutation.mutateAsync({ instanceid: instanceId });
              queryClient.invalidateQueries(getGetInstancesQueryKey());
            }}
          >
            Terminate
          </Button>
        </Grid>
        {!!detailedInstance?.url && (
          <Grid item>
            <HrefButton
              href={detailedInstance.url}
              rel="noopener noreferrer"
              target="_blank"
              color="primary"
            >
              Open
            </HrefButton>
          </Grid>
        )}
      </Grid>
    </>
  );
};
