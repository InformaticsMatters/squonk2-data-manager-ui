import React, { useState } from 'react';

import {
  IntegratedFiltering,
  IntegratedSelection,
  IntegratedSorting,
  SearchState,
  SelectionState,
  SortingState,
} from '@devexpress/dx-react-grid';
import {
  Grid,
  SearchPanel,
  TableHeaderRow,
  TableSelection,
  Toolbar,
  VirtualTable,
} from '@devexpress/dx-react-grid-material-ui';

interface ColumnTypes {
  file_name: string;
  file_path: string;
  type: string;
}

type Column = { name: keyof ColumnTypes; title: string };

const columns: Column[] = [
  { name: 'file_name', title: 'File Name' },
  { name: 'file_path', title: 'Path' },
  { name: 'type', title: 'Type' },
];

interface DataTableProps {
  files: any[];
}

const DataTable: React.FC<DataTableProps> = ({ files }) => {
  const [selection, setSelection] = useState<React.ReactText[]>([]);

  return (
    <Grid rows={files} columns={columns} getRowId={(row) => row.file_id}>
      <SearchState defaultValue="" />
      <SelectionState selection={selection} onSelectionChange={setSelection} />
      <SortingState />

      <IntegratedFiltering />
      <IntegratedSelection />
      <IntegratedSorting />

      <VirtualTable />
      <TableHeaderRow showSortingControls />
      <TableSelection showSelectAll />
      <Toolbar />
      <SearchPanel />
    </Grid>
  );
};

export default DataTable;
