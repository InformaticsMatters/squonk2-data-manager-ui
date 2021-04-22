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

import { CustomCell } from './CustomCell';
import { Column, DataTableProps, TableRow } from './types';

const columns: Column[] = [
  { name: 'fileName', title: 'File Name' },
  { name: 'owner', title: 'Owner' },
  { name: 'actions', title: 'Actions' },
];

export const DataTable: React.FC<DataTableProps> = ({ rows }) => {
  // const [selection, setSelection] = useState<React.ReactText[]>([]);

  return (
    <Grid rows={rows} columns={columns} getRowId={(row) => row.id}>
      <SearchState />
      {/* <SelectionState selection={selection} onSelectionChange={setSelection} /> */}
      <SortingState />

      <TreeDataState />
      <CustomTreeData
        getChildRows={(row: TableRow, rootRows: TableRow[]) => (row ? row.items : rootRows)}
      />

      <IntegratedFiltering />
      {/* <IntegratedSelection /> */}
      <IntegratedSorting />

      <VirtualTable cellComponent={CustomCell} />
      <TableHeaderRow showSortingControls />
      {/* <TableSelection showSelectAll /> */}
      <TableTreeColumn for="fileName" />
      <Toolbar />
      <SearchPanel />
    </Grid>
  );
};
