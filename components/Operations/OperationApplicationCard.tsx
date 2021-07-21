import React, { FC } from 'react';
import { useQueryClient } from 'react-query';

import type { InstanceSummary } from '@squonk/data-manager-client';
import {
  getGetInstancesQueryKey,
  useTerminateInstance,
} from '@squonk/data-manager-client/instance';
import { useGetProjects } from '@squonk/data-manager-client/project';

import { css } from '@emotion/react';
import { Button, Typography, useTheme } from '@material-ui/core';

import { LocalTime } from '../LocalTime/LocalTime';
import { BaseCard } from './common/BaseCard';
import { StatusIcon } from './common/StatusIcon';
import { ApplicationDetails } from './details/ApplicationDetails';

// Button Props doesn't support target and rel when using as a Link
const HrefButton = Button as any;

interface OperationApplicationCardProps {
  instance: InstanceSummary;
  collapsedByDefault?: boolean;
}

export const OperationApplicationCard: FC<OperationApplicationCardProps> = ({
  instance,
  collapsedByDefault = true,
}) => {
  const theme = useTheme();
  const latestState = instance.state;

  const queryClient = useQueryClient();
  const { mutate: terminateInstance } = useTerminateInstance();

  const { data } = useGetProjects();
  const projects = data?.projects;

  const associatedProject = projects?.find((project) => project.project_id === instance.project_id);

  return (
    <BaseCard
      actions={
        <>
          <Button
            onClick={() => {
              terminateInstance(
                { instanceid: instance.id },
                {
                  onSuccess: () => {
                    queryClient.invalidateQueries(getGetInstancesQueryKey());
                    queryClient.invalidateQueries(
                      getGetInstancesQueryKey({ project_id: instance.project_id }),
                    );
                  },
                },
              );
            }}
          >
            Terminate
          </Button>
          {instance.url && (
            <HrefButton
              color="primary"
              href={instance.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              Open
            </HrefButton>
          )}
        </>
      }
      collapsed={<ApplicationDetails instanceId={instance.id} />}
      collapsedByDefault={collapsedByDefault}
    >
      <Typography
        css={css`
          display: flex;
          align-items: center;
          gap: ${theme.spacing(1)}px;
        `}
      >
        App • <StatusIcon state={latestState} />
        {latestState} • {instance.name} • {associatedProject?.name}
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
