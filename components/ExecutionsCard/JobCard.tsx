import React from 'react';

import { css } from '@emotion/react';
import {
  Avatar,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  Typography,
  useTheme,
} from '@material-ui/core';
import { JobSummary } from '@squonk/data-manager-client';

import { JobModal } from './JobModal';

interface ApplicationCardProps {
  job: JobSummary;
}

export const JobCard: React.FC<ApplicationCardProps> = ({ job }) => {
  const theme = useTheme();
  return (
    <Card>
      <CardHeader avatar={<Avatar>J</Avatar>} title={job.job} subheader={job.collection} />
      <CardContent>
        <Typography gutterBottom variant="subtitle1">
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
      </CardContent>
      <CardActions>
        <JobModal jobId={job.id} />
      </CardActions>
    </Card>
  );
};
