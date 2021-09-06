import type { FC } from 'react';
import React, { useState } from 'react';

import type { InstanceSummary } from '@squonk/data-manager-client';
import { useGetProjects } from '@squonk/data-manager-client/project';

import { css } from '@emotion/react';
import {
  Button,
  CardContent,
  ListItem,
  ListItemIcon,
  ListItemText,
  Slide,
} from '@material-ui/core';
import AccountTreeRoundedIcon from '@material-ui/icons/AccountTreeRounded';

import { BaseCard } from '../BaseCard';
import { HorizontalList } from './common/HorizontalList';
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
          <HorizontalList datetimeString={instance.launched}>
            <ListItem>
              <ListItemIcon
                css={css`
                  min-width: 40px;
                `}
              >
                <StatusIcon state={latestState} />
              </ListItemIcon>
              <ListItemText primary="App" secondary={latestState} />
            </ListItem>
            <ListItem>
              <ListItemText primary={instance.name} />
            </ListItem>
            <ListItem>
              <ListItemIcon
                css={css`
                  min-width: 40px;
                `}
              >
                <AccountTreeRoundedIcon />
              </ListItemIcon>
              <ListItemText primary={associatedProject?.name} />
            </ListItem>
          </HorizontalList>
        </BaseCard>
      </div>
    </Slide>
  );
};
