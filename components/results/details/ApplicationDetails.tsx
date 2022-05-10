import type { InstanceSummary } from '@squonk/data-manager-client';

import { ListItem, ListItemText } from '@mui/material';

import { CenterLoader } from '../../CenterLoader';
import { HorizontalList } from '../common/HorizontalList';
import { TaskDetails } from '../TaskDetails';
import { usePolledInstance } from './usePolledInstance';

export interface ApplicationDetailsProps {
  /**
   * ID of the instance of the application
   */
  instanceId: InstanceSummary['id'];
  /**
   * Whether to poll the instance regularly for updates
   */
  poll?: boolean;
}

/**
 * Displays the details of an application based on the ID of an application instance
 */
export const ApplicationDetails = ({ instanceId, poll }: ApplicationDetailsProps) => {
  const { data: instance } = usePolledInstance(instanceId, poll);

  const tasks = instance?.tasks;
  const task = tasks?.[tasks.length - 1];

  if (instance === undefined) {
    return <CenterLoader />;
  }

  return (
    <>
      <HorizontalList>
        <ListItem>
          <ListItemText
            primary={instance.application_id}
            secondary={instance.application_version}
          />
        </ListItem>
      </HorizontalList>

      <TaskDetails taskId={task?.id ?? ''} />
    </>
  );
};
