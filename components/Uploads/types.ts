import type { FileError } from 'react-dropzone';

export interface UploadableFile {
  id: string;
  taskId: string | null;
  file: File;
  errors: FileError[];
  progress: number;
  rename?: string;
  mimeType: string;
  done: boolean;
}

export interface FileTypeOptionsState {
  [mimeType: string]: any;
}
