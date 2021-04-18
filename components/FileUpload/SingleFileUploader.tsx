import React from 'react';

import { FileError } from 'react-dropzone';

import { css } from '@emotion/react';
import {
  Button,
  Chip,
  Grid,
  LinearProgress,
  TextField,
  Typography,
  useTheme,
} from '@material-ui/core';

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
  const typeLabelParts = fileWrapper.file.name.split('.');
  const [_, ...extensions] = typeLabelParts;

  errors.length && console.log(errors);

  const theme = useTheme();
  return (
    <>
      <Grid
        container
        alignItems="center"
        css={css`
          margin-bottom: ${theme.spacing(1)}px;
        `}
      >
        <Grid xs={2} sm={2} item align="center">
          <Chip label={extensions.join('.')} color="primary" />
        </Grid>
        <Grid xs={10} sm={8} item>
          <TextField
            fullWidth
            size="small"
            required
            defaultValue={fileWrapper.file.name}
            variant="outlined"
            onChange={(e) => rename(e.target.value)}
          />
        </Grid>
        <Grid xs={12} sm={2} item align="center">
          <Button size="small" onClick={() => onDelete(fileWrapper.file)}>
            Delete
          </Button>
        </Grid>
      </Grid>
      <LinearProgress variant="determinate" value={fileWrapper.progress} />
      {errors.map((error, index) => (
        <Typography key={`${error.code}-${error.message}-${index}`} color="error">
          {error.message}
        </Typography>
      ))}
    </>
  );
}
