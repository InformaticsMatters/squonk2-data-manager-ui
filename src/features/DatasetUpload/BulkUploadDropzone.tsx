import { Grid } from "@mui/material";

import { Dropzone } from "../../components/uploads/Dropzone";
import { type UploadableFile } from "../../components/uploads/types";
import {
  type DatasetUploadRecord,
  datasetUploadRecordOf,
  type DatasetUploadRecords,
} from "../../datasets/uploadLifecycle";
import { SingleFileUploadWithProgress } from "./SingleFileUploader";

export interface BulkUploadDropzoneProps {
  files: UploadableFile[];
  records: DatasetUploadRecords;
  /** Called with newly dropped files, which are appended to the batch. */
  onNewFiles: (newFiles: UploadableFile[]) => void;
  onDelete: (fileId: string) => void;
  onFileChange: (fileId: string, change: Partial<UploadableFile>) => void;
  onRetry: (fileId: string) => void;
  onSettled: (fileId: string, settled: DatasetUploadRecord) => void;
}

/**
 * Drag-and-drop file upload with options to rename and choose a mime-type. Every row is addressed
 * by the file's own identity rather than its position, so a row never edits the file that happens
 * to have moved into its place.
 */
export const BulkUploadDropzone = ({
  files,
  onDelete,
  onFileChange,
  onNewFiles,
  onRetry,
  onSettled,
  records,
}: BulkUploadDropzoneProps) => (
  <Dropzone files={files} onNewFiles={onNewFiles}>
    <Grid container spacing={1} sx={{ flexDirection: "column" }}>
      {files.map((fileWrapper) => (
        <Grid key={fileWrapper.id}>
          <SingleFileUploadWithProgress
            changeMimeType={(mimeType) => onFileChange(fileWrapper.id, { mimeType })}
            errors={fileWrapper.errors}
            fileWrapper={fileWrapper}
            record={datasetUploadRecordOf(records, fileWrapper.id)}
            rename={(rename) => onFileChange(fileWrapper.id, { rename })}
            onDelete={onDelete}
            onRetry={onRetry}
            onSettled={onSettled}
          />
        </Grid>
      ))}
    </Grid>
  </Dropzone>
);
