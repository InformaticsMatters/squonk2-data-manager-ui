import { FC } from 'react';

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

import { CustomCell } from './CustomCell';
import { useSelectedFiles } from './FileSelectionContext';
import { Column, Row } from './types';

const columns: Column[] = [
  { name: 'fileName', title: 'File Name' },
  { name: 'owner', title: 'Owner' },
  { name: 'immutable', title: 'Immutable' },
  { name: 'actions', title: 'Actions' },
];

export interface DataTableProps {
  rows: Row[];
}

export const DataTable: FC<DataTableProps> = ({ rows }) => {
  const state = useSelectedFiles();

  const handleSelectionChange = (selection: (string | number)[]) => {
    if (state) {
      state.updateSelectedFiles(selection as string[]);
    }
  };

  return (
    <Grid columns={columns} getRowId={(row: Row) => row.fullPath ?? row.id ?? ''} rows={rows}>
      <SearchState />
      {state && (
        <SelectionState selection={state.selectedFiles} onSelectionChange={handleSelectionChange} />
      )}
      <SortingState />

      <IntegratedFiltering />
      {state && <IntegratedSelection />}
      <IntegratedSorting />

      <VirtualTable cellComponent={CustomCell} />
      <TableHeaderRow showSortingControls />
      {state && <TableSelection showSelectAll />}
      <Toolbar />
      <SearchPanel />
    </Grid>
  );
};
