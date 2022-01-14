import type { InstanceSummary } from '@squonk/data-manager-client';

import { Grid, ListItem, ListItemText } from '@material-ui/core';

import { CenterLoader } from '../../CenterLoader';
import { HorizontalList } from '../common/HorizontalList';
import { TimeLine } from '../common/TimeLine';
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
