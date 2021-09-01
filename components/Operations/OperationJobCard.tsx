import type { FC } from 'react';
import React, { useState } from 'react';

import type { InstanceSummary } from '@squonk/data-manager-client';
import { useGetProjects } from '@squonk/data-manager-client/project';

import { css } from '@emotion/react';
import { CardContent, Slide, Typography, useTheme } from '@material-ui/core';

import { BaseCard } from '../BaseCard';
import { LocalTime } from '../LocalTime/LocalTime';
import { StatusIcon } from './common/StatusIcon';
import { TerminateInstance } from './common/TerminateInstance';
import { JobDetails } from './details/JobDetails';
import { RerunJobButton } from './RerunJobButton';

interface JobCardProps {
  instance: InstanceSummary;
  collapsedByDefault?: boolean;
}

export const OperationJobCard: FC<JobCardProps> = ({ instance, collapsedByDefault = true }) => {
  const theme = useTheme();
  const latestState = instance.state;

  const { data } = useGetProjects();
  const projects = data?.projects;

  const associatedProject = projects?.find((project) => project.project_id === instance.project_id);

  const [slideIn, setSlideIn] = useState(true);

  return (
    <Slide direction="right" in={slideIn}>
      <div>
        <BaseCard
          actions={
            <>
              <TerminateInstance instance={instance} onTermination={() => setSlideIn(false)} />
              <RerunJobButton instance={instance} />
            </>
          }
          collapsed={
            <CardContent>
              <JobDetails instanceSummary={instance} />
            </CardContent>
          }
          collapsedByDefault={collapsedByDefault}
        >
          <Typography
            component="h2"
            css={css`
              display: flex;
              align-items: center;
              gap: ${theme.spacing(1)}px;
            `}
          >
            Job • <StatusIcon state={latestState} />
            {latestState} • {instance.name} • {instance.job_name} • {associatedProject?.name}
            <LocalTime
              css={css`
                margin-left: auto;
              `}
              utcTimestamp={instance.launched}
            />
          </Typography>
        </BaseCard>
      </div>
    </Slide>
  );
};
