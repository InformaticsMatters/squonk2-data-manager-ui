import type { FC, ReactNode } from 'react';
import React from 'react';

import { css } from '@emotion/react';
import {
  Checkbox,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Tooltip,
} from '@material-ui/core';
import FolderRoundedIcon from '@material-ui/icons/FolderRounded';

import { FavouriteButton } from '../../DataTable/Actions/Buttons/FavouriteButton';
import type { FileOrDirectory, NoUndefProjectId } from './types';

export interface FileListItemProps {
  mimeType: string | undefined;
  projectId: NoUndefProjectId;
  type: FileOrDirectory;
  fullPath: string;
  title: string;
  checked: boolean;
  folderIcon?: ReactNode;
  onSelect?: (checked: boolean) => void;
  onClick?: () => void;
}

export const FileListItem = ({
  projectId,
  type,
  mimeType,
  title,
  fullPath,
  checked,
  folderIcon,
  onClick,
  onSelect,
}: FileListItemProps) => {
  const labelId = `file-${fullPath}`;
  return (
    <ListItem button={!!onClick as any} key={fullPath} onClick={() => onClick && onClick()}>
      {!!onSelect && (
        <ListItemIcon>
          <Checkbox
            checked={checked}
            css={css`
              padding-top: 0;
              padding-bottom: 0;
            `}
            edge="start"
            inputProps={{ 'aria-labelledby': labelId }}
            size="small"
            onChange={(_event, checked) => onSelect(checked)}
            onClick={(event) => event.stopPropagation()}
          />
        </ListItemIcon>
      )}
      {type.startsWith('dir') && <ListItemIcon>{folderIcon ?? <FolderRoundedIcon />}</ListItemIcon>}
      <Tooltip title={title}>
        <ListItemText id={labelId} primary={title} primaryTypographyProps={{ noWrap: true }} />
      </Tooltip>
      <ListItemSecondaryAction>
        <FavouriteButton
          fullPath={fullPath}
          mimeType={mimeType}
          projectId={projectId}
          type={type}
        />
      </ListItemSecondaryAction>
    </ListItem>
  );
};
