import React, { FC } from 'react';

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
  TableColumnResizing,
  TableHeaderRow,
  TableSelection,
  Toolbar,
  VirtualTable,
} from '@devexpress/dx-react-grid-material-ui';

import { CustomCell } from './CustomCell';
import { useSelectedFiles } from './FileSelectionContext';
import { Column, Row } from './types';
import { isDataset } from './utils';

export interface DataTableProps {
  columns: Column[];
  rows: Row[];
}

export const DataTable: FC<DataTableProps> = ({ columns, rows }) => {
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
      <TableColumnResizing
        defaultColumnWidths={columns.map((col) => ({
          columnName: col.name,
          width: (0.95 * 1280) / columns.length,
        }))}
        resizingMode="nextColumn"
      />
      <TableHeaderRow showSortingControls />
      {state && <TableSelection showSelectAll />}
      <Toolbar />
      <SearchPanel />
    </Grid>
  );
};
