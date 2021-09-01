import type { FC } from 'react';
import React, { useState } from 'react';

import type { InstanceSummary } from '@squonk/data-manager-client';
import { useGetProjects } from '@squonk/data-manager-client/project';

import { css } from '@emotion/react';
import { Button, CardContent, Slide, Typography, useTheme } from '@material-ui/core';

import { BaseCard } from '../BaseCard';
import { LocalTime } from '../LocalTime/LocalTime';
import { StatusIcon } from './common/StatusIcon';
import { TerminateInstance } from './common/TerminateInstance';
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
          collapsed={
            <CardContent>
              <ApplicationDetails instanceId={instance.id} />
            </CardContent>
          }
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
      </div>
    </Slide>
  );
};
