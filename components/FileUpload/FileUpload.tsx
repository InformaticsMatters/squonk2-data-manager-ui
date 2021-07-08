import React, { useState } from 'react';

import { AxiosError } from 'axios';

import { IconButton } from '@material-ui/core';
import CloudUploadRoundedIcon from '@material-ui/icons/CloudUploadRounded';
import {
  customInstance,
  DatasetPostBodyBody,
  DatasetPutPostResponse,
} from '@squonk/data-manager-client';
import { useGetFileTypes } from '@squonk/data-manager-client/type';

import { ModalWrapper } from '../Modals/ModalWrapper';
import { FileTypeOptions } from '../Uploads/FileTypeOptions';
import { FileTypeOptionsState, UploadableFile } from '../Uploads/types';
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
        submitDisabled={!files.some((file) => !file.done)}
        id="upload-file"
        title="Upload New Datasets"
        submitText="Upload"
        open={open}
        onClose={() => {
          setOpen(false);
          setFiles(files.filter((file) => !file.done));
        }}
        onSubmit={uploadFiles}
        DialogProps={{ fullScreen: true }}
      >
        <BulkUploadDropzone files={files} setFiles={setFiles} />
        <FileTypeOptions
          mimeTypes={Array.from(new Set(files.map((file) => file.mimeType)))}
          formDatas={mimeTypeFormDatas}
          onFormChange={setMimeTypeFormDatas}
        />
      </ModalWrapper>
    </>
  );
};
