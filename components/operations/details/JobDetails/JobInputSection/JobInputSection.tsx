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

  return (
    <List
      aria-label="list of job inputs"
      css={css`
        display: flex;
        flex-wrap: wrap;
      `}
    >
      {/* We currently have to assume that the outputs have a consistent type */}
      {inputs.map((input) => {
        return (
          <ListItem
            css={css`
              width: auto;
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
