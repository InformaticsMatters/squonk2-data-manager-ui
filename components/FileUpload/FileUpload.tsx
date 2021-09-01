import React, { useState } from 'react';

import type { DatasetPostBodyBody, Error as DMError } from '@squonk/data-manager-client';
import { uploadDataset } from '@squonk/data-manager-client/dataset';
import { useGetFileTypes } from '@squonk/data-manager-client/type';

import { IconButton } from '@material-ui/core';
import CloudUploadRoundedIcon from '@material-ui/icons/CloudUploadRounded';
import type { AxiosError } from 'axios';

import { ModalWrapper } from '../Modals/ModalWrapper';
import { FileTypeOptions } from '../Uploads/FileTypeOptions';
import type { FileTypeOptionsState, UploadableFile } from '../Uploads/types';
import { BulkUploadDropzone } from './BulkUploadDropzone';

export const FileUpload = () => {
  const [open, setOpen] = useState(false);
  // Array of the user uploaded files with associated errors
  const [files, setFiles] = useState<UploadableFile[]>([]);

  const [mimeTypeFormDatas, setMimeTypeFormDatas] = useState<FileTypeOptionsState>({});

  const { isLoading: isTypesLoading } = useGetFileTypes(); // Ensure types are prefetched to mime lookup works

  const uploadFiles = () => {
    files
      .filter((file) => !file.done)
      .forEach(async ({ file, rename, mimeType }, index) => {
        const data: DatasetPostBodyBody = {
          dataset_file: file,
          dataset_type: mimeType,
          as_filename: rename ?? file.name,
          format_extra_variables: mimeTypeFormDatas[mimeType]
            ? JSON.stringify(mimeTypeFormDatas[mimeType])
            : undefined,
        };

        try {
          const response = await uploadDataset(data, {
            onUploadProgress: (progressEvent: ProgressEvent) => {
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
          const error = err as AxiosError<DMError>;
          if (error.isAxiosError) {
            const data = error.response?.data;

            const updatedFiles = [...files];
            updatedFiles[index].errors.push({
              message: data?.error ?? 'Unknown error',
              code: (error.response?.status ?? '').toString(),
            });
            setFiles(updatedFiles);
          }
        }
      });
  };

  return (
    <>
      <IconButton disabled={isTypesLoading} onClick={() => setOpen(true)}>
        <CloudUploadRoundedIcon />
      </IconButton>
      <ModalWrapper
        DialogProps={{ fullScreen: true }}
        id="upload-file"
        open={open}
        submitDisabled={!files.some((file) => !file.done)}
        submitText="Upload"
        title="Upload New Datasets"
        onClose={() => {
          setOpen(false);
          setFiles(files.filter((file) => !file.done));
        }}
        onSubmit={uploadFiles}
      >
        <BulkUploadDropzone files={files} setFiles={setFiles} />
        <FileTypeOptions
          formDatas={mimeTypeFormDatas}
          mimeTypes={Array.from(new Set(files.map((file) => file.mimeType)))}
          onFormChange={setMimeTypeFormDatas}
        />
      </ModalWrapper>
    </>
  );
};
