import { useState } from 'react';

import type { DatasetPostBodyBody, DmError } from '@squonk/data-manager-client';
import { uploadDataset } from '@squonk/data-manager-client/dataset';
import { useGetFileTypes } from '@squonk/data-manager-client/type';

import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import { IconButton, Tooltip } from '@mui/material';
import type { AxiosError } from 'axios';

import { useCurrentOrg, useCurrentUnit } from '../../context/organisationUnitContext';
import { useEnqueueError } from '../../hooks/useEnqueueStackError';
import { ModalWrapper } from '../modals/ModalWrapper';
import { FileTypeOptions } from '../uploads/FileTypeOptions';
import type { FileTypeOptionsState, UploadableFile } from '../uploads/types';
import { BulkUploadDropzone } from './BulkUploadDropzone';

/**
 * Button that controls a modal with UI to upload files to the DM API
 */
export const FileUpload = () => {
  const [open, setOpen] = useState(false);
  // Array of the user uploaded files with associated errors
  const [files, setFiles] = useState<UploadableFile[]>([]);

  const [mimeTypeFormDatas, setMimeTypeFormDatas] = useState<FileTypeOptionsState>({});

  // Ensure types are prefetched to mime lookup works
  const { isLoading: isTypesLoading } = useGetFileTypes();

  const unit = useCurrentUnit();
  const org = useCurrentOrg();
  const unitOrOrgMissing = !unit || !org;

  const { enqueueError } = useEnqueueError();

  const uploadFiles = () => {
    if (org && unit) {
      files
        .filter((file) => !file.done)
        .forEach(async ({ file, rename, mimeType }, index) => {
          // Prepare the payload for the post request
          const data: DatasetPostBodyBody = {
            dataset_file: file,
            dataset_type: mimeType,
            as_filename: rename ?? file.name,
            format_extra_variables: mimeTypeFormDatas[mimeType]
              ? JSON.stringify(mimeTypeFormDatas[mimeType])
              : undefined,
            skip_molecule_load: false,
            organisation_id: org.id,
            unit_id: unit.id,
          };

          try {
            // Can't use the mutate dataset hook here as it doesn't allow a onUploadProgress callback
            const response = await uploadDataset(data, {
              onUploadProgress: (progressEvent: ProgressEvent) => {
                const progress = Math.floor((progressEvent.loaded * 100) / progressEvent.total);
                const updatedFiles = [...files];
                updatedFiles[index] = { ...updatedFiles[index], progress };

                setFiles(updatedFiles);
              },
            });

            // A successful request will have a taskId
            if (response.task_id) {
              const updatedFiles = [...files];
              updatedFiles[index].taskId = response.task_id;
              setFiles(updatedFiles);
            }
          } catch (err) {
            const error = err as AxiosError<DmError>;
            if (error.isAxiosError) {
              const data = error.response?.data;

              // Add the error to the array of files
              const updatedFiles = [...files];
              const errorMessage = data?.error ?? 'Unknown error';
              updatedFiles[index].errors.push({
                message: errorMessage,
                code: (error.response?.status ?? '').toString(),
              });
              setFiles(updatedFiles);
              enqueueError(errorMessage);
            } else {
              enqueueError('Unknown error'); // TODO: Add Sentry
            }
          }
        });
    }
  };

  return (
    <>
      <Tooltip title={unitOrOrgMissing ? 'Select a organisation and unit' : 'Upload dataset'}>
        <span>
          <IconButton
            disabled={unitOrOrgMissing || isTypesLoading}
            size="large"
            onClick={() => setOpen(true)}
          >
            <CloudUploadRoundedIcon />
          </IconButton>
        </span>
      </Tooltip>
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
