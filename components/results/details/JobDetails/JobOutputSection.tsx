import type { InstanceSummary } from '@squonk/data-manager-client';

import { css } from '@emotion/react';
import {
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from '@material-ui/core';
import { FolderRounded, InsertDriveFileRounded } from '@material-ui/icons';

import { JobLink } from './JobLink';
import type { OutputValue } from './types';

export interface JobOutputSectionProps {
  /**
   * Instance of the job.
   */
  instanceSummary: InstanceSummary;
}

/**
 * Displays generated outputs for a task.
 */
export const JobOutputSection = ({ instanceSummary }: JobOutputSectionProps) => {
  const outputs: Record<string, OutputValue> = instanceSummary.outputs
    ? JSON.parse(instanceSummary.outputs)
    : {};
  const outputsEntries = Object.entries(outputs);

  if (!outputsEntries.length) {
    return <Typography>This job has no outputs</Typography>;
  }

  return (
    <List aria-label="list of job outputs">
      {/* We currently have to assume that the outputs have a consistent type */}
      {outputsEntries.map(([name, output]) => {
        const isFile = output.type === 'file' || output.type === 'files';

        return (
          <ListItem
            css={css`
              align-items: flex-start;
            `}
            key={name}
          >
            <ListItemAvatar>
              <Avatar>{isFile ? <InsertDriveFileRounded /> : <FolderRounded />}</Avatar>
            </ListItemAvatar>
            <ListItemText
              disableTypography
              css={css`
                margin: 0;
              `}
              primary={
                <Typography component="span" variant="body1">
                  {output.title}
                </Typography>
              }
              secondary={
                <JobLink
                  path={output.creates}
                  projectId={instanceSummary.project_id}
                  type={output.type}
                />
              }
            />
          </ListItem>
        );
      })}
    </List>
  );
};
