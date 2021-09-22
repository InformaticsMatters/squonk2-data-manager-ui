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
  projectId: ProjectId;
  fullPath: string;
  type: SavedFile['type'];
  mimeType: string | undefined;
  CheckboxProps?: CheckboxProps;
}

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
        checked={!!file}
        checkedIcon={<StarRoundedIcon />}
        css={css`
          padding-top: 0;
          padding-bottom: 0;
        `}
        edge="end"
        icon={<StarBorderRoundedIcon />}
        size="small"
        onChange={(_event, checked) => handleFavouriteChange(checked, fullPath)}
        {...CheckboxProps}
      />
    </Tooltip>
  );
};
