import { FC } from 'react';

import { useQueryClient } from 'react-query';

import { useUser } from '@auth0/nextjs-auth0';
import { css } from '@emotion/react';
import { Avatar, Chip, Typography, useTheme } from '@material-ui/core';
import {
  getGetAvailableProjectsQueryKey,
  ProjectSummary,
  useRemoveEditorFromProject,
} from '@squonk/data-manager-client';

interface EditorsProps {
  currentProject: ProjectSummary;
}

export const Editors: FC<EditorsProps> = ({ currentProject }) => {
  const queryClient = useQueryClient();
  const removeEditorMutation = useRemoveEditorFromProject();
  const { user } = useUser();

  const deleteHandlerFactory = (editor: string) => async () => {
    if (currentProject.project_id) {
      await removeEditorMutation.mutateAsync({
        projectid: currentProject.project_id,
        userid: editor,
      });
      queryClient.invalidateQueries(getGetAvailableProjectsQueryKey());
    }
  };

  const theme = useTheme();
  return (
    <div>
      <Typography display="inline">
        <b>Editors</b>
      </Typography>
      :
      <div
        css={css`
          display: flex;
          flex-wrap: wrap;
          & > * {
            margin: ${theme.spacing(0.5)}px;
          }
        `}
      >
        {currentProject.editors?.map((editor) => (
          <Chip
            key={editor}
            avatar={<Avatar>{editor[0].toUpperCase()}</Avatar>}
            label={editor}
            onDelete={
              user?.preferred_username === editor ? undefined : deleteHandlerFactory(editor)
            }
          />
        ))}
      </div>
    </div>
  );
};
