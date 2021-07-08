import React, { useState } from 'react';

import { css } from '@emotion/react';
import { Chip, Grid, Typography, useTheme } from '@material-ui/core';
import { useCreateInstance } from '@squonk/data-manager-client/instance';
import { useGetJob } from '@squonk/data-manager-client/job';

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
  jobId: number;
}

export const JobCard: React.FC<ApplicationCardProps> = ({ jobId }) => {
  const { data: job } = useGetJob(jobId);
  const [projectId] = useCurrentProjectId();

  const createInstanceMutation = useCreateInstance();

  const [currentTask, setCurrentTask] = useState<string | null>(null);
  const [isTaskProcessing, setIsTaskProcessing] = useState(false);

  const handleRunJob = async (specification: JobSpecification) => {
    setIsTaskProcessing(true);
    if (projectId && job) {
      const instance = await createInstanceMutation.mutateAsync({
        data: {
          application_id: job.application.application_id,
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
      actions={<JobModal disabled={isTaskProcessing} handleRunJob={handleRunJob} jobId={jobId} />}
      applicationId={job?.application.application_id}
      cardType="Job"
      color={theme.palette.primary.main}
      title={job?.name}
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
        {job?.keywords?.map((word) => (
          <Chip color="primary" key={word} label={word} size="small" variant="outlined" />
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
