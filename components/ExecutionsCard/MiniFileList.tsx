import type { FC, ReactNode } from 'react';
import { useState } from 'react';
import React from 'react';

import { useGetFiles } from '@squonk/data-manager-client/file';

import { css } from '@emotion/react';
import styled from '@emotion/styled';
import {
  Breadcrumbs,
  Checkbox,
  FormControlLabel,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Tooltip,
  Typography,
  useTheme,
} from '@material-ui/core';
import FolderRoundedIcon from '@material-ui/icons/FolderRounded';
import FolderSpecialRoundedIcon from '@material-ui/icons/FolderSpecialRounded';
import StarBorderRoundedIcon from '@material-ui/icons/StarBorderRounded';
import StarRoundedIcon from '@material-ui/icons/StarRounded';

import type { ProjectId } from '../state/currentProjectHooks';
import { useSelectedFiles } from '../state/FileSelectionContext';

export interface MiniFileTableProps {
  type: 'directory' | 'file';
  multiple: boolean;
  projectId: NonNullable<ProjectId>;
  value?: string[] | string;
  onSelect: (selection: string[] | string | undefined) => void;
}

export const MiniFileList: FC<MiniFileTableProps> = ({
  onSelect,
  type: targetType,
  multiple,
  projectId,
  value,
}) => {
  const theme = useTheme();

  const { selectedFiles, addFile, removeFile } = useSelectedFiles(projectId);

  const selectedFilesToDisplay = selectedFiles?.filter((file) => file.type.includes(targetType));

  const [showShortList, setShowShortList] = useState(
    !!selectedFiles?.filter((file) => file.type.includes(targetType))?.length,
  );

  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);
  const path = '/' + breadcrumbs.join('/');

  const { data, isLoading } = useGetFiles({
    project_id: projectId,
    path,
  });

  const getNewValue = (fullPath: string, checked: boolean) => {
    if (multiple) {
      if (value === undefined) {
        if (checked) {
          return [fullPath];
        }
        return undefined;
      }
      if (checked) {
        return Array.from(new Set([...[value].flat(), fullPath]));
      }
      return [value].flat().filter((p) => p !== fullPath);
    }
    return checked ? fullPath : undefined;
  };

  const getChecked = (fullPath: string) => {
    return !!(fullPath === value || (typeof value !== 'string' && value?.includes(fullPath)));
  };

  const handleFavouriteChange = (
    checked: boolean,
    fullPath: string,
    type: MiniFileTableProps['type'],
  ) => {
    checked
      ? addFile && addFile({ path: fullPath, type })
      : removeFile && removeFile({ path: fullPath, type });
  };

  return (
    <div
      css={css`
        border: 2px dashed ${theme.palette.grey[600]};
        border-radius: 8px;
        padding: ${theme.spacing(1)}px;
        padding-left: ${theme.spacing(2)}px;
        padding-right: ${theme.spacing(2)}px;
      `}
    >
      <FormControlLabel
        control={
          <Checkbox
            checked={showShortList}
            onChange={(_event, checked) => setShowShortList(checked)}
          />
        }
        label="Show short list"
      />

      {!showShortList && (
        <>
          <Breadcrumbs>
            {['root', ...breadcrumbs].map((path, pathIndex) =>
              pathIndex < breadcrumbs.length ? (
                <Link
                  color="inherit"
                  component="button"
                  key={`${pathIndex}-${path}`}
                  variant="body1"
                  onClick={() => setBreadcrumbs(breadcrumbs.slice(0, pathIndex))}
                >
                  {path}
                </Link>
              ) : (
                <Typography key={`${pathIndex}-${path}`}>{path}</Typography>
              ),
            )}
          </Breadcrumbs>
          <ScrollList dense>
            {data?.paths.map((path) => {
              const fullPath = breadcrumbs.join('/') + (breadcrumbs.length ? '/' : '') + path;
              return (
                <FileListItem
                  checked={getChecked(fullPath)}
                  favourite={!!selectedFiles?.find((file) => file.path === fullPath)}
                  fileName={path}
                  key={fullPath}
                  path={path}
                  type="directory"
                  onClick={(path) => setBreadcrumbs([...breadcrumbs, path])}
                  onFavourite={(checked) => handleFavouriteChange(checked, fullPath, 'directory')}
                  onSelect={
                    targetType.startsWith('dir')
                      ? (checked) => onSelect(getNewValue(fullPath, checked))
                      : undefined
                  }
                />
              );
            })}
            {!targetType.startsWith('dir') &&
              data?.files.map((file) => {
                const fullPath =
                  breadcrumbs.join('/') + (breadcrumbs.length ? '/' : '') + file.file_name;
                return (
                  <FileListItem
                    checked={getChecked(fullPath)}
                    favourite={!!selectedFiles?.find((file) => file.path === fullPath)}
                    fileName={file.file_name}
                    key={fullPath}
                    path={fullPath}
                    type="file"
                    onFavourite={(checked) => handleFavouriteChange(checked, fullPath, 'file')}
                    onSelect={(checked) => onSelect(getNewValue(fullPath, checked))}
                  />
                );
              })}
          </ScrollList>
        </>
      )}

      {showShortList &&
        (selectedFilesToDisplay?.length ? (
          <ScrollList dense>
            {selectedFilesToDisplay.map(({ path: fullPath, type }) => (
              <FileListItem
                checked={getChecked(fullPath)}
                favourite={!!selectedFilesToDisplay.find((file) => file.path === fullPath)}
                fileName={fullPath}
                folderIcon={<FolderSpecialRoundedIcon />}
                key={fullPath}
                path={fullPath}
                type={type}
                onFavourite={(checked) => handleFavouriteChange(checked, fullPath, type)}
                onSelect={(checked) => onSelect(getNewValue(fullPath, checked))}
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
            You have no favourite files
          </Typography>
        ))}
    </div>
  );
};

const ScrollList = styled(List)`
  min-height: 100px;
  max-height: 30vh;
  overflow-y: auto;
`;

interface FileListItemProps {
  type: string;
  path: string;
  fileName: string;
  checked: boolean;
  favourite?: boolean;
  folderIcon?: ReactNode;
  onClick?: (path: string) => void;
  onSelect?: (checked: boolean) => void;
  onFavourite?: (checked: boolean) => void;
}

const FileListItem = ({
  type,
  path,
  fileName,
  checked,
  favourite,
  folderIcon,
  onClick,
  onSelect,
  onFavourite,
}: FileListItemProps) => {
  const labelId = `file-${path}`;
  return (
    <ListItem button={!!onClick as any} key={path} onClick={() => onClick && onClick(path)}>
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
      <Tooltip title={fileName}>
        <ListItemText id={labelId} primary={fileName} primaryTypographyProps={{ noWrap: true }} />
      </Tooltip>
      {onFavourite && (
        <ListItemSecondaryAction>
          <Checkbox
            checked={!!favourite}
            checkedIcon={<StarRoundedIcon />}
            css={css`
              padding-top: 0;
              padding-bottom: 0;
            `}
            edge="end"
            icon={<StarBorderRoundedIcon />}
            inputProps={{ 'aria-labelledby': labelId }}
            size="small"
            onChange={(_event, checked) => onFavourite(checked)}
          />
        </ListItemSecondaryAction>
      )}
    </ListItem>
  );
};
