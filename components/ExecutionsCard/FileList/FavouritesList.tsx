import type { FC } from 'react';
import React from 'react';

import { css } from '@emotion/react';
import { Typography } from '@material-ui/core';
import FolderSpecialRoundedIcon from '@material-ui/icons/FolderSpecialRounded';

import { useSelectedFiles } from '../../../context/fileSelectionContext';
import { FileListItem } from './FileListItem';
import { ScrollList } from './ScrollList';
import type { SharedProps } from './types';
import { getChecked, getNewValue } from './utils';

export const FavouritesList: FC<SharedProps> = ({
  projectId,
  value,
  mimeTypes,
  targetType,
  multiple,
  onSelect,
}) => {
  const { selectedFiles } = useSelectedFiles(projectId);

  const selectedFilesToDisplay = selectedFiles
    ?.filter((file) => file.type.includes(targetType))
    .filter((file) => !file.mimeType || mimeTypes?.includes(file.mimeType));

  return selectedFilesToDisplay?.length ? (
    <ScrollList dense>
      {selectedFilesToDisplay.map(({ path: fullPath, type, mimeType }) => (
        <FileListItem
          checked={getChecked(value, fullPath)}
          folderIcon={<FolderSpecialRoundedIcon />}
          fullPath={fullPath}
          key={fullPath}
          mimeType={mimeType}
          projectId={projectId}
          title={fullPath}
          type={type}
          onSelect={(checked) => onSelect(getNewValue(fullPath, checked, multiple, value))}
        />
      ))}
    </ScrollList>
  ) : (
    <Typography
      css={css`
        text-align: center;
      `}
      variant="body2"
    >
      You have no favourite files that are of the correct type
    </Typography>
  );
};
