import type { FC } from 'react';
import React from 'react';
import { useQueryClient } from 'react-query';

import type { InstanceSummary } from '@squonk/data-manager-client';
import {
  getGetInstancesQueryKey,
  useTerminateInstance,
} from '@squonk/data-manager-client/instance';

import { Button } from '@material-ui/core';

import { WarningDeleteButton } from '../../WarningDeleteButton';

interface TerminateInstanceProps {
  instance: InstanceSummary;
  onTermination?: () => void;
}

export const TerminateInstance: FC<TerminateInstanceProps> = ({ instance, onTermination }) => {
  const queryClient = useQueryClient();
  const { mutateAsync: terminateInstance } = useTerminateInstance();

  return (
    <WarningDeleteButton
      modalId={`delete-instance-${instance.id}`}
      title="Delete Instance"
      tooltipText="Terminate this instance"
      onDelete={async () => {
        await terminateInstance({ instanceid: instance.id });

        Promise.all([
          queryClient.invalidateQueries(getGetInstancesQueryKey()),
          queryClient.invalidateQueries(
            getGetInstancesQueryKey({ project_id: instance.project_id }),
          ),
        ]);

        onTermination && onTermination();
      }}
    >
      {({ openModal }) => (
        <Button onClick={openModal}>
          {['FAILURE', 'SUCCESS'].includes(instance.state) ? 'Delete' : 'Terminate'}
        </Button>
      )}
    </WarningDeleteButton>
  );
};
