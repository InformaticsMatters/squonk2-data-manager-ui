export interface ColumnTypes {
  fileName: string;
  owner: string;
  mode?: boolean;
  actions: string;
}

export type Column = { name: keyof ColumnTypes; title: string };

// Both files are folders have these
interface BaseTableRow {
  fileName: string;
}

// Properties of datasets only
export interface TableDataset extends BaseTableRow {
  id: string;
  owner: string;
  editors: string[];
  published: string;
}

// Properties of files only
export interface TableFile extends BaseTableRow {
  fullPath: string;
  id?: string;
  owner: string;
  immutable?: boolean;
  actions: { projectId: string };
}

// Properties of folders only
export interface TableDir extends BaseTableRow {
  fullPath: string;
  path: string;
  actions: { changePath: (path: string) => void };
}

export type Row = TableDataset | TableFile | TableDir;
