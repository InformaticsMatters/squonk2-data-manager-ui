import React from 'react';

import type { JobSummary } from '@squonk/data-manager-client';

import { Chip, Typography, useTheme } from '@material-ui/core';

import type { ProjectId } from '../../hooks/currentProjectHooks';
import { BaseCard } from '../BaseCard';
import { Chips } from '../Chips';
import { InstancesList } from './InstancesList';
import { RunJobButton } from './RunJobButton';

interface ApplicationCardProps {
  projectId: ProjectId;
  job: JobSummary;
}

export const JobCard: React.FC<ApplicationCardProps> = ({ projectId, job: jobSummary }) => {
  const theme = useTheme();
  return (
    <BaseCard
      actions={({ setExpanded }) => (
        <RunJobButton jobId={jobSummary.id} projectId={projectId} onRun={() => setExpanded(true)} />
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
      <Typography variant="body2">{jobSummary.description}</Typography>
      <Typography variant="body1">{jobSummary.version}</Typography>
      <Typography>
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
