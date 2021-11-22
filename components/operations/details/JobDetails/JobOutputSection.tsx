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
  outputs: Record<string, OutputValue>;
  projectId: string;
}

/**
 * Displays generated outputs for a task.
 */
export const JobOutputSection = ({ outputs, projectId }: JobOutputSectionProps) => {
  return (
    <List aria-label="list of job outputs">
      {/* We currently have to assume that the outputs have a consistent type */}
      {Object.entries(outputs).map(([name, output]) => {
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
              secondary={<JobLink path={output.creates} projectId={projectId} type={output.type} />}
            />
          </ListItem>
        );
      })}
    </List>
  );
};
