import React from 'react';

import { css } from '@emotion/react';
import { Chip, Typography, useTheme } from '@material-ui/core';
import { JobSummary } from '@squonk/data-manager-client';

import { BaseCard } from './BaseCard';
import { JobModal } from './JobModal';

interface ApplicationCardProps {
  job: JobSummary;
}

export const JobCard: React.FC<ApplicationCardProps> = ({ job }) => {
  const theme = useTheme();
  return (
    <BaseCard
      cardType="Job"
      applicationId={process.env.NEXT_PUBLIC_JOBS_APPID!}
      title={job.job}
      subtitle={job.collection}
      actions={<JobModal jobId={job.id} />}
    >
      <Typography gutterBottom variant="subtitle1" component="h3">
        <b>Run Job</b>
      </Typography>
      <Typography variant="body2">{job.version}</Typography>
      <Typography>{job.category}</Typography>
      <div
        css={css`
          display: flex;
          flex-wrap: wrap;
          & > * {
            margin: ${theme.spacing(0.5)}px;
          }
        `}
      >
        {job.keywords.map((word) => (
          <Chip key={word} label={word} />
        ))}
      </div>
    </BaseCard>
  );
};
