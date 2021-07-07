import { DatasetDetail, FilePathFile } from '@squonk/data-manager-client';

export interface ColumnTypes {
  fileName: string;
  owner: string;
  mode?: boolean;
  actions: string;
  numberOfVersions: number;
}

export type Column = { name: keyof ColumnTypes; title: string };

// Both files are folders have these
interface BaseTableRow {
  fileName: string;
}

// Properties of datasets only
export type TableDataset = DatasetDetail & BaseTableRow;

// Properties of files only
interface BaseTableFile extends Omit<FilePathFile, 'file_name'> {
  fullPath: string;
  actions: { projectId: string };
}

export type TableFile = BaseTableFile & BaseTableRow;

// Properties of folders only
interface BaseTableDir extends BaseTableRow {
  fullPath: string;
  path: string;
  actions: { changePath: (path: string) => void };
}

export type TableDir = BaseTableDir & BaseTableRow;

export type Row = TableDataset | TableFile | TableDir;
