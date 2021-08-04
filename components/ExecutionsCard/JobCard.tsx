import React from 'react';

import type { JobSummary } from '@squonk/data-manager-client';

import { css } from '@emotion/react';
import { Chip, Typography, useTheme } from '@material-ui/core';

import { BaseCard } from '../BaseCard';
import type { ProjectId } from '../state/currentProjectHooks';
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
    >
      <Typography variant="body2">{jobSummary.description}</Typography>
      <Typography variant="body1">{jobSummary.version}</Typography>
      <Typography>
        <em>{jobSummary.category}</em>
      </Typography>
      <div
        css={css`
          display: flex;
          flex-wrap: wrap;
          & > * {
            margin: ${theme.spacing(0.5)}px;
          }
        `}
      >
        {jobSummary.keywords?.map((word) => (
          <Chip color="primary" key={word} label={word} size="small" variant="outlined" />
        ))}
      </div>
    </BaseCard>
  );
};
