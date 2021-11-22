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
import { Alert } from '@material-ui/lab';

import { CenterLoader } from '../../../../CenterLoader';
import { JobLink } from '../JobLink';
import { useGetJobInputs } from './useGetJobInputs';

export interface JobInputSectionProps {
  /**
   * Instance of the job.
   */
  instanceSummary: InstanceSummary;
}

/**
 * Displays provided inputs for a task.
 */
export const JobInputSection = ({ instanceSummary }: JobInputSectionProps) => {
  const { inputs, isLoading, isError, error } = useGetJobInputs(instanceSummary);

  if (isLoading) {
    return <CenterLoader />;
  }

  if (isError) {
    return <Alert severity="error">{error?.response?.data.error}</Alert>;
  }

  if (!inputs.length) {
    return <Typography>This job has no inputs</Typography>;
  }

  return (
    <List aria-label="list of job inputs">
      {/* We currently have to assume that the outputs have a consistent type */}
      {inputs.map((input) => {
        return (
          <ListItem
            css={css`
              align-items: flex-start;
            `}
            key={input.name}
          >
            <ListItemAvatar>
              <Avatar>
                {input.type === 'file' ? <InsertDriveFileRounded /> : <FolderRounded />}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              disableTypography
              css={css`
                margin: 0;
              `}
              primary={
                <Typography component="span" variant="body1">
                  {input.title}
                </Typography>
              }
              secondary={input.value.map((val) => (
                <JobLink
                  key={val}
                  path={val}
                  projectId={instanceSummary.project_id}
                  type={input.type}
                />
              ))}
            />
          </ListItem>
        );
      })}
    </List>
  );
};
