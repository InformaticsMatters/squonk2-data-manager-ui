export interface ColumnTypes {
  fileName: string;
  file_path: string;
  owner: string;
  actions: string;
}

export type Column = { name: keyof ColumnTypes; title: string };

export interface ActionArguments {
  projectId: string;
}

export interface Row {
  id: string;
  fileName: string;
  owner?: string; // ? Folders won't have these?
  editors?: string[]; // ? Folders won't have these?
  published?: string; // ? Folders won't have these?
  path: string | null;
  actions: Partial<ActionArguments>;
}

export interface TableRow extends Row {
  items: TableRow[] | null;
}

export interface DataTableProps {
  rows: Row[];
}
