import React, { FC } from 'react';

import type { InstanceSummary } from '@squonk/data-manager-client';
import { useGetProjects } from '@squonk/data-manager-client/project';

import { css } from '@emotion/react';
import { Typography, useTheme } from '@material-ui/core';

import { LocalTime } from '../LocalTime/LocalTime';
import { BaseCard } from './common/BaseCard';
import { StatusIcon } from './common/StatusIcon';
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

  return (
    <BaseCard
      actions={<RerunJobButton instance={instance} />}
      collapsed={<JobDetails instanceSummary={instance} />}
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
  );
};
