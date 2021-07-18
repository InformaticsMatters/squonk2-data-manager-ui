import React, { FC } from 'react';
import { useQueryClient } from 'react-query';

import { InstanceSummary } from '@squonk/data-manager-client';
import { getGetInstancesQueryKey, useCreateInstance } from '@squonk/data-manager-client/instance';

import { Button } from '@material-ui/core';

interface RerunJobButtonProps {
  instance: InstanceSummary;
}

export const RerunJobButton: FC<RerunJobButtonProps> = ({ instance }) => {
  const { mutate: runJob } = useCreateInstance();

  const queryClient = useQueryClient();

  const rerunJob = () => {
    runJob(
      {
        data: {
          as_name: 'test',
          application_id: instance.application_id,
          application_version: instance.application_version,
          project_id: instance.project_id,
          specification: instance.application_specification,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries(
            getGetInstancesQueryKey({ project_id: instance.project_id }),
          );
          queryClient.invalidateQueries(getGetInstancesQueryKey());
        },
      },
    );
  };

  return (
    <Button color="primary" onClick={rerunJob}>
      Run again
    </Button>
  );
};
