import { type Dispatch, type SetStateAction, useCallback } from "react";

import { Grid } from "@mui/material";

import { Dropzone } from "../../components/uploads/Dropzone";
import { type UploadableFile } from "../../components/uploads/types";
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
  return (
    <Dropzone files={files} onNewFiles={setFiles}>
      <Grid container direction="column" spacing={1}>
        {files.map((fileWrapper, index) => (
          <SingleFile
            file={fileWrapper}
            files={files}
            index={index}
            key={fileWrapper.id}
            setFiles={setFiles}
          />
        ))}
      </Grid>
    </Dropzone>
  );
};

interface SingleFileProps {
  index: number;
  file: UploadableFile;
  /**
   * Called on file delete, mime-type change, file upload finished, and rename actions
   */
  setFiles: Dispatch<SetStateAction<UploadableFile[]>>;
  files: UploadableFile[];
}

const SingleFile = ({ index, file, setFiles, files }: SingleFileProps) => {
  const onDelete = (file: File) => {
    setFiles((curr) => curr.filter((fw) => fw.file !== file));
  };

  const changeToDone = useCallback(() => {
    file.done = true;
    setFiles(mutateAtPosition(files, index, files[index]));
  }, [file, files, index, setFiles]);

  const changeMimeType = (newType: string): void => {
    file.mimeType = newType;
    setFiles(mutateAtPosition(files, index, file));
  };

  const rename = (newName: string): void => {
    file.rename = newName;
    setFiles(mutateAtPosition(files, index, file));
  };

  return (
    <Grid item>
      <SingleFileUploadWithProgress
        changeMimeType={changeMimeType}
        changeToDone={changeToDone}
        errors={file.errors}
        fileWrapper={file}
        rename={rename}
        onDelete={onDelete}
      />
    </Grid>
  );
};
