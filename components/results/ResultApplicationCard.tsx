import type { HTMLProps } from 'react';

import type { InstanceSummary } from '@squonk/data-manager-client';

import type { ButtonProps } from '@material-ui/core';
import { ListItem, ListItemText } from '@material-ui/core';
import { Button, CardContent } from '@material-ui/core';

import { APP_ROUTES } from '../../constants/routes';
import { useProjectFromId } from '../../hooks/projectHooks';
import { ResultCard } from '../results/ResultCard';
import { ProjectListItem } from './common/ProjectListItem';
import { TerminateInstance } from './common/TerminateInstance';
import type { CommonProps } from './common/types';
import { useInstanceRouterQuery } from './common/useInstanceRouterQuery';
import type { ApplicationDetailsProps } from './details/ApplicationDetails';
import { ApplicationDetails } from './details/ApplicationDetails';

// Button Props doesn't support target and rel when using as a Link
type MissingButtonProps = Pick<HTMLProps<HTMLAnchorElement>, 'target' | 'rel'>;

// ? odd that typescript doesn't raise an issue here as `MissingButtonProps` contains invalid props
const HrefButton = (props: ButtonProps & MissingButtonProps) => <Button {...props} />;

export interface ResultApplicationCardProps extends CommonProps {
  /**
   * Instance of the application
   */
  instance: InstanceSummary;
  poll?: ApplicationDetailsProps['poll'];
}

export const ResultApplicationCard = ({
  instance,
  collapsedByDefault = true,
  poll,
}: ResultApplicationCardProps) => {
  const query = useInstanceRouterQuery();

  const associatedProject = useProjectFromId(instance.project_id);

  return (
    <ResultCard
      actions={({ setSlideIn }) => (
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
      )}
      collapsed={
        <CardContent>
          <ApplicationDetails instanceId={instance.id} poll={poll} />
        </CardContent>
      }
      collapsedByDefault={collapsedByDefault}
      createdDateTime={instance.launched}
      href={{ pathname: APP_ROUTES.results.instance(instance.id), query }}
      linkTitle="App"
      state={instance.phase}
    >
      <ListItem>
        <ListItemText primary={instance.name} />
      </ListItem>
      <ProjectListItem projectName={associatedProject?.name || 'loading...'} />
    </ResultCard>
  );
};
