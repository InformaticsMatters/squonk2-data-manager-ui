import { FileError } from 'react-dropzone';

export interface UploadableFile {
  id: string;
  taskId: string | null;
  file: File;
  errors: FileError[];
  progress: number;
  rename?: string;
  mimeType: string;
}

export interface FileTypeOptionsState {
  [mimeType: string]: any;
}
