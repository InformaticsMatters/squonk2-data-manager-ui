import type { ReactNode } from 'react';

import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import {
  Checkbox,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Tooltip,
} from '@mui/material';

import { FavouriteButton } from '../ProjectTable/buttons/FavouriteButton';
import type { SharedProps } from './types';

export interface FileListItemProps extends Pick<SharedProps, 'projectId'> {
  /**
   * Mime type of the file. Used to track mime-type in favourite files.
   * Undefined if directories are being selected.
   */
  mimeType: string | undefined;
  /**
   * Whether the item is a file or directory
   */
  type: SharedProps['targetType'];
  /**
   * Path to teh file or directory.
   */
  fullPath: string;
  /**
   * Text to display in the primary list item.
   */
  title: string;
  /**
   * Whether the item is currently selected
   */
  checked: boolean;
  /**
   * Icon to display for a directory
   */
  folderIcon?: ReactNode;
  /**
   * Called when a checkbox is clicked
   */
  onSelect?: (checked: boolean) => void;
  /**
   * Called when a list item is clicked
   */
  onClick?: () => void;
}

/**
 * MuiListItem that displays a file or directory with click actions to either select a file
 * or directory or navigate inside a directory.
 */
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
            edge="start"
            inputProps={{ 'aria-labelledby': labelId }}
            size="small"
            sx={{ pt: 0, pb: 0 }}
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
