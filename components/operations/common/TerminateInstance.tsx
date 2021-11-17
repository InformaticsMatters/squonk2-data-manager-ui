import { useQueryClient } from 'react-query';

import type { InstanceSummary } from '@squonk/data-manager-client';
import {
  getGetInstancesQueryKey,
  useTerminateInstance,
} from '@squonk/data-manager-client/instance';

import { Button } from '@material-ui/core';

import { WarningDeleteButton } from '../../WarningDeleteButton';

export interface TerminateInstanceProps {
  /**
   * Instance to terminate
   */
  instance: InstanceSummary;
  /**
   * Called when the delete request is successfully made
   */
  onTermination?: () => void;
}

export const TerminateInstance = ({ instance, onTermination }: TerminateInstanceProps) => {
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

        // Can't just await promises as this component unmounts before `onTermination` is called.
        // React then gives a setState on unmounted component warning.
        // Need some more thought on how to resolve this pattern generally.
        onTermination && onTermination();
      }}
    >
      {({ openModal }) => (
        <Button onClick={openModal}>
          {/* Instances in an end state are deleted but others are still running so are terminated.
          It's all the same to the API though. */}
          {['FAILURE', 'SUCCESS'].includes(instance.state) ? 'Delete' : 'Terminate'}
        </Button>
      )}
    </WarningDeleteButton>
  );
};
