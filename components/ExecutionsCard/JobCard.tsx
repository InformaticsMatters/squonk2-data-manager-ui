import React from 'react';

import type { JobSummary } from '@squonk/data-manager-client';

import { css } from '@emotion/react';
import { Chip, Typography, useTheme } from '@material-ui/core';

import { BaseCard } from './BaseCard';
import { JobInstances } from './JobInstances';
import { JobModal } from './JobModal';

interface ApplicationCardProps {
  job: JobSummary;
}

export const JobCard: React.FC<ApplicationCardProps> = ({ job: jobSummary }) => {
  const theme = useTheme();
  return (
    <BaseCard
      actions={<JobModal jobId={jobSummary.id} />}
      cardType="Job"
      collapsed={<JobInstances job={jobSummary} />}
      color={theme.palette.primary.main}
      title={jobSummary.name}
    >
      {/* TODO: Fix this any assertion once API is fixed */}
      <Typography variant="body2">{(jobSummary as any).description}</Typography>
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
