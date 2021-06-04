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
  const { data: task, isLoading } = useGetTask(fileWrapper.taskId ?? '', undefined, {
    query: {
      refetchInterval: interval,
      onSuccess: (data) => {
        const task = data as Task | undefined;
        if (!isLoading && task && task.done) {
          setInterval(false);
        }
      },
    },
  });

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
        <Grid item sm={8} xs={12}>
          <TextField
            fullWidth
            required
            defaultValue={stem}
            disabled={task?.done}
            inputRef={fileNameRef}
            placeholder={stem}
            size="small"
            // onChange={(e) => rename(e.target.value)}
            onChange={() => rename(composeNewFilePath())}
            onClick={(e) => e.stopPropagation()}
          />
        </Grid>
        <Grid
          item
          css={css`
            text-align: center;
          `}
          sm={3}
          xs={8}
        >
          <TextField
            fullWidth
            select
            defaultValue={`.${extensions.join('.')}`}
            disabled={task?.done}
            inputRef={fileExtRef}
            label="Ext"
            size="small"
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
          item
          css={css`
            text-align: center;
          `}
          sm={1}
          xs={4}
        >
          <IconButton
            css={css`
              color: ${theme.palette.success.main};
            `}
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(fileWrapper.file);
            }}
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
        <LinearProgress value={fileWrapper.progress} variant="determinate" />
      )}
      {!isLoading && task && !task.done && <LinearProgress />}
      {errors.map((error, index) => (
        <Typography color="error" key={`${error.code}-${error.message}-${index}`}>
          {error.message}
        </Typography>
      ))}
    </>
  );
}
