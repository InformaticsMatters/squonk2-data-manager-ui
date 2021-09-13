import type { FC } from 'react';
import React from 'react';

import type { ApplicationSummary } from '@squonk/data-manager-client';

import { useTheme } from '@material-ui/core';

import type { ProjectId } from '../../hooks/currentProjectHooks';
import { BaseCard } from '../BaseCard';
import { ApplicationModal } from './ApplicationModal';
import { InstancesList } from './InstancesList';

interface ApplicationCardProps {
  app: ApplicationSummary;
  projectId: ProjectId;
}

export const ApplicationCard: FC<ApplicationCardProps> = ({ app, projectId }) => {
  const theme = useTheme();

  return (
    <BaseCard
      actions={({ setExpanded }) => (
        <ApplicationModal
          applicationId={app.application_id}
          projectId={projectId}
          onLaunch={() => setExpanded(true)}
        />
      )}
      collapsed={
        <InstancesList predicate={(instance) => instance.application_id === app.application_id} />
      }
      header={{
        title: app.kind,
        subtitle: app.group,
        avatar: 'A',
        color: theme.palette.secondary.dark,
      }}
    ></BaseCard>
  );
};
