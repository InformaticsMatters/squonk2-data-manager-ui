import type { FilePathFile } from '@squonk/data-manager-client';

interface BaseTableRow {
  fileName: string;
}

// Properties of files only
interface BaseTableFile extends Omit<FilePathFile, 'file_name'> {
  fullPath: string;
}

export type TableFile = BaseTableFile & BaseTableRow;

// Properties of folders only
interface BaseTableDir extends BaseTableRow {
  fullPath: string;
  path: string;
  owner?: never;
}

export type TableDir = BaseTableDir & BaseTableRow;
