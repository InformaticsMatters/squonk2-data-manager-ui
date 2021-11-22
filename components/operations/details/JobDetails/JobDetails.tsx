import React from 'react';

import type { InstanceSummary } from '@squonk/data-manager-client';

import { css } from '@emotion/react';
import { Grid, ListItem, ListItemIcon, ListItemText, Typography } from '@material-ui/core';
import AppsRoundedIcon from '@material-ui/icons/AppsRounded';
import WorkOutlineRoundedIcon from '@material-ui/icons/WorkOutlineRounded';

import { CenterLoader } from '../../../CenterLoader';
import { PageSection } from '../../../PageSection';
import { HorizontalList } from '../../common/HorizontalList';
import { TimeLine } from '../../common/TimeLine';
import { usePolledInstance } from '../usePolledInstance';
import { JobInputSection } from './JobInputSection';
import { JobOutputSection } from './JobOutputSection';

export interface JobDetailsProps {
  /**
   * Instance of the job
   */
  instanceSummary: InstanceSummary;
  /**
   * Whether to poll the instance regularly for updates
   */
  poll?: boolean;
}

/**
 * Displays the details of an job based on the instance of a job
 */
export const JobDetails = ({ instanceSummary, poll = false }: JobDetailsProps) => {
  const { data: instance } = usePolledInstance(instanceSummary.id, poll);

  if (instance === undefined) {
    return <CenterLoader />;
  }

  return (
    <>
      <HorizontalList>
        <ListItem>
          <ListItemIcon
            css={css`
              min-width: 40px;
            `}
          >
            <AppsRoundedIcon />
          </ListItemIcon>
          <ListItemText
            primary={instance.application_id}
            secondary={instance.application_version}
          />
        </ListItem>
        <ListItem>
          <ListItemIcon
            css={css`
              min-width: 40px;
            `}
          >
            <WorkOutlineRoundedIcon />
          </ListItemIcon>
          <ListItemText
            primary={instanceSummary.job_collection}
            secondary={instanceSummary.job_version}
          />
        </ListItem>
      </HorizontalList>

      <Grid container>
        <Grid item sm={6} xs={12}>
          <PageSection level={3} title="Inputs">
            <JobInputSection instanceSummary={instanceSummary} />
          </PageSection>
        </Grid>

        <Grid item sm={6} xs={12}>
          <PageSection level={3} title="Outputs">
            <JobOutputSection instanceSummary={instanceSummary} />
          </PageSection>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item md={4} xs={12}>
          <Typography align="center" component="h3" variant="h6">
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
          {/* Some jobs are simple and are just a time-line of events */}
          {instanceSummary.job_image_type === 'SIMPLE' ? (
            <TimeLine states={instance.events} />
          ) : (
            // But next-flow jobs only give a single block of text as output so we display these
            // in a monospace font
            <pre
              css={css`
                margin: 0;
                display: inline-block;
                text-align: left;
                font-family: 'Fira Mono', monospace;
              `}
            >
              {instance.events[instance.events.length - 1]?.message}
            </pre>
          )}
        </Grid>
      </Grid>
    </>
  );
};
