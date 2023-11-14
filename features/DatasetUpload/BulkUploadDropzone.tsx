import type { Dispatch, SetStateAction } from "react";

import { Grid } from "@mui/material";

import { Dropzone } from "../../components/uploads/Dropzone";
import type { UploadableFile } from "../../components/uploads/types";
import { mutateAtPosition } from "../../utils/app/files";
import { SingleFileUploadWithProgress } from "./SingleFileUploader";

export interface BulkUploadDropzoneProps {
  /**
   * Array of files their metadata
   */
  files: UploadableFile[];
  /**
   * Called on file delete, mime-type change, file upload finished, and rename actions
   */
  setFiles: Dispatch<SetStateAction<UploadableFile[]>>;
}

/**
 * Drag-and-drop file upload with options to rename and choose a mime-type. It also displays upload
 * and processing progress.
 */
export const BulkUploadDropzone = ({ files, setFiles }: BulkUploadDropzoneProps) => {
  const onDelete = (file: File) => {
    setFiles((curr) => curr.filter((fw) => fw.file !== file));
  };

  return (
    <Dropzone files={files} onNewFiles={setFiles}>
      <Grid container direction="column" spacing={1}>
        {files.map((fileWrapper, index) => (
          <Grid item key={fileWrapper.id}>
            <SingleFileUploadWithProgress
              changeMimeType={(newType) => {
                files[index].mimeType = newType;
                setFiles(mutateAtPosition(files, index, files[index]));
              }}
              changeToDone={() => {
                files[index].done = true;
                setFiles(mutateAtPosition(files, index, files[index]));
              }}
              errors={fileWrapper.errors}
              fileWrapper={fileWrapper}
              rename={(newName) => {
                files[index].rename = newName;
                setFiles(mutateAtPosition(files, index, files[index]));
              }}
              onDelete={onDelete}
            />
          </Grid>
        ))}
      </Grid>
    </Dropzone>
  );
};
