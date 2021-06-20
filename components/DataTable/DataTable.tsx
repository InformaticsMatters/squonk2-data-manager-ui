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
import { isDataset } from './utils';

const columns: Column[] = [
  { name: 'fileName', title: 'File Name' },
  { name: 'owner', title: 'Owner' },
  { name: 'mode', title: 'Mode' },
  { name: 'actions', title: 'Actions' },
  // { name: 'fullPath', title: 'Full Path' },
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

  const getRowID = (row: Row) => {
    if (isDataset(row)) {
      return row.id;
    }
    return row.fullPath;
  };

  return (
    <Grid columns={columns} getRowId={getRowID} rows={rows}>
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
