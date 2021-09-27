import React, { useRef, useState } from 'react';
import type { FileError } from 'react-dropzone';
import { useQueryClient } from 'react-query';

import { getGetDatasetsQueryKey } from '@squonk/data-manager-client/dataset';
import { useGetTask } from '@squonk/data-manager-client/task';

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

import { useFileExtensions } from '../../hooks/useFileExtensions';
import { useMimeTypeLookup } from '../../hooks/useMimeTypeLookup';
import { TwiddleIcon } from '../uploads/TwiddleIcon';
import type { UploadableFile } from '../uploads/types';

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
      // When a task id has been set, we poll the task endpoint to wait for the file to finish
      // processing
      refetchInterval: interval,
      onSuccess: async (task) => {
        if (!isLoading && task.done) {
          setInterval(false);
          await queryClient.invalidateQueries(getGetDatasetsQueryKey());
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
      <Grid container alignItems="center" spacing={1}>
        <Grid item md={9} sm={8} xs={12}>
          <TextField
            fullWidth
            required
            defaultValue={stem}
            disabled={disabled || task?.done}
            inputRef={fileNameRef}
            placeholder={stem}
            onChange={() => rename(composeNewFilePath())}
            onClick={(event) => event.stopPropagation()}
          />
        </Grid>

        <Grid
          item
          css={css`
            text-align: center;
          `}
          md={2}
          sm={3}
          xs={8}
        >
          <TextField
            fullWidth
            select
            defaultValue={`.${extensions.join('.')}`}
            disabled={disabled || task?.done}
            inputRef={fileExtRef}
            label="Ext"
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
          md={1}
          sm={1}
          xs={4}
        >
          <IconButton
            css={css`
              color: ${theme.palette.success.main};
            `}
            disabled={disabled}
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

      {errors.map((error, index) => (
        <Typography color="error" key={index}>
          {error.message}
        </Typography>
      ))}
    </>
  );
}
