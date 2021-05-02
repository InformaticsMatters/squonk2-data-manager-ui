import React, { useRef, useState } from 'react';

import { FileError } from 'react-dropzone';

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
import DeleteRoundedIcon from '@material-ui/icons/DeleteRounded';
import DoneRoundedIcon from '@material-ui/icons/DoneRounded';
import { Task, useGetTask } from '@squonk/data-manager-client';

import { allowedFileTypes } from './utils';

import type { UploadableFile } from './FileUpload';
export interface SingleFileUploadWithProgressProps {
  fileWrapper: UploadableFile;
  errors: FileError[];
  rename: (newName: string) => void;
  onDelete: (file: File) => void;
}

export function SingleFileUploadWithProgress({
  fileWrapper,
  onDelete,
  errors,
  rename,
}: SingleFileUploadWithProgressProps) {
  const fileNameRef = useRef<HTMLInputElement>();
  const fileExtRef = useRef<HTMLInputElement>();

  const composeNewFilePath = () => {
    return `${fileNameRef.current?.value}${fileExtRef.current?.value}`;
  };

  const typeLabelParts = fileWrapper.file.name.split('.');
  const [stem, ...extensions] = typeLabelParts;

  const [interval, setInterval] = useState<number | false>(2000);
  const { data, isLoading } = useGetTask(fileWrapper.taskId ?? '', undefined, {
    refetchInterval: interval,
    onSuccess: () => {
      if (!isLoading && task && task.done) {
        setInterval(false);
      }
    },
  });
  const task = data as Task | undefined;

  const theme = useTheme();
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
        <Grid xs={10} sm={8} item>
          <TextField
            disabled={task?.done}
            inputRef={fileNameRef}
            fullWidth
            size="small"
            required
            defaultValue={stem}
            placeholder={stem}
            variant="outlined"
            // onChange={(e) => rename(e.target.value)}
            onChange={() => rename(composeNewFilePath())}
            onClick={(e) => e.stopPropagation()}
          />
        </Grid>
        <Grid
          xs={2}
          sm={3}
          item
          css={css`
            text-align: center;
          `}
        >
          <TextField
            disabled={task?.done}
            inputRef={fileExtRef}
            fullWidth
            variant="outlined"
            size="small"
            label="Ext"
            defaultValue={`.${extensions.join('.')}`}
            select
            onClick={(e) => {
              e.stopPropagation();
              rename(composeNewFilePath());
            }}
          >
            {allowedFileTypes.map((fileType) => (
              <MenuItem key={fileType} value={fileType}>
                {fileType}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid
          xs={12}
          sm={1}
          item
          css={css`
            text-align: center;
          `}
        >
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(fileWrapper.file);
            }}
            css={css`
              color: ${theme.palette.success.main};
            `}
          >
            {task?.done ? (
              <DoneRoundedIcon
                css={css`
                  @keyframes spin-in {
                    0% {
                      opacity: 0.4;
                      transform: rotate(-45deg);
                    }
                    100% {
                      opacity: 1;
                      transform: rotate(0);
                    }
                  }
                  animation: spin-in 0.5s ease;
                `}
              />
            ) : (
              <DeleteRoundedIcon color="primary" />
            )}
          </IconButton>
        </Grid>
      </Grid>
      {(fileWrapper.progress < 100 || (fileWrapper.progress === 100 && !fileWrapper.taskId)) && (
        <LinearProgress variant="determinate" value={fileWrapper.progress} />
      )}
      {!isLoading && task && !task.done && <LinearProgress />}
      {errors.map((error, index) => (
        <Typography key={`${error.code}-${error.message}-${index}`} color="error">
          {error.message}
        </Typography>
      ))}
    </>
  );
}
