import React from 'react';

import {
  CustomTreeData,
  IntegratedFiltering,
  IntegratedSorting,
  SearchState,
  SortingState,
  TreeDataState,
} from '@devexpress/dx-react-grid';
import {
  Grid,
  SearchPanel,
  TableHeaderRow,
  TableTreeColumn,
  Toolbar,
  VirtualTable,
} from '@devexpress/dx-react-grid-material-ui';



interface ColumnTypes {
  fileName: string;
  file_path: string;
  owner: string;
  actions: string;
}

type Column = { name: keyof ColumnTypes; title: string };

const columns: Column[] = [
  { name: 'fileName', title: 'File Name' },
  { name: 'owner', title: 'Owner' },
  { name: 'actions', title: 'Actions' },
];

export interface Row {
  id: string;
  fileName: string;
  owner?: string; // ? Folders won't have these?
  editors?: string[]; // ? Folders won't have these?
  published?: string; // ? Folders won't have these?
  path: string | null;
}

export interface TableRow extends Row {
  items: TableRow[] | null;
}

interface DataTableProps {
  rows: Row[];
}

export const DataTable: React.FC<DataTableProps> = ({ rows }) => {
  // const [selection, setSelection] = useState<React.ReactText[]>([]);

  return (
    <Grid rows={rows} columns={columns} getRowId={(row) => row.id}>
      <SearchState />
      {/* <SelectionState selection={selection} onSelectionChange={setSelection} /> */}
      <SortingState />

      <TreeDataState />
      <CustomTreeData
        getChildRows={(row: TableRow, rootRows: TableRow[]) => {
          // console.log(row);
          // if (row === null) return rootRows;

          // return row?.items ?? [];

          return row ? row.items : rootRows;
        }}
      />

      <IntegratedFiltering />
      {/* <IntegratedSelection /> */}
      <IntegratedSorting />

      <VirtualTable />
      <TableHeaderRow showSortingControls />
      {/* <TableSelection showSelectAll /> */}
      <TableTreeColumn for="fileName" />
      <Toolbar />
      <SearchPanel />
    </Grid>
  );
};
