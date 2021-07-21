import React, { ReactNode, useEffect } from 'react';
import {
  CellProps,
  Column,
  IdType,
  PluginHook,
  useGlobalFilter,
  useRowSelect,
  useSortBy,
  useTable,
} from 'react-table';

import { css } from '@emotion/react';
import {
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
} from '@material-ui/core';
import Toolbar from '@material-ui/core/Toolbar';
import SearchRoundedIcon from '@material-ui/icons/SearchRounded';

import { IndeterminateCheckbox } from './IndeterminateCheckbox';
import { TableDataset } from './types';

type Selection<Data> = Record<IdType<Data>, boolean>;
export interface DataTableProps<Data extends Record<string, any>> {
  columns: Column<Data>[];
  data: Data[];
  ToolbarChild?: ReactNode;
  getRowId?: (row: Data) => IdType<Data>;
  initialSelection?: IdType<Data>[];
  updateSelection?: (selectedIds: IdType<Data>[]) => void;
  useActionsColumnPlugin?: PluginHook<Data>;
}

export function DataTable<Data extends Record<string, any>>({
  columns,
  data,
  ToolbarChild,
  getRowId,
  initialSelection,
  updateSelection,
  useActionsColumnPlugin = () => {
    // Do nothing
  },
}: DataTableProps<Data>) {
  const {
    getTableProps,
    headerGroups,
    rows,
    prepareRow,
    preGlobalFilteredRows,
    setGlobalFilter,
    state: { selectedRowIds, globalFilter },
  } = useTable(
    {
      columns,
      data,
      getRowId,
      initialState: {
        selectedRowIds: (initialSelection
          ? Object.fromEntries(initialSelection.map((id) => [id, true]))
          : {}) as Selection<Data>,
      },
    },
    useGlobalFilter,
    useSortBy,
    useRowSelect,
    useActionsColumnPlugin, // Option to add an actions column
    (hooks) => {
      initialSelection &&
        hooks.visibleColumns.push((columns) => [
          {
            id: 'selection',
            Header: ({ getToggleAllRowsSelectedProps }) => (
              <IndeterminateCheckbox {...getToggleAllRowsSelectedProps()} />
            ),
            Cell: ({ row }: CellProps<TableDataset>) => (
              <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />
            ),
          },
          ...columns,
        ]);
    },
  );

  // React table doesn't seem to expose an "onSelectionEvent" event hook so we must watch for a
  // change to the selected Id within a side effect to prevent a render loop
  useEffect(() => {
    updateSelection && updateSelection(Object.keys(selectedRowIds));
  }, [selectedRowIds]);

  return (
    <TableContainer component={Paper}>
      <Toolbar>
        {ToolbarChild}
        <TextField
          css={css`
            margin-left: auto;
          `}
          inputProps={{ 'aria-label': 'search' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon />
              </InputAdornment>
            ),
          }}
          placeholder={`${preGlobalFilteredRows.length} records...`}
          value={globalFilter || ''}
          onChange={(e) => {
            setGlobalFilter(e.target.value || undefined); // Set undefined to remove the filter entirely
          }}
        />
      </Toolbar>
      <Table {...getTableProps()} size="small">
        <TableHead>
          {headerGroups.map((headerGroup) => (
            // eslint-disable-next-line react/jsx-key
            <TableRow {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                // eslint-disable-next-line react/jsx-key
                <TableCell
                  {...(column.id === 'selection'
                    ? column.getHeaderProps()
                    : column.getHeaderProps(column.getSortByToggleProps()))}
                >
                  {column.render('Header')}
                  {column.id !== 'selection' ? (
                    <TableSortLabel
                      active={column.isSorted}
                      // react-table has a unsorted state which is not treated here
                      direction={column.isSortedDesc ? 'desc' : 'asc'}
                    />
                  ) : null}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody>
          {rows.slice(0, 100).map((row) => {
            prepareRow(row);
            return (
              // eslint-disable-next-line react/jsx-key
              <TableRow {...row.getRowProps()}>
                {row.cells.map((cell) => {
                  // eslint-disable-next-line react/jsx-key
                  return <TableCell {...cell.getCellProps()}>{cell.render('Cell')}</TableCell>;
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
