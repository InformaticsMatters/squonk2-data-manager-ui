import type { FC } from 'react';
import React, { useState } from 'react';

import type { InstanceSummary } from '@squonk/data-manager-client';
import { useGetProjects } from '@squonk/data-manager-client/project';

import { CardContent, ListItem, ListItemIcon, ListItemText, Slide } from '@material-ui/core';
import AccountTreeRoundedIcon from '@material-ui/icons/AccountTreeRounded';

import { BaseCard } from '../BaseCard';
import { HorizontalList } from './common/HorizontalList';
import { StatusIcon } from './common/StatusIcon';
import { TerminateInstance } from './common/TerminateInstance';
import { JobDetails } from './details/JobDetails';
import { RerunJobButton } from './RerunJobButton';

interface JobCardProps {
  instance: InstanceSummary;
  collapsedByDefault?: boolean;
}

export const OperationJobCard: FC<JobCardProps> = ({ instance, collapsedByDefault = true }) => {
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
          <HorizontalList datetimeString={instance.launched}>
            <ListItem>
              <ListItemIcon>
                <StatusIcon state={latestState} />
              </ListItemIcon>
              <ListItemText primary="Job" secondary={latestState} />
            </ListItem>
            <ListItem>
              <ListItemText primary={instance.name} secondary={instance.job_name} />
            </ListItem>
            <ListItem>
              <ListItemIcon>
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
