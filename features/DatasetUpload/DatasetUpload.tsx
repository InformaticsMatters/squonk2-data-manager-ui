import { useState } from "react";

import { type DatasetPostBodyBody, type DmError } from "@squonk/data-manager-client";
import { uploadDataset } from "@squonk/data-manager-client/dataset";
import { useGetFileTypes } from "@squonk/data-manager-client/type";

import { CloudUploadRounded as CloudUploadRoundedIcon } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import { captureException } from "@sentry/nextjs";
import { type AxiosError, type AxiosProgressEvent } from "axios";

import { ModalWrapper } from "../../components/modals/ModalWrapper";
import { FileTypeOptions } from "../../components/uploads/FileTypeOptions";
import { type FileTypeOptionsState, type UploadableFile } from "../../components/uploads/types";
import { useEnqueueError } from "../../hooks/useEnqueueStackError";
import { useSelectedOrganisation } from "../../state/organisationSelection";
import { useSelectedUnit } from "../../state/unitSelection";
import { BulkUploadDropzone } from "./BulkUploadDropzone";

/**
 * Button that controls a modal with UI to upload files to the DM API
 */
export const DatasetUpload = () => {
  const [open, setOpen] = useState(false);
  // Array of the user uploaded files with associated errors
  const [files, setFiles] = useState<UploadableFile[]>([]);

  const [mimeTypeFormDatas, setMimeTypeFormDatas] = useState<FileTypeOptionsState>({});

  // Ensure types are prefetched to mime lookup works
  const { isLoading: isTypesLoading } = useGetFileTypes();

  const [unit] = useSelectedUnit();
  const [organisation] = useSelectedOrganisation();
  const unitOrOrgMissing = !unit || !organisation;

  const { enqueueError } = useEnqueueError();

  const uploadFiles = () => {
    if (organisation && unit) {
      files
        .filter((file) => !file.done)
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
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
            unit_id: unit.id,
          };

          try {
            // Can't use the mutate dataset hook here as it doesn't allow a onUploadProgress callback
            const response = await uploadDataset(data, {
              onUploadProgress: (progressEvent: AxiosProgressEvent) => {
                if (progressEvent.total) {
                  const progress = Math.floor((progressEvent.loaded * 100) / progressEvent.total);
                  const updatedFiles = [...files];
                  updatedFiles[index] = { ...updatedFiles[index], progress };

                  setFiles(updatedFiles);
                }
              },
            });

            // A successful request will have a taskId
            if (response.task_id) {
              const updatedFiles = [...files];
              updatedFiles[index].taskId = response.task_id;
              setFiles(updatedFiles);
            }
          } catch (error_) {
            const error = error_ as AxiosError<DmError>;
            if (error.isAxiosError) {
              const data = error.response?.data;

              // Add the error to the array of files
              const updatedFiles = [...files];
              const errorMessage = data?.error ?? "Unknown error";
              updatedFiles[index].errors.push({
                message: errorMessage,
                code: (error.response?.status ?? "").toString(),
              });
              setFiles(updatedFiles);
              enqueueError(errorMessage);
            } else {
              captureException(error_);
              enqueueError("Unknown error");
            }
          }
        });
    }
  };

  return (
    <>
      <Tooltip title={unitOrOrgMissing ? "Select an organisation and unit" : "Upload dataset"}>
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
          mimeTypes={[...new Set(files.map((file) => file.mimeType))]}
          onFormChange={setMimeTypeFormDatas}
        />
      </ModalWrapper>
    </>
  );
};
