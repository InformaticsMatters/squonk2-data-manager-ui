import React from 'react';

import { Typography } from '@material-ui/core';
import { Instance, InstanceSummary, useGetInstance } from '@squonk/data-manager-client';

export const InstanceDetail: React.FC<{ instance: InstanceSummary }> = ({ instance }) => {
  const { data } = useGetInstance(instance.instance_id ?? '');
  const detailedInstance = data as Instance | undefined;
  return (
    <>
      <Typography>Name: {detailedInstance?.name}</Typography>
      <Typography>Version: {detailedInstance?.application_version}</Typography>
      <Typography>Owner: {detailedInstance?.owner}</Typography>
      <Typography>
        URL:{' '}
        <a target="_blank" rel="noopener noreferrer" href={detailedInstance?.url}>
          Open
        </a>
      </Typography>
    </>
  );
};
