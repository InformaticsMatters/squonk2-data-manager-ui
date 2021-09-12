import React, { useCallback } from 'react';
import type { DropzoneOptions, FileRejection } from 'react-dropzone';
import { useDropzone } from 'react-dropzone';

import { css } from '@emotion/react';
import { Button, Divider, useTheme } from '@material-ui/core';
import { v4 as uuidv4 } from 'uuid';

import { useFileExtensions } from '../FileUpload/useFileExtensions';
import { useMimeTypeLookup } from '../FileUpload/useMimeTypeLookup';
import { getMimeFromFileName } from '../FileUpload/utils';
import type { UploadableFile } from './types';

interface DropzoneProps extends DropzoneOptions {
  files: UploadableFile[];
  setFiles: (newFiles: UploadableFile[]) => void;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  children,
  files,
  setFiles,
  ...dropzoneOptions
}) => {
  const allowedFileTypes = useFileExtensions();
  const mimeLookup = useMimeTypeLookup();

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    const mappedAccepted = acceptedFiles.map((file) => ({
      file,
      mimeType: getMimeFromFileName(file.name, mimeLookup),
      errors: [],
      id: uuidv4(),
      progress: 0,
      taskId: null,
      done: false,
    }));
    const mappedRejected = rejectedFiles.map((rejection) => ({
      ...rejection,
      mimeType: getMimeFromFileName(rejection.file.name, mimeLookup),
      id: uuidv4(),
      progress: 0,
      taskId: null,
      done: false,
    }));
    setFiles([...mappedAccepted, ...mappedRejected]);
  }, []);

  const patchedFileExtensions = allowedFileTypes ?? [];
  // TODO: allow gzipped files to be uploaded
  // patchedFileExtensions.push('.gz');
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    ...dropzoneOptions,
    onDrop,
    accept: patchedFileExtensions,
  });

  const theme = useTheme();
  return (
    <div
      {...getRootProps()}
      css={css`
        border: 2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.grey[600]};
        border-radius: 8px;
        padding: ${theme.spacing(1)}px;
        padding-left: ${theme.spacing(2)}px;
        padding-right: ${theme.spacing(2)}px;
        max-height: 40vh;
        overflow-y: scroll;
      `}
    >
      <input {...getInputProps()} />
      <Button
        css={css`
          text-transform: none;
          cursor: pointer;
          text-align: center;
          border: none;
          background: none;
          display: block;
          width: 100%;
          margin-top: ${theme.spacing(2)}px;
          margin-bottom: ${theme.spacing(2)}px;
          font-size: 1rem;
        `}
      >
        Drag and drop files here, or click to select files
      </Button>
      {!!files.length && children && (
        <Divider
          css={css`
            margin-top: ${theme.spacing(2)}px;
            margin-bottom: ${theme.spacing(2)}px;
          `}
        />
      )}
      {children}
    </div>
  );
};
