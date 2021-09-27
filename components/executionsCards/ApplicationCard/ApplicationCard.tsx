import React from 'react';

import type { ApplicationSummary } from '@squonk/data-manager-client';

import { useTheme } from '@material-ui/core';

import { BaseCard } from '../../BaseCard';
import { InstancesList } from '../InstancesList';
import type { ApplicationModalButtonProps } from './ApplicationModalButton';
import { ApplicationModalButton } from './ApplicationModalButton';

export interface ApplicationCardProps extends Pick<ApplicationModalButtonProps, 'projectId'> {
  /**
   * The application object to display
   */
  app: ApplicationSummary;
}

/**
 * MuiCard that displays a summary of a application with actions to create new instances and view
 * existing instances.
 */
export const ApplicationCard = ({ app, projectId }: ApplicationCardProps) => {
  const theme = useTheme();

  return (
    <BaseCard
      actions={({ setExpanded }) => (
        <ApplicationModalButton
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
    />
  );
};
