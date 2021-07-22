import type { DatasetDetail, FilePathFile } from '@squonk/data-manager-client';

// Both files are folders have these
interface BaseTableRow {
  fileName: string;
}

// Properties of datasets only
export type TableDataset = DatasetDetail & BaseTableRow;

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
