import React from 'react';

import { useQueryClient } from 'react-query';

import { Button, Typography } from '@material-ui/core';
import {
  getGetInstancesQueryKey,
  Instance,
  InstanceSummary,
  useGetInstance,
  useTerminateInstance,
} from '@squonk/data-manager-client';

export const InstanceDetail: React.FC<{ instance: InstanceSummary }> = ({ instance }) => {
  const queryClient = useQueryClient();
  const { data } = useGetInstance(instance.instance_id);
  const detailedInstance = data as Instance | undefined;

  const mutation = useTerminateInstance();
  return (
    <>
      <Typography>Name: {detailedInstance?.name}</Typography>
      <Typography>Version: {detailedInstance?.application_version}</Typography>
      <Typography>Owner: {detailedInstance?.owner}</Typography>
      <Typography>
        URL:{' '}
        <a href={detailedInstance?.url} rel="noopener noreferrer" target="_blank">
          Open
        </a>
      </Typography>
      <Button
        onClick={async () => {
          await mutation.mutateAsync({ instanceid: instance.instance_id });
          queryClient.invalidateQueries(getGetInstancesQueryKey());
        }}
      >
        Terminate
      </Button>
    </>
  );
};
