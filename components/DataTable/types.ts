export interface ColumnTypes {
  fileName: string;
  owner: string;
  immutable?: boolean;
  actions: string;
}

export type Column = { name: keyof ColumnTypes; title: string };

export interface ActionArguments {
  projectId: string;
  changePath?: (path: string) => void;
}

// TODO: can probably type this using the never type
export interface Row {
  id?: string; // Optional for directories
  fileName: string; // Value to display in the table - name of file or directory
  owner?: string; // Optional for directories
  editors?: string[]; // Optional for directories
  published?: string; // Optional for directories
  path: string;
  fullPath: string | null;
  actions: Partial<ActionArguments>;
  immutable?: boolean;
}

export interface TableRow extends Row {
  items: TableRow[] | null;
}
