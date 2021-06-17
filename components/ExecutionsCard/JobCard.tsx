import React, { useState } from 'react';

import { css } from '@emotion/react';
import { Chip, Grid, Typography, useTheme } from '@material-ui/core';
import { useCreateInstance, useGetJob } from '@squonk/data-manager-client';

import { useCurrentProjectId } from '../CurrentProjectContext';
import { BaseCard } from './BaseCard';
import { JobModal } from './JobModal';
import { ProgressBar } from './ProgressBar';

export interface JobSpecification {
  collection: string;
  job: string;
  version: string;
  variables: { [key: string]: string | string[] };
}

interface ApplicationCardProps {
  jobId: string;
}

export const JobCard: React.FC<ApplicationCardProps> = ({ jobId }) => {
  const { data: job } = useGetJob(Number(jobId));
  const [projectId] = useCurrentProjectId();

  const createInstanceMutation = useCreateInstance();

  const [currentTask, setCurrentTask] = useState<string | null>(null);
  const [isTaskProcessing, setIsTaskProcessing] = useState(false);

  const handleRunJob = async (specification: JobSpecification) => {
    setIsTaskProcessing(true);
    if (projectId && process.env.NEXT_PUBLIC_JOBS_APPID) {
      const instance = await createInstanceMutation.mutateAsync({
        data: {
          application_id: job?.application.id,
          application_version: 'v1',
          as_name: 'Test',
          project_id: projectId,
          specification: JSON.stringify(specification),
        },
      });
      setCurrentTask(instance.task_id);
    }
  };

  const theme = useTheme();
  return (
    <BaseCard
      cardType="Job"
      applicationId={process.env.NEXT_PUBLIC_JOBS_APPID!}
      title={job?.name}
      actions={
        <JobModal jobId={Number(jobId)} handleRunJob={handleRunJob} disabled={isTaskProcessing} />
      }
      color={theme.palette.primary.main}
    >
      <Typography variant="body2">{job?.description}</Typography>
      <Typography variant="body1">{job?.version}</Typography>
      <Typography>
        <em>{job?.category}</em>
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
        {job?.keywords.map((word) => (
          <Chip size="small" color="primary" variant="outlined" key={word} label={word} />
        ))}
      </div>
      <Grid item xs={12}>
        <ProgressBar
          isTaskProcessing={isTaskProcessing}
          setIsTaskProcessing={setIsTaskProcessing}
          taskId={currentTask}
        />
      </Grid>
    </BaseCard>
  );
};
