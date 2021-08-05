import type { FC } from 'react';
import React from 'react';

import { css } from '@emotion/react';
import { Checkbox, Tooltip } from '@material-ui/core';
import StarBorderRoundedIcon from '@material-ui/icons/StarBorderRounded';
import StarRoundedIcon from '@material-ui/icons/StarRounded';

import type { ProjectId } from '../../../state/currentProjectHooks';
import type { SavedFile } from '../../../state/FileSelectionContext';
import { useSelectedFiles } from '../../../state/FileSelectionContext';

export interface FavouriteButtonProps {
  projectId: ProjectId;
  fullPath: string;
  type: SavedFile['type'];
}

export const FavouriteButton: FC<FavouriteButtonProps> = ({ projectId, fullPath, type }) => {
  const { selectedFiles, addFile, removeFile } = useSelectedFiles(projectId);

  const file = selectedFiles?.find((file) => file.path === fullPath);

  const handleFavouriteChange = (checked: boolean, fullPath: string, type: SavedFile['type']) => {
    checked
      ? addFile && addFile({ path: fullPath, type })
      : removeFile && removeFile({ path: fullPath, type });
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
        onChange={(_event, checked) => handleFavouriteChange(checked, fullPath, type)}
      />
    </Tooltip>
  );
};
