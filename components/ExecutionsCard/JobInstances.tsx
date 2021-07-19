import React, { FC } from 'react';

import type { JobSummary } from '@squonk/data-manager-client';
import { useGetInstances } from '@squonk/data-manager-client/instance';

import { Box, List, ListItem, ListItemText, Typography } from '@material-ui/core';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

import { LocalTime } from '../LocalTime/LocalTime';
import { CenterLoader } from '../Operations/common/CenterLoader';
import { useCurrentProjectId } from '../state/currentProjectHooks';

interface JobInstancesProps {
  job: JobSummary;
}

export const JobInstances: FC<JobInstancesProps> = ({ job }) => {
  const { query } = useRouter();

  const { data } = useGetInstances();
  const instances = data?.instances.filter((instance) => instance.job_name === job.job);
  const { projectId } = useCurrentProjectId();

  return instances === undefined ? (
    <CenterLoader />
  ) : instances.length === 0 ? (
    <Box p={2}>
      <Typography variant="body2">No instances of this job currently exist</Typography>
    </Box>
  ) : (
    <List dense component="ul">
      {instances.map((instance) => (
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
