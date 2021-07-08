import React, { useRef, useState } from 'react';

import { FileError } from 'react-dropzone';
import { useQueryClient } from 'react-query';

import { css } from '@emotion/react';
import {
  Grid,
  IconButton,
  LinearProgress,
  MenuItem,
  TextField,
  Typography,
  useTheme,
} from '@material-ui/core';
import { getGetDatasetsQueryKey } from '@squonk/data-manager-client/dataset';
import { useGetTask } from '@squonk/data-manager-client/task';

import { TwiddleIcon } from '../Uploads/TwiddleIcon';
import { UploadableFile } from '../Uploads/types';
import { useFileExtensions } from './useFileExtensions';
import { useMimeTypeLookup } from './useMimeTypeLookup';

export interface SingleFileUploadWithProgressProps {
  fileWrapper: UploadableFile;
  errors: FileError[];
  rename: (newName: string) => void;
  changeMimeType: (newType: string) => void;
  changeToDone: () => void;
  onDelete: (file: File) => void;
}

export function SingleFileUploadWithProgress({
  fileWrapper,
  onDelete,
  errors,
  rename,
  changeToDone,
  changeMimeType,
}: SingleFileUploadWithProgressProps) {
  const queryClient = useQueryClient();
  const fileNameRef = useRef<HTMLInputElement>();
  const fileExtRef = useRef<HTMLInputElement>();

  const composeNewFilePath = () => {
    return `${fileNameRef.current?.value}${fileExtRef.current?.value}`;
  };

  const typeLabelParts = fileWrapper.file.name.split('.');
  const [stem, ...extensions] = typeLabelParts;

  const [interval, setInterval] = useState<number | false>(2000);
  const { data: task, isLoading } = useGetTask(fileWrapper.taskId ?? '', undefined, {
    query: {
      refetchInterval: interval,
      onSuccess: (task) => {
        if (!isLoading && task.done) {
          setInterval(false);
          queryClient.invalidateQueries(getGetDatasetsQueryKey());
          changeToDone();
        }
      },
    },
  });

  const allowedFileTypes = useFileExtensions();
  const mimeLookup = useMimeTypeLookup();

  const theme = useTheme();

  const disabled =
    (task && !task.done) ||
    (fileWrapper.progress < 100 && fileWrapper.progress > 0) ||
    isLoading ||
    (fileWrapper.progress === 100 && task === undefined);

  return (
    <>
      <Grid
        container
        alignItems="center"
        css={css`
          margin-bottom: ${theme.spacing(1)}px;
        `}
        spacing={1}
      >
        <Grid item sm={8} xs={12} md={9}>
          <TextField
            fullWidth
            required
            defaultValue={stem}
            disabled={disabled || task?.done}
            inputRef={fileNameRef}
            placeholder={stem}
            size="small"
            onChange={() => rename(composeNewFilePath())}
            onClick={(event) => event.stopPropagation()}
          />
        </Grid>
        <Grid
          item
          css={css`
            text-align: center;
          `}
          sm={3}
          xs={8}
          md={2}
        >
          <TextField
            fullWidth
            select
            defaultValue={`.${extensions.join('.')}`}
            disabled={disabled || task?.done}
            inputRef={fileExtRef}
            label="Ext"
            size="small"
            onChange={(event) => {
              event.stopPropagation();
              rename(composeNewFilePath());

              changeMimeType(mimeLookup[event.target.value]);
            }}
            onClick={(event) => event.stopPropagation()}
          >
            {allowedFileTypes?.map((fileType) => (
              <MenuItem key={fileType} value={fileType}>
                {fileType}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid
          item
          css={css`
            text-align: center;
          `}
          sm={1}
          xs={4}
          md={1}
        >
          <IconButton
            disabled={disabled}
            css={css`
              color: ${theme.palette.success.main};
            `}
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(fileWrapper.file);
            }}
          >
            <TwiddleIcon done={!!task?.done} />
          </IconButton>
        </Grid>
      </Grid>
      {fileWrapper.progress < 100 && fileWrapper.progress > 0 && (
        <LinearProgress value={fileWrapper.progress} variant="determinate" />
      )}
      {(fileWrapper.progress === 100 && task === undefined) || (task && !task.done) || isLoading ? (
        <LinearProgress />
      ) : null}
      {errors.map((error) => (
        <Typography color="error" key={`${error.code}-${error.message}`}>
          {error.message}
        </Typography>
      ))}
    </>
  );
}
