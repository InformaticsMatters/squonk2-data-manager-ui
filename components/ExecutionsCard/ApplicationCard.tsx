import type { FC } from 'react';
import React from 'react';

import type { ApplicationSummary } from '@squonk/data-manager-client';

import { useTheme } from '@material-ui/core';

import type { ProjectId } from '../state/currentProjectHooks';
import { ApplicationModal } from './ApplicationModal';
import { BaseCard } from './BaseCard';
import { InstancesList } from './InstancesList';

interface ApplicationCardProps {
  app: ApplicationSummary;
  projectId: ProjectId;
}

export const ApplicationCard: FC<ApplicationCardProps> = ({ app, projectId }) => {
  const theme = useTheme();

  return (
    <BaseCard
      actions={<ApplicationModal applicationId={app.application_id} projectId={projectId} />}
      cardType="Application"
      collapsed={
        <InstancesList predicate={(instance) => instance.application_id === app.application_id} />
      }
      color={theme.palette.secondary.dark}
      subtitle={app.group}
      title={app.kind}
    ></BaseCard>
  );
};
