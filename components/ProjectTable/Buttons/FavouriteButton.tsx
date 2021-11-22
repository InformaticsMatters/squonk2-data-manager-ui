import React from 'react';

import { css } from '@emotion/react';
import type { CheckboxProps } from '@material-ui/core';
import { Checkbox, Tooltip } from '@material-ui/core';
import StarBorderRoundedIcon from '@material-ui/icons/StarBorderRounded';
import StarRoundedIcon from '@material-ui/icons/StarRounded';

import type { SavedFile } from '../../../context/fileSelectionContext';
import { useSelectedFiles } from '../../../context/fileSelectionContext';
import type { ProjectId } from '../../../hooks/currentProjectHooks';

export interface FavouriteButtonProps {
  /**
   * ID of the project under which the favourite file or directory is scoped
   */
  projectId: ProjectId;
  /**
   * The path of the file. This is used to identify a file in the favourite files/directories list.
   */
  fullPath: string;
  /**
   * Whether the item is a file or a directory.
   */
  type: SavedFile['type'];
  /**
   * Mime-type of the file. Undefined if fullPath corresponds to a directory.
   */
  mimeType: string | undefined;
  /**
   * Props forwarded to the MuiCheckbox component.
   */
  CheckboxProps?: CheckboxProps;
}

/**
 * Checkbox that controls a file's favourite state in the selected files context.
 */
export const FavouriteButton = ({
  projectId,
  fullPath,
  type,
  mimeType,
  CheckboxProps,
}: FavouriteButtonProps) => {
  const { selectedFiles, addFile, removeFile } = useSelectedFiles(projectId);

  const file = selectedFiles?.find((file) => file.path === fullPath);

  const handleFavouriteChange = (checked: boolean, fullPath: string) => {
    checked
      ? addFile && addFile({ path: fullPath, type, mimeType })
      : removeFile && removeFile({ path: fullPath, type, mimeType });
  };

  return (
    <Tooltip title="Favourite this file">
      <Checkbox
        css={css`
          padding: 0;
          margin: 0 3px;
        `}
        edge="end"
        checked={!!file}
        checkedIcon={<StarRoundedIcon />}
        icon={<StarBorderRoundedIcon />}
        size="small"
        onChange={(_event, checked) => handleFavouriteChange(checked, fullPath)}
        {...CheckboxProps}
      />
    </Tooltip>
  );
};
