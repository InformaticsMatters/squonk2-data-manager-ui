import React, { useState } from 'react';

import type { InstanceSummary } from '@squonk/data-manager-client';
import { useGetProjects } from '@squonk/data-manager-client/project';

import { css } from '@emotion/react';
import { CardContent, ListItem, ListItemIcon, ListItemText, Slide } from '@material-ui/core';
import AccountTreeRoundedIcon from '@material-ui/icons/AccountTreeRounded';

import { BaseCard } from '../BaseCard';
import { DateTimeListItem } from './common/DateTimeListItem';
import { HorizontalList } from './common/HorizontalList';
import { StatusIcon } from './common/StatusIcon';
import { TerminateInstance } from './common/TerminateInstance';
import type { CommonProps } from './common/types';
import type { JobDetailsProps } from './details/JobDetails';
import { JobDetails } from './details/JobDetails';
import { RerunJobButton } from './RerunJobButton';

export interface JobCardProps extends CommonProps {
  /**
   * Instance of the job
   */
  instance: InstanceSummary;
  poll?: JobDetailsProps['poll'];
}

/**
 * Displays details of an instance of a job
 */
export const OperationJobCard = ({ instance, collapsedByDefault = true, poll }: JobCardProps) => {
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
              <JobDetails instanceSummary={instance} poll={poll} />
            </CardContent>
          }
          collapsedByDefault={collapsedByDefault}
        >
          <HorizontalList>
            <ListItem>
              <ListItemIcon
                css={css`
                  min-width: 40px;
                `}
              >
                <StatusIcon state={latestState} />
              </ListItemIcon>
              <ListItemText primary="Job" secondary={latestState} />
            </ListItem>
            <ListItem>
              <ListItemText primary={instance.name} secondary={instance.job_name} />
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
            <DateTimeListItem datetimeString={instance.launched} />
          </HorizontalList>
        </BaseCard>
      </div>
    </Slide>
  );
};
