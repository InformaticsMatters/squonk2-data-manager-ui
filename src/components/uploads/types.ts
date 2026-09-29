import { type FileError } from "react-dropzone";

/**
 * A file a caller has put into an upload form. What the Data Manager has since said about it lives
 * in that upload's own record, so nothing about progress, tasks, or completion is held here.
 */
export interface UploadableFile {
  id: string;
  file: File;
  errors: FileError[];
  rename?: string;
  mimeType: string;
}

export type FileTypeOptionsState = Record<string, any>;
