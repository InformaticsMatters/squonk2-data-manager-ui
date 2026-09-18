import { useCallback, useState } from "react";

import { type DatasetSummary, type DatasetVersionSummary } from "@/api/data-manager";

import { BackupRounded as BackupRoundedIcon } from "@mui/icons-material";
import { List, ListItemButton, ListItemIcon, ListItemText, Typography } from "@mui/material";

import { ModalWrapper } from "../../../components/modals/ModalWrapper";
import { Dropzone } from "../../../components/uploads/Dropzone";
import { FileTypeOptions } from "../../../components/uploads/FileTypeOptions";
import { type FileTypeOptionsState, type UploadableFile } from "../../../components/uploads/types";
import {
  type DatasetFactsFreshness,
  evaluateDatasetVersionUploadCapability,
} from "../../../datasets/capabilities";
import {
  datasetUploadIsSendable,
  type DatasetUploadRecord,
} from "../../../datasets/uploadLifecycle";
import { useDatasetUploadCommands } from "../../../datasets/useDatasetUploadCommands";
import { useDatasetUploadState } from "../../../datasets/useDatasetUploadState";
import { useDatasetVersionBilling } from "../../../datasets/useDatasetVersionBilling";
import { versionUploadInput } from "../../../datasets/versionBilling";
import { useEnqueueError } from "../../../hooks/useEnqueueStackError";
import { DatasetUploadProgress } from "../../DatasetUpload/DatasetUploadProgress";
import { InheritedBillingUnitField } from "../../DatasetUpload/InheritedBillingUnitField";

export interface NewVersionListItemProps {
  caller: { username?: string };
  /**
   * Dataset a version will be created under.
   */
  dataset: DatasetSummary;
  /**
   * Name of the dataset.
   */
  datasetName: string;
  freshness: DatasetFactsFreshness;
  /**
   * The dataset's latest version, whose filename, type, and billing the new one succeeds. Absent
   * for a dataset the Data Manager reports no version of, which there is nothing to succeed.
   */
  parent?: DatasetVersionSummary;
}

const idle: DatasetUploadRecord = { kind: "idle" };

const noVersion = {
  reason: "This dataset has no version for a new one to succeed.",
  status: "disabled",
} as const;

/**
 * MuiListItem with an action that lets the user upload a new file to become a new version of this
 * dataset.
 *
 * The new version succeeds the dataset's latest version: it keeps that version's filename and type,
 * its authority is the authority over that version, and it is billed to the unit the dataset
 * already belongs to, which is shown and never chosen. No selected unit or organisation is read
 * here, so the unit a version is billed to is the dataset's own whatever the rest of the shell
 * happens to be showing.
 *
 * The upload's own task is watched here rather than inside the dialog, so closing the form does not
 * abandon work the Data Manager is still doing.
 */
