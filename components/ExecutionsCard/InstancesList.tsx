import type { FC } from 'react';
import React from 'react';

import type { InstanceSummary } from '@squonk/data-manager-client';
import { useGetInstances } from '@squonk/data-manager-client/instance';

import { Box, List, ListItem, ListItemText, Typography } from '@material-ui/core';
import dayjs from 'dayjs';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

import { CenterLoader } from '../CenterLoader';
import { LocalTime } from '../LocalTime/LocalTime';
import { useCurrentProjectId } from '../state/currentProjectHooks';

interface InstancesListProps {
  predicate: (instance: InstanceSummary) => boolean;
}

export const InstancesList: FC<InstancesListProps> = ({ predicate }) => {
  const { query } = useRouter();

  const { projectId } = useCurrentProjectId();
  const { data } = useGetInstances({ project_id: projectId ?? undefined });
  const instances = data?.instances.filter(predicate);

  return instances === undefined ? (
    <CenterLoader />
  ) : instances.length === 0 ? (
    <Box p={2}>
      <Typography variant="body2">No instances of this type currently exist</Typography>
    </Box>
  ) : (
    <List dense component="ul">
      {instances
        .sort((instanceA, instanceB) =>
          dayjs(instanceA.launched).isBefore(dayjs(instanceB.launched)) ? 1 : -1,
        )
        .map((instance) => (
          <NextLink
            passHref
            href={{ pathname: `/tasks/${instance.id}`, query: { ...query, project: projectId } }}
            key={instance.id}
          >
            <ListItem button component="a">
              <ListItemText
                primary={instance.name}
                secondary={<LocalTime utcTimestamp={instance.launched} />}
              />
            </ListItem>
          </NextLink>
        ))}
    </List>
  );
};
