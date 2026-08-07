import { useCallback, useState } from "react";

import { useGetFileTypes } from "@/api/data-manager/type";

import { CloudUploadRounded as CloudUploadRoundedIcon } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";

import { ModalWrapper } from "../../components/modals/ModalWrapper";
import { FileTypeOptions } from "../../components/uploads/FileTypeOptions";
import { type FileTypeOptionsState, type UploadableFile } from "../../components/uploads/types";
import {
  datasetUploadBatchIsCommitted,
  type DatasetUploadRecord,
  datasetUploadRecordOf,
  type DatasetUploadRecords,
  pendingUploadFileIds,
  resetDatasetUploads,
  retryDatasetUpload,
  withDatasetUploadRecord,
} from "../../datasets/uploadLifecycle";
import { useBillingUnits, useDatasetSubscription } from "../../datasets/useDatasetUploadBilling";
import { useDatasetUploadCommands } from "../../datasets/useDatasetUploadCommands";
import { useEnqueueError } from "../../hooks/useEnqueueStackError";
import { BillingUnitField } from "./BillingUnitField";
import { BulkUploadDropzone } from "./BulkUploadDropzone";
import { MissingSubscriptionAlert } from "./MissingSubscriptionAlert";

/**
 * Button that controls a modal with UI to upload new datasets.
 *
 * The batch names one eligible member unit as its billing context, and each file carries its own
 * request and processing state, so one file's failure neither stops nor is mistaken for another's.
 */
export const DatasetUpload = () => {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<UploadableFile[]>([]);
  const [records, setRecords] = useState<DatasetUploadRecords>({});
  const [mimeTypeFormDatas, setMimeTypeFormDatas] = useState<FileTypeOptionsState>({});

  // Ensure types are prefetched so mime lookup works
  const { isLoading: isTypesLoading } = useGetFileTypes();
  const { capability, choice, chooseUnit, eligible, remember, selected } = useBillingUnits();
  const subscription = useDatasetSubscription(selected);
  const { refreshDatasets, send: sendUpload } = useDatasetUploadCommands();
  const { enqueueError } = useEnqueueError();

  const committed = datasetUploadBatchIsCommitted(records);
  const pendingIds = pendingUploadFileIds(files, records);

  const onSettled = useCallback(
    (fileId: string, settled: DatasetUploadRecord) => {
      setRecords((current) => withDatasetUploadRecord(current, fileId, settled));
      // Datasets only change once the Data Manager has actually finished processing one, so this is
      // the only thing that refreshes the collection, and the only thing that makes a billing unit
      // worth remembering.
      if (settled.kind === "processed") {
        void refreshDatasets();
        if (selected) {
          remember(selected.unit.id);
        }
      }
    },
    [refreshDatasets, remember, selected],
  );

  const sendFile = async (fileWrapper: UploadableFile, unitId: string) => {
    const extraVariables = mimeTypeFormDatas[fileWrapper.mimeType];
    const record = await sendUpload(
      {
        file: fileWrapper.file,
        formatExtraVariables: extraVariables ? JSON.stringify(extraVariables) : undefined,
        mimeType: fileWrapper.mimeType,
        name: fileWrapper.rename ?? fileWrapper.file.name,
        unitId,
      },
      (progress) =>
        setRecords((current) =>
          withDatasetUploadRecord(current, fileWrapper.id, (sending) =>
            // Progress only ever advances a request still in flight, so a file that has already
            // been answered is never dragged back into sending by a late callback.
            sending.kind === "sending" ? { kind: "sending", progress } : sending,
          ),
        ),
    );
    setRecords((current) => withDatasetUploadRecord(current, fileWrapper.id, record));
    if (record.kind === "request-failed") {
      enqueueError(record.reason);
    }
  };

  const send = (fileIds: readonly string[]) => {
    const unitId = selected?.unit.id;
    if (!unitId) {
      return;
    }
    for (const fileId of fileIds) {
      const fileWrapper = files.find(({ id }) => id === fileId);
      if (fileWrapper) {
        setRecords((current) =>
          withDatasetUploadRecord(current, fileId, { kind: "sending", progress: 0 }),
        );
        void sendFile(fileWrapper, unitId);
      }
    }
  };

  const onRetry = (fileId: string) => {
    setRecords((current) => retryDatasetUpload(current, fileId));
    send([fileId]);
  };

  const onDelete = (fileId: string) => {
    const remaining = files.filter(({ id }) => id !== fileId);
    setFiles(remaining);
    setRecords((current) => resetDatasetUploads(current, remaining));
  };

  const onFileChange = (fileId: string, change: Partial<UploadableFile>) => {
    setFiles((current) =>
      current.map((fileWrapper) =>
        fileWrapper.id === fileId ? { ...fileWrapper, ...change } : fileWrapper,
      ),
    );
  };

  const onClose = () => {
    setOpen(false);
    // Files the Data Manager has finished with leave the form; everything else, including a failed
    // file's own reason, is kept so the batch can be retried without being entered again.
    const retained = files.filter(
      ({ id }) => datasetUploadRecordOf(records, id).kind !== "processed",
    );
    setFiles(retained);
    setRecords((current) => resetDatasetUploads(current, retained));
  };

  const uploadIsBlocked =
    !selected || subscription.kind === "missing" || pendingIds.length === 0 || isTypesLoading;

  return (
    <>
      <Tooltip title={capability.status === "enabled" ? "Upload dataset" : capability.reason}>
        <span>
          <IconButton
            aria-label="Upload dataset"
            disabled={capability.status !== "enabled" || isTypesLoading}
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
        submitDisabled={uploadIsBlocked}
        submitText="Upload"
        title="Upload New Datasets"
        onClose={onClose}
        onSubmit={() => send(pendingIds)}
      >
        <BillingUnitField
          choice={choice}
          committed={committed}
          eligible={eligible}
          onChoose={chooseUnit}
        />
        {subscription.kind === "missing" && !!selected && (
          <MissingSubscriptionAlert
            recovery={subscription.recovery}
            unitName={selected.unit.name}
          />
        )}
        <BulkUploadDropzone
          files={files}
          records={records}
          onDelete={onDelete}
          onFileChange={onFileChange}
          onNewFiles={(newFiles) => setFiles((current) => [...current, ...newFiles])}
          onRetry={onRetry}
          onSettled={onSettled}
        />
        <FileTypeOptions
          formDatas={mimeTypeFormDatas}
          mimeTypes={[...new Set(files.map((file) => file.mimeType))]}
          onFormChange={setMimeTypeFormDatas}
        />
      </ModalWrapper>
    </>
  );
};
