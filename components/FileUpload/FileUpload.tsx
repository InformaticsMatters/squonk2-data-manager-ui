import React, { useState } from 'react';

import { AxiosError } from 'axios';
import { FileError } from 'react-dropzone';

import { css } from '@emotion/react';
import { Grid, IconButton, useTheme } from '@material-ui/core';
import CloudUploadRoundedIcon from '@material-ui/icons/CloudUploadRounded';
import { customInstance, DatasetId } from '@squonk/data-manager-client';

import { Dropzone } from './Dropzone';
import { ModalWrapper } from './ModalWrapper';
import { SingleFileUploadWithProgress } from './SingleFileUploader';
import { getMimeType, mutateAtPosition } from './utils';

export interface UploadableFile {
  id: string;
  taskId: string | null;
  file: File;
  errors: FileError[];
  progress: number;
  rename?: string;
}

export const FileUpload = () => {
  const theme = useTheme();

  const [open, setOpen] = useState(false);
  // Array of the user uploaded files with associated errors
  const [files, setFiles] = useState<UploadableFile[]>([]);

  // Combine the validated and unvalidated files into a single array for rendering

  const onDelete = (file: File) => {
    setFiles((curr) => curr.filter((fw) => fw.file !== file));
  };

  const uploadFiles = () => {
    files.forEach(async ({ file, rename }, index) => {
      const data = {
        dataset_file: file,
        as_filename: rename ?? file.name,
        dataset_type: getMimeType(file.name),
      };

      try {
        const res = await customInstance({
          method: 'POST',
          data,
          url: '/dataset',
          onUploadProgress: (progressEvent) => {
            const progress = Math.floor((progressEvent.loaded * 100) / progressEvent.total);
            const updatedFiles = [...files];
            updatedFiles[index].progress = progress;

            setFiles(updatedFiles);
          },
        });
        const response = res as DatasetId;
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
      <IconButton onClick={() => setOpen(true)}>
        <CloudUploadRoundedIcon />
      </IconButton>
      <ModalWrapper open={open} onClose={() => setOpen(false)} onSubmit={uploadFiles}>
        <Dropzone files={files} setFiles={setFiles}>
          <Grid container direction="column">
            {files.map((fileWrapper, index) => (
              <Grid
                item
                key={fileWrapper.id}
                css={css`
                  margin-bottom: ${theme.spacing(1)}px;
                `}
              >
                <SingleFileUploadWithProgress
                  onDelete={onDelete}
                  fileWrapper={fileWrapper}
                  errors={fileWrapper.errors}
                  rename={(newName) => {
                    files[index].rename = newName;
                    setFiles(mutateAtPosition(files, index, files[index]));
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </Dropzone>
      </ModalWrapper>
    </>
  );
};
