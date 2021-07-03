import React, { useState } from 'react';

import { AxiosError } from 'axios';
import { FileError } from 'react-dropzone';

import { css } from '@emotion/react';
import { Grid, IconButton, useTheme } from '@material-ui/core';
import CloudUploadRoundedIcon from '@material-ui/icons/CloudUploadRounded';
import {
  customInstance,
  DatasetPostBodyBody,
  DatasetPutPostResponse,
} from '@squonk/data-manager-client';
import { useGetFileTypes } from '@squonk/data-manager-client/type';

import { ModalWrapper } from '../ModalWrapper';
import { Dropzone } from './Dropzone';
import { SingleFileUploadWithProgress } from './SingleFileUploader';
import { mutateAtPosition } from './utils';

export interface UploadableFile {
  id: string;
  taskId: string | null;
  file: File;
  errors: FileError[];
  progress: number;
  rename?: string;
  mimeType: string;
}

export const FileUpload = () => {
  const theme = useTheme();

  const [open, setOpen] = useState(false);
  // Array of the user uploaded files with associated errors
  const [files, setFiles] = useState<UploadableFile[]>([]);

  const { isLoading: isTypesLoading } = useGetFileTypes(); // Ensure types are prefetched to mime lookup works

  const onDelete = (file: File) => {
    setFiles((curr) => curr.filter((fw) => fw.file !== file));
  };

  const uploadFiles = () => {
    files.forEach(async ({ file, rename, mimeType }, index) => {
      const data: DatasetPostBodyBody = {
        dataset_file: file,
        dataset_type: mimeType,
        as_filename: rename ?? file.name,
      };

      try {
        const response: DatasetPutPostResponse = await customInstance({
          method: 'POST',
          data,
          url: '/dataset',
          onUploadProgress: (progressEvent) => {
            const progress = Math.floor((progressEvent.loaded * 100) / progressEvent.total);
            const updatedFiles = [...files];
            updatedFiles[index] = { ...updatedFiles[index], progress };

            setFiles(updatedFiles);
          },
        });
        if (response.task_id) {
          const updatedFiles = [...files];
          updatedFiles[index].taskId = response.task_id;
          setFiles(updatedFiles);
        }
      } catch (err) {
        if (err.isAxiosError) {
          const data = (err as AxiosError).response?.data;

          const updatedFiles = [...files];
          updatedFiles[index].errors.push({ message: data.detail, code: status });
          setFiles(updatedFiles);
        }
      }
    });
  };

  return (
    <>
      <IconButton onClick={() => setOpen(true)} disabled={isTypesLoading}>
        <CloudUploadRoundedIcon />
      </IconButton>
      <ModalWrapper
        title="Upload New Datasets"
        submitText="Upload"
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={uploadFiles}
      >
        <Dropzone files={files} setFiles={setFiles}>
          <Grid container direction="column">
            {files.map((fileWrapper, index) => (
              <Grid
                item
                css={css`
                  margin-bottom: ${theme.spacing(1)}px;
                `}
                key={fileWrapper.id}
              >
                <SingleFileUploadWithProgress
                  errors={fileWrapper.errors}
                  fileWrapper={fileWrapper}
                  rename={(newName) => {
                    files[index].rename = newName;
                    setFiles(mutateAtPosition(files, index, files[index]));
                  }}
                  changeMimeType={(newType) => {
                    files[index].mimeType = newType;
                    setFiles(mutateAtPosition(files, index, files[index]));
                  }}
                  onDelete={onDelete}
                />
              </Grid>
            ))}
          </Grid>
        </Dropzone>
      </ModalWrapper>
    </>
  );
};
