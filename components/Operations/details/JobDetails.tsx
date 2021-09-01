import type { FC } from 'react';
import React, { Fragment } from 'react';

import type { InstanceSummary } from '@squonk/data-manager-client';
import { useGetInstance } from '@squonk/data-manager-client/instance';

import { css } from '@emotion/react';
import {
  Avatar,
  Grid,
  Link,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from '@material-ui/core';
import FolderRoundedIcon from '@material-ui/icons/FolderRounded';
import InsertDriveFileRoundedIcon from '@material-ui/icons/InsertDriveFileRounded';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

import { CenterLoader } from '../../CenterLoader';
import { TimeLine } from '../common/TimeLine';

interface OutputValue {
  title: string;
  creates: string;
  type?: 'file' | 'directory';
  'mime-types': string[];
}

interface JobDetailsProps {
  instanceSummary: InstanceSummary;
}

/**
 * Determine the path that a job output file the UI should link to within the project
 * @param creates string path with possible globs
 * @param type whether the creates path is to a file(s) or a directory(s)
 * @returns the array of string needed to link to that path in the project
 */
const getPathName = (creates: string, type?: 'file' | 'directory'): string[] | undefined => {
  const parts = creates.split('/').filter((part) => !part.includes('*'));

  if (type === 'file') {
    return parts.slice(0, -1);
  } else if (type === 'directory') {
    return parts;
  }
  // N.B. it's possible for the instance outputs to be malformed and missing a type property
  // In this case we can't determine whether to link to a file or a directory
  // so just return undefined
  return undefined;
};

export const JobDetails: FC<JobDetailsProps> = ({ instanceSummary }) => {
  const { query } = useRouter();

  const { data: instance } = useGetInstance(instanceSummary.id);

  if (instance === undefined) {
    return <CenterLoader />;
  }

  return (
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
          <List
            aria-label="list of job outputs"
            component="ul"
            css={css`
              display: flex;
              flex-wrap: wrap;
            `}
          >
            {/* We currently have to assume that the outputs have a consistent type */}
            {Object.entries(JSON.parse(instance.outputs) as Record<string, OutputValue>).map(
              ([key, value]) => {
                const path = getPathName(value.creates, value.type);
                return (
                  <ListItem
                    css={css`
                      width: auto;
                    `}
                    key={key}
                  >
                    <ListItemAvatar>
                      <Avatar>
                        {value.type === 'file' ? (
                          <InsertDriveFileRoundedIcon />
                        ) : (
                          <FolderRoundedIcon />
                        )}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={value.title}
                      secondary={
                        // In the case the path can't be determined, avoid giving a link
                        path !== undefined ? (
                          <NextLink
                            passHref
                            href={{
                              pathname: '/data',
                              query: {
                                ...query,
                                project: instance.project_id,
                                path,
                              },
                            }}
                          >
                            <Link>{value.creates}</Link>
                          </NextLink>
                        ) : (
                          <>{value.creates} (Link unavailable)</>
                        )
                      }
                    />
                  </ListItem>
                );
              },
            )}
          </List>
        </>
      )}

      <Grid container spacing={2}>
        <Grid item md={4} xs={12}>
          <Typography
            component="h3"
            css={css`
              text-align: center;
            `}
            variant="h6"
          >
            <b>States</b>
          </Typography>
          <TimeLine states={instance.states} />
        </Grid>
        <Grid
          item
          css={css`
            text-align: center;
          `}
          md={8}
          xs={12}
        >
          <Typography component="h3" variant="h6">
            <b>Events</b>
          </Typography>
          {instanceSummary.job_image_type === 'SIMPLE' ? (
            <TimeLine states={instance.events} />
          ) : (
            <pre
              css={css`
                margin: 0;
                display: inline-block;
                text-align: left;
                font-family: 'Fira Mono', monospace;
              `}
            >
              {instance.events[instance.events.length - 1].message}
            </pre>
          )}
        </Grid>
      </Grid>
    </>
  );
};
