import type { FC } from 'react';
import React, { useState } from 'react';
import { useQueryClient } from 'react-query';

import { getGetDatasetsQueryKey, uploadDataset } from '@squonk/data-manager-client/dataset';

import type { IconButtonProps } from '@material-ui/core';
import { IconButton, Tooltip, Typography } from '@material-ui/core';
import BackupRoundedIcon from '@material-ui/icons/BackupRounded';

import { ModalWrapper } from '../../../Modals/ModalWrapper';
import { Dropzone } from '../../../Uploads/Dropzone';
import { FileTypeOptions } from '../../../Uploads/FileTypeOptions';
import { ProgressBar } from '../../../Uploads/ProgressBar';
import type { FileTypeOptionsState, UploadableFile } from '../../../Uploads/types';
import type { TableDataset } from '../../types';

interface NewVersionButtonProps extends IconButtonProps {
  dataset: TableDataset;
}

export const NewVersionButton: FC<NewVersionButtonProps> = ({ dataset, ...buttonProps }) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<UploadableFile>();

  const [optionsFormData, setOptionsFormData] = useState<FileTypeOptionsState>({});

  return (
    <>
      <Tooltip title="Upload a new version of this dataset">
        <IconButton {...buttonProps} onClick={() => setOpen(true)}>
          <BackupRoundedIcon />
        </IconButton>
      </Tooltip>
      <ModalWrapper
        DialogProps={{ maxWidth: 'sm', fullWidth: true }}
        id={`version-upload-${dataset.dataset_id}`}
        open={open}
        submitDisabled={!file || !!file.taskId}
        submitText="Upload"
        title={`Upload a New Version to ${dataset.fileName}`}
        onClose={() => setOpen(false)}
        onSubmit={async () => {
          const parentVersion = Math.max(...dataset.versions.map((v) => v.version));
          const parent = dataset.versions.find((version) => version.version === parentVersion);
          if (file && parent) {
            const response = await uploadDataset(
              {
                dataset_file: file.file,
                dataset_type: parent.type,
                as_filename: parent.file_name,
                parent_id: dataset.dataset_id,
                parent_version: parentVersion,
                format_extra_variables: optionsFormData[parent.type]
                  ? JSON.stringify(optionsFormData[parent.type])
                  : undefined,
              },
              {
                onUploadProgress: (progressEvent: ProgressEvent) => {
                  const progress = Math.floor((progressEvent.loaded * 100) / progressEvent.total);
                  setFile({ ...file, progress });
                },
              },
            );
            setFile({ ...file, taskId: response.task_id });
          }
        }}
      >
        <Dropzone
          files={file ? [file] : []}
          multiple={false}
          setFiles={(files) => setFile(files[0])}
        />
        <Typography variant="subtitle1">
          <b>Selected File</b>
        </Typography>
        {!!file?.file.name && (
          <Typography>
            Name: <i>{file.file.name}</i>
          </Typography>
        )}

        {file && (
          <ProgressBar
            errors={file.errors}
            progress={file.progress}
            taskId={file.taskId}
            onDone={() => {
              queryClient.invalidateQueries(getGetDatasetsQueryKey());
              setFile(undefined);
              setOpen(false);
            }}
          />
        )}
        {file && (
          <FileTypeOptions
            column
            formDatas={optionsFormData}
            mimeTypes={[file.mimeType]}
            onFormChange={setOptionsFormData}
          />
        )}
      </ModalWrapper>
    </>
  );
};
