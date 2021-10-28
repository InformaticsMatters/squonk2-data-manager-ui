import React from 'react';

import type { JobSummary } from '@squonk/data-manager-client';

import { Chip, Link, Typography, useTheme } from '@material-ui/core';

import { BaseCard } from '../../BaseCard';
import { Chips } from '../../Chips';
import { InstancesList } from '../InstancesList';
import type { RunJobButtonProps } from './RunJobButton';
import { RunJobButton } from './RunJobButton';

// TODO remove this once the doc_url attribute is in the DM API client
type JobSummaryWithDocUrl = JobSummary & {
  doc_url: string;
};

export interface ApplicationCardProps extends Pick<RunJobButtonProps, 'projectId'> {
  /**
   * the job to be instantiated
   */
  job: JobSummary;
}

/**
 * MuiCard that displays a summary of a job with actions to create new instances and view
 * existing instances.
 */
export const JobCard = ({ projectId, job }: ApplicationCardProps) => {
  // TODO remove this once the doc_url attribute is in the DM API client
  const jobSummary = job as JobSummaryWithDocUrl;

  const theme = useTheme();
  return (
    <BaseCard
      actions={({ setExpanded }) => (
        <RunJobButton
          jobId={jobSummary.id}
          projectId={projectId}
          onLaunch={() => setExpanded(true)}
        />
      )}
      collapsed={
        <InstancesList
          predicate={(instance) =>
            instance.job_id === jobSummary.id && instance.job_job === jobSummary.job
          }
        />
      }
      header={{ color: theme.palette.primary.main, title: jobSummary.name, avatar: 'J' }}
      key={projectId} // Reset state when project changes
    >
      <Typography variant="body1">{jobSummary.description}</Typography>
      <Typography variant="body1">
        {jobSummary.version} –{' '}
        <Link href={jobSummary.doc_url} target="_blank">
          docs
        </Link>
      </Typography>
      <Typography gutterBottom>
        <em>{jobSummary.category}</em>
      </Typography>
      <Chips>
        {jobSummary.keywords?.map((word) => (
          <Chip color="primary" key={word} label={word} size="small" variant="outlined" />
        ))}
      </Chips>
    </BaseCard>
  );
};
