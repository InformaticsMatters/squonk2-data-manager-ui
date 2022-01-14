import type { InstanceSummary } from '@squonk/data-manager-client';
import { useGetInstances } from '@squonk/data-manager-client/instance';

import { Box, List, ListItem, ListItemText, Typography } from '@material-ui/core';
import dayjs from 'dayjs';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

import { APP_ROUTES } from '../../constants/routes';
import { useCurrentProjectId } from '../../hooks/projectHooks';
import { CenterLoader } from '../CenterLoader';
import { LocalTime } from '../LocalTime';

type FilterPredicate = (value: InstanceSummary, index: number, array: InstanceSummary[]) => boolean;

export interface InstancesListProps {
  /**
   * Predicate of `Array.prototype.filter`
   */
  predicate: FilterPredicate;
}

/**
 * MuiList detailing instances that match a filter.
 */
export const InstancesList = ({ predicate }: InstancesListProps) => {
  const { query } = useRouter();

  const { projectId } = useCurrentProjectId();
  const { data } = useGetInstances({ project_id: projectId ?? undefined });
  const instances = data?.instances.filter(predicate);

  if (instances === undefined) {
    return <CenterLoader />;
  }

  if (instances.length === 0) {
    return (
      <Box p={2}>
        <Typography variant="body2">No instances of this type currently exist</Typography>
      </Box>
    );
  }

  return (
    <List dense component="ul">
      {instances
        .sort((instanceA, instanceB) =>
          dayjs(instanceA.launched).isBefore(dayjs(instanceB.launched)) ? 1 : -1,
        )
        .map((instance) => (
          <NextLink
            passHref
            href={{
              pathname: APP_ROUTES.results.instance(instance.id),
              query: { ...query, project: projectId, instanceId: instance.id },
            }}
            key={instance.id}
          >
            <ListItem button component="a">
              <ListItemText
                primary={instance.name}
                primaryTypographyProps={{ variant: 'body1' }}
                secondary={<LocalTime utcTimestamp={instance.launched} />}
              />
            </ListItem>
          </NextLink>
        ))}
    </List>
  );
};
