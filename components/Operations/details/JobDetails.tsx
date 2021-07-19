import React, { FC } from 'react';

import { InstanceSummary } from '@squonk/data-manager-client';
import { useGetInstance } from '@squonk/data-manager-client/instance';

import { Grid, Link, Typography } from '@material-ui/core';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

import { useCurrentProjectId } from '../../state/currentProjectHooks';
import { CenterLoader } from '../common/CenterLoader';
import { TimeLine } from '../common/TimeLine';

interface JobDetailsProps {
  instanceSummary: InstanceSummary;
}

const getPathName = (creates: string, type: 'file'): string[] => {
  const parts = creates.split('/');
  if (parts.length === 0) {
    return [];
  }

  return parts.slice(0, -1);
};

export const JobDetails: FC<JobDetailsProps> = ({ instanceSummary }) => {
  const { query } = useRouter();
  const { projectId } = useCurrentProjectId();

  const { data: instance } = useGetInstance(instanceSummary.id);

  return instance === undefined ? (
    <CenterLoader />
  ) : (
    <>
      <Typography gutterBottom>
        <b>App</b>: {instance.application_id} • <b>Version</b>: {instance.application_version} •{' '}
        <b>Collection</b>: {instanceSummary.job_collection} • <b>Job Version</b>:{' '}
        {instanceSummary.job_version}
      </Typography>

      {instance.outputs && (
        <>
          <Typography component="h3" variant="h6">
            <b>Outputs</b>
          </Typography>
          <Typography gutterBottom>
            {Object.entries(JSON.parse(instance.outputs)).map(([key, value]: [string, any]) => (
              <>
                {value.title}:{' '}
                <NextLink
                  passHref
                  href={{
                    pathname: '/data',
                    query: {
                      ...query,
                      project: projectId,
                      path: getPathName(value.creates, value.type),
                    },
                  }}
                  key={key}
                >
                  <Link>
                    {value.creates}{' '}
                    {value['mime-types'] && (
                      <>
                        ({value.type} - {value['mime-types']})
                      </>
                    )}
                  </Link>
                </NextLink>
              </>
            ))}
          </Typography>
        </>
      )}

      <Typography component="h3" variant="h6">
        <b>States and Events</b>
      </Typography>

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
