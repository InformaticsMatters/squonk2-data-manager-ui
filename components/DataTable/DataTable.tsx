import type { ReactNode } from 'react';
import { useMemo } from 'react';
import React from 'react';
import type { CellProps, Column, IdType, PluginHook } from 'react-table';
import { useGlobalFilter, useRowSelect, useSortBy, useTable } from 'react-table';

import type { Error as DMError } from '@squonk/data-manager-client';

import { css } from '@emotion/react';
import {
  Box,
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
  Toolbar,
  Typography,
} from '@material-ui/core';
import SearchRoundedIcon from '@material-ui/icons/SearchRounded';
import type { AxiosError } from 'axios';

import { CenterLoader } from '../CenterLoader';
import { IndeterminateCheckbox } from './IndeterminateCheckbox';

type Selection<Data> = Record<IdType<Data>, boolean>;

export interface DataTableProps<Data extends Record<string, any>> {
  /**
   * Control whether the table is wrapped inside a MuiPaper. Defaults to `true`
   */
  tableContainer?: boolean;
  /**
   * Array of columns for react-table
   */
  columns: Column<Data>[];
  /**
   * Child element of the toolbar in the table header
   */
  ToolbarChild?: ReactNode;
  /**
   * Function to uniquely identify a given row of data
   */
  getRowId?: (row: Data) => IdType<Data>;
  /**
   * Whether the search functionality should be enabled. Defaults to true.
   */
  enableSearch?: boolean;
  /**
   * If using row selection, this sets the initial rows that should be selected on first render.
   */
  initialSelection?: IdType<Data>[];
  /**
   * Called when a row is selected or unselected
   */
  onSelection?: (row: Data, checked: boolean) => void;
  /**
   * Custom actions column placed as the last column.
   */
  useActionsColumnPlugin?: PluginHook<Data>;
  /**
   * Array of data, compatible with columns, for react-table.
   */
  data?: Data[];
  /**
   * If true, displays the loading icon.
   */
  isLoading?: boolean;
  /**
   * If true, displays the provided `error`.
   */
  isError?: boolean;
  /**
   * Error to display. The error is displayed only if `isError` is true.
   */
  error?: void | AxiosError<DMError> | null;
}

// Use a *function* here to avoid the issues with generics in arrow functions
/**
 * Generic table component using react-table and MuiTable.
 *
 * *Example*:
 * ```tsx
 * <DataTable columns={columns} data={datasets} getRowId={(row) => row.dataset_id} />
 * ```
 */
export function DataTable<Data extends Record<string, any>>({
  tableContainer = true,
  columns,
  data,
  ToolbarChild,
  getRowId,
  enableSearch = true,
  initialSelection,
  onSelection,
  useActionsColumnPlugin = () => {
    // Do nothing
  },
  isLoading,
  isError,
  error,
}: DataTableProps<Data>) {
  // According to react-table data passed to it should be memoized to avoid expensive recalculations
  const tableData = useMemo(() => data || [], [data]);

  const {
    getTableProps,
    headerGroups,
    rows,
    prepareRow,
    preGlobalFilteredRows,
    setGlobalFilter,
    state: { globalFilter },
  } = useTable(
    {
      columns,
      data: tableData,
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
            Header: ({ getToggleAllRowsSelectedProps }) => {
              const { onChange, ...props } = getToggleAllRowsSelectedProps();
              return (
                <IndeterminateCheckbox
                  {...props}
                  onChange={(event, checked) => {
                    onSelection && tableData.forEach((row) => onSelection(row, checked));
                    // onSelection && onSelection(row, checked);
                    onChange && onChange(event);
                  }}
                />
              );
            },
            Cell: ({ row }: CellProps<Data>) => {
              const { onChange, ...props } = row.getToggleRowSelectedProps();
              return (
                <IndeterminateCheckbox
                  {...props}
                  onChange={(event, checked) => {
                    onSelection && onSelection(row.original, checked);
                    onChange && onChange(event);
                  }}
                />
              );
            },
          },
          ...columns,
        ]);
    },
  );

  const tableContents = (
    <>
      <Toolbar>
        {ToolbarChild}
        {enableSearch && (
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
        )}
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
      {(isLoading || isError) && (
        <Box overflow="hidden" padding={2}>
          {isLoading && <CenterLoader />}
          {isError && (
            <>
              {error?.message && <Typography color="error">{error.message}</Typography>}
              {error?.response && (
                <Typography color="error">{error.response.data.error}</Typography>
              )}
            </>
          )}
        </Box>
      )}
    </>
  );

  const table = tableContainer ? (
    <TableContainer component={Paper}>{tableContents}</TableContainer>
  ) : (
    tableContents
  );

  return table;
}
