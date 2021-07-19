import React, { FC } from 'react';

import { ApplicationSummary } from '@squonk/data-manager-client';
import { useGetApplication } from '@squonk/data-manager-client/application';

import { useTheme } from '@material-ui/core';

import { ProjectId } from '../state/projectPathHooks';
import { ApplicationModal } from './ApplicationModal';
import { BaseCard } from './BaseCard';
import { InstancesList } from './InstancesList';

interface ApplicationCardProps {
  app: ApplicationSummary;
  projectId: ProjectId;
}

export const ApplicationCard: FC<ApplicationCardProps> = ({ app, projectId }) => {
  const { data: application } = useGetApplication(app.application_id);

  const theme = useTheme();

  return (
    <BaseCard
      actions={<ApplicationModal applicationId={app.application_id} projectId={projectId} />}
      cardType="Application"
      collapsed={
        <InstancesList predicate={(instance) => instance.application_id === app.application_id} />
      }
      color={theme.palette.secondary.dark}
      subtitle={application?.group}
      title={app.kind}
    ></BaseCard>
  );
};
