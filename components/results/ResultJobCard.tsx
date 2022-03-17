import type { InstanceSummary } from '@squonk/data-manager-client';

import { CardContent, ListItem, ListItemText } from '@material-ui/core';

import { APP_ROUTES } from '../../constants/routes';
import { useProjectFromId } from '../../hooks/projectHooks';
import { ResultCard } from '../results/ResultCard';
import { ProjectListItem } from './common/ProjectListItem';
import { TerminateInstance } from './common/TerminateInstance';
import type { CommonProps } from './common/types';
import { useInstanceRouterQuery } from './common/useInstanceRouterQuery';
import type { JobDetailsProps } from './details/JobDetails';
import { JobDetails } from './details/JobDetails';
import { LogsButton } from './LogsButton';
import { RerunJobButton } from './RerunJobButton';

export interface ResultJobCardProps extends CommonProps {
  /**
   * Instance of the job
   */
  instance: InstanceSummary;
  poll?: JobDetailsProps['poll'];
}

/**
 * Displays details of an instance of a job
 */
export const ResultJobCard = ({
  instance,
  collapsedByDefault = true,
  poll,
}: ResultJobCardProps) => {
  const query = useInstanceRouterQuery();

  const associatedProject = useProjectFromId(instance.project_id);

  return (
    <ResultCard
      actions={({ setSlideIn }) => (
        <>
          <TerminateInstance instance={instance} onTermination={() => setSlideIn(false)} />
          <RerunJobButton instance={instance} />
          <LogsButton instance={instance} />
        </>
      )}
      collapsed={
        <CardContent>
          <JobDetails instanceSummary={instance} poll={poll} />
        </CardContent>
      }
      collapsedByDefault={collapsedByDefault}
      createdDateTime={instance.launched}
      href={{ pathname: APP_ROUTES.results.instance(instance.id), query }}
      linkTitle="Job"
      state={instance.phase}
    >
      <ListItem>
        <ListItemText primary={instance.name} secondary={instance.job_name} />
      </ListItem>
      <ProjectListItem projectName={associatedProject?.name || 'loading...'} />
    </ResultCard>
  );
};
