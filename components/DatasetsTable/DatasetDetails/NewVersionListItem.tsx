import { useState } from 'react';
import { useQueryClient } from 'react-query';

import type { DatasetSummary } from '@squonk/data-manager-client';
import { getGetDatasetsQueryKey, uploadDataset } from '@squonk/data-manager-client/dataset';

import type { IconButtonProps } from '@material-ui/core';
import { IconButton } from '@material-ui/core';
import { ListItem, ListItemSecondaryAction, ListItemText } from '@material-ui/core';
import { Typography } from '@material-ui/core';
import BackupRoundedIcon from '@material-ui/icons/BackupRounded';

import { useCurrentOrg, useCurrentUnit } from '../../../context/organisationUnitContext';
import { ModalWrapper } from '../../modals/ModalWrapper';
import { Dropzone } from '../../uploads/Dropzone';
import { FileTypeOptions } from '../../uploads/FileTypeOptions';
import { ProgressBar } from '../../uploads/ProgressBar';
import type { FileTypeOptionsState, UploadableFile } from '../../uploads/types';

export interface NewVersionListItemProps extends IconButtonProps {
  /**
   * Dataset from the table a versioned will be created under.
   */
  dataset: DatasetSummary;
  /**
   * Name of the dataset.
   */
  datasetName: string;
}

/**
 * MuiListItem with an action that lets the user upload a new file to become a new version of this
 * dataset.
 */
export const NewVersionListItem = ({ dataset, datasetName }: NewVersionListItemProps) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<UploadableFile>();

  // State to track per-file-type options for the new dataset version
  const [optionsFormData, setOptionsFormData] = useState<FileTypeOptionsState>({});

  const unit = useCurrentUnit();
  const org = useCurrentOrg();

  return (
    <>
      <ListItem button onClick={() => setOpen(true)}>
        <ListItemText primary="Create a New Version of this Dataset" />
        <ListItemSecondaryAction>
          <IconButton edge="end" onClick={() => setOpen(true)}>
            <BackupRoundedIcon />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>

      <ModalWrapper
        DialogProps={{ maxWidth: 'sm', fullWidth: true }}
        id={`version-upload-${dataset.dataset_id}`}
        open={open}
        submitDisabled={!file || !!file.taskId}
        submitText="Upload"
        title={`Upload a New Version to ${datasetName}`}
        onClose={() => setOpen(false)}
        onSubmit={async () => {
          const parentVersion = Math.max(...dataset.versions.map((v) => v.version));
          const parent = dataset.versions.find((version) => version.version === parentVersion);
          if (file && parent && org && unit) {
            // For consistency with the main file upload, I don't use the mutation hook here. This
            // allows reliable upload progress tracking.
            const response = await uploadDataset(
              {
                dataset_file: file.file,
                dataset_type: parent.type,
                as_filename: parent.file_name,
                dataset_id: dataset.dataset_id,
                format_extra_variables: optionsFormData[parent.type]
                  ? JSON.stringify(optionsFormData[parent.type])
                  : undefined,
                organisation_id: org.id,
                unit_id: unit.id,
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
          onNewFiles={(files) => setFile(files[0])}
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
