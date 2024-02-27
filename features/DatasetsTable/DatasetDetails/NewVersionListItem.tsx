import { useCallback, useState } from "react";

import type { DatasetSummary } from "@squonk/data-manager-client";
import { getGetDatasetsQueryKey, uploadDataset } from "@squonk/data-manager-client/dataset";

import { BackupRounded as BackupRoundedIcon } from "@mui/icons-material";
import type { IconButtonProps } from "@mui/material";
import {
  IconButton,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
  Typography,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import type { AxiosProgressEvent } from "axios";

import { ModalWrapper } from "../../../components/modals/ModalWrapper";
import { Dropzone } from "../../../components/uploads/Dropzone";
import { FileTypeOptions } from "../../../components/uploads/FileTypeOptions";
import { ProgressBar } from "../../../components/uploads/ProgressBar";
import type { FileTypeOptionsState, UploadableFile } from "../../../components/uploads/types";
import { useSelectedOrganisation } from "../../../state/organisationSelection";
import { useSelectedUnit } from "../../../state/unitSelection";

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

  const [unit] = useSelectedUnit();
  const [organisation] = useSelectedOrganisation();

  const onDone = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getGetDatasetsQueryKey() });
    setFile(undefined);
    setOpen(false);
  }, [queryClient]);

  return (
    <>
      <ListItemButton onClick={() => setOpen(true)}>
        <ListItemText primary="Create a New Version of this Dataset" />
        <ListItemSecondaryAction>
          <IconButton edge="end" size="large" onClick={() => setOpen(true)}>
            <BackupRoundedIcon />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItemButton>

      <ModalWrapper
        DialogProps={{ maxWidth: "sm", fullWidth: true }}
        id={`version-upload-${dataset.dataset_id}`}
        open={open}
        submitDisabled={!file || !!file.taskId}
        submitText="Upload"
        title={`Upload a New Version to ${datasetName}`}
        onClose={() => setOpen(false)}
        onSubmit={async () => {
          const parentVersion = Math.max(...dataset.versions.map((v) => v.version));
          const parent = dataset.versions.find((version) => version.version === parentVersion);
          if (file && parent && organisation && unit) {
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
                unit_id: unit.id,
              },
              {
                onUploadProgress: (progressEvent: AxiosProgressEvent) => {
                  if (progressEvent.total) {
                    const progress = Math.floor((progressEvent.loaded * 100) / progressEvent.total);
                    setFile({ ...file, progress });
                  }
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
            onDone={onDone}
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