export const NewVersionListItem = ({
  caller,
  dataset,
  datasetName,
  freshness,
  parent,
}: NewVersionListItemProps) => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<UploadableFile>();
  const [record, setRecord] = useState<DatasetUploadRecord>(idle);
  // Per-file-type options for the new version, entered against the type it inherits.
  const [optionsFormData, setOptionsFormData] = useState<FileTypeOptionsState>({});

  const inherited = useDatasetVersionBilling(dataset.dataset_id);
  const { refreshDatasets, send: sendUpload } = useDatasetUploadCommands();
  const { enqueueError } = useEnqueueError();

  const onSettled = useCallback(
    (_uploadId: string, settled: DatasetUploadRecord) => {
      setRecord(settled);
      // The dataset only gained a version once the Data Manager actually finished processing one,
      // so this is the only thing that refreshes the canonical dataset and version data.
      if (settled.kind === "processed") {
        void refreshDatasets();
      }
    },
    [refreshDatasets],
  );

  const state = useDatasetUploadState({ onSettled, record, uploadId: file?.id ?? "" });

  const capability = parent
    ? evaluateDatasetVersionUploadCapability({
        billing: inherited,
        caller,
        dataset,
        freshness,
        // Authority over the version being succeeded, not over whichever version is on screen.
        version: parent,
      })
    : noVersion;
  /** Work the Data Manager is already holding, which nothing in this form may replace or resend. */
  const inFlight = record.kind === "sending" || record.kind === "accepted";

  const send = async () => {
    const unitId = inherited.kind === "resolved" ? inherited.unitId : undefined;
    // Sending is decided by the upload's own record, so neither a submission nor a retry can enter
    // work the Data Manager has already accepted or finished.
    if (!file || !parent || !unitId || !datasetUploadIsSendable(record)) {
      return;
    }
    setRecord({ kind: "sending", progress: 0 });
    const settled = await sendUpload(
      versionUploadInput({
        datasetId: dataset.dataset_id,
        file: file.file,
        formatExtraVariables: optionsFormData,
        parent,
        unitId,
      }),
      (progress) =>
        // Progress only ever advances a request still in flight, so an upload that has already
        // been answered is never dragged back into sending by a late callback.
        setRecord((sending) =>
          sending.kind === "sending" ? { kind: "sending", progress } : sending,
        ),
    );
    setRecord(settled);
    if (settled.kind === "request-failed") {
      enqueueError(settled.reason);
    }
  };

  const onClose = () => {
    setOpen(false);
    // A version the Data Manager finished with leaves the form; anything else, including a failed
    // upload's own reason, is kept so it can be retried without being entered again.
    if (record.kind === "processed") {
      setFile(undefined);
      setRecord(idle);
      setOptionsFormData({});
    }
  };

  return (
    <List>
      {/* Unavailable is stated where the action is, so a caller learns what is missing rather than
          finding nothing at all. */}
      <ListItemButton disabled={capability.status !== "enabled"} onClick={() => setOpen(true)}>
        <ListItemText
          primary="Create a New Version of this Dataset"
          secondary={capability.status === "disabled" ? capability.reason : undefined}
        />
        <ListItemIcon>
          <BackupRoundedIcon />
        </ListItemIcon>
      </ListItemButton>

      <ModalWrapper
        DialogProps={{ maxWidth: "sm", fullWidth: true }}
        id={`version-upload-${dataset.dataset_id}`}
        open={open}
        submitDisabled={
          !file || capability.status !== "enabled" || !datasetUploadIsSendable(record)
        }
        submitText="Upload"
        title={`Upload a New Version to ${datasetName}`}
        onClose={onClose}
        onSubmit={() => void send()}
      >
        <InheritedBillingUnitField inherited={inherited} />
        {/* An upload the Data Manager is holding is never abandoned by a second file, so nothing
            can be dropped over it until it has answered. */}
        <Dropzone
          disabled={inFlight}
          files={file ? [file] : []}
          multiple={false}
          onNewFiles={(files) => {
            setFile(files[0]);
            setRecord(idle);
          }}
        />
        <Typography variant="subtitle1">
          <b>Selected File</b>
        </Typography>
        {!!file?.file.name && (
          <Typography>
            Name: <i>{file.file.name}</i>
          </Typography>
        )}
        {!!parent && (
          <Typography color="text.secondary" variant="body2">
            Uploaded as <i>{parent.file_name}</i>, succeeding version {parent.version}.
          </Typography>
        )}

        {!!file && (
          <>
            <DatasetUploadProgress
              name={file.file.name}
              record={record}
              state={state}
              onRetry={() => void send()}
            />
            {file.errors.map((error) => (
              <Typography color="error" key={`${error.code}-${error.message}`}>
                {error.message}
              </Typography>
            ))}
            {!!parent && (
              <FileTypeOptions
                column
                formDatas={optionsFormData}
                mimeTypes={[parent.type]}
                onFormChange={setOptionsFormData}
              />
            )}
          </>
        )}
      </ModalWrapper>
    </List>
  );
};
